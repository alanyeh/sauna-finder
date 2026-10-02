import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Fetch OG images and hero images from sauna websites
async function fetchPageImages(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html',
      },
      redirect: 'follow',
    });
    if (!res.ok) return [];
    const html = await res.text();

    const images = [];

    // OG image (usually the best hero image)
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) images.push(ogMatch[1]);

    // Twitter card image
    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
    if (twMatch && !images.includes(twMatch[1])) images.push(twMatch[1]);

    // Large images from img tags (hero images, etc.)
    const imgRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      let src = match[0];
      let imgUrl = match[1];

      // Skip tiny icons, svgs, tracking pixels, data URIs
      if (/\.svg|favicon|icon|logo|pixel|tracking|badge|avatar|1x1/i.test(imgUrl)) continue;
      if (imgUrl.startsWith('data:')) continue;
      if (imgUrl.length < 10) continue;

      // Look for width/height hints suggesting a large image
      const widthMatch = src.match(/width=["']?(\d+)/i);
      const hasLargeClass = /hero|banner|cover|feature|gallery|slider|main/i.test(src);

      if (hasLargeClass || (widthMatch && parseInt(widthMatch[1]) >= 400)) {
        if (!images.includes(imgUrl)) images.push(imgUrl);
      }
    }

    // Resolve relative URLs
    const base = new URL(url);
    return images.slice(0, 5).map(img => {
      if (img.startsWith('//')) return 'https:' + img;
      if (img.startsWith('/')) return base.origin + img;
      if (img.startsWith('http')) return img;
      return base.origin + '/' + img;
    });
  } catch (err) {
    console.log(`  Error fetching ${url}: ${err.message}`);
    return [];
  }
}

async function downloadAndUpload(supabaseId, imageUrl) {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/*',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const buffer = Buffer.from(await res.arrayBuffer());

    // Skip tiny images (likely icons)
    if (buffer.length < 5000) return null;

    const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
    const fileName = `${supabaseId}-web-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('sauna-photos')
      .upload(`public/${fileName}`, buffer, { contentType });

    if (error) {
      console.log(`    Upload error: ${error.message}`);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('sauna-photos')
      .getPublicUrl(`public/${fileName}`);

    return publicUrl;
  } catch (err) {
    console.log(`    Download error: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1];
  const idsArg = args.find(a => a.startsWith('--ids='))?.split('=')[1];

  if (!cityArg && !idsArg) {
    console.error('Usage: node scripts/fetch-website-photos.js --city=<slug> | --ids=1,2,3');
    console.error('Fetches OG/hero images from websites of saunas that have no photos yet.');
    process.exit(1);
  }

  let query = supabase
    .from('saunas')
    .select('id, name, website_url')
    .is('photos', null)
    .order('id', { ascending: true });
  if (cityArg) query = query.eq('city_slug', cityArg);
  if (idsArg) query = query.in('id', idsArg.split(',').map(Number));

  const { data: saunas, error } = await query;

  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${saunas.length} saunas needing photos\n`);

  for (const sauna of saunas) {
    if (!sauna.website_url) {
      console.log(`⊘ ${sauna.name}: no website URL`);
      continue;
    }

    console.log(`→ ${sauna.name} (${sauna.website_url})`);

    const imageUrls = await fetchPageImages(sauna.website_url);
    if (imageUrls.length === 0) {
      console.log(`  No images found on website\n`);
      continue;
    }

    console.log(`  Found ${imageUrls.length} candidate image(s)`);
    const uploadedUrls = [];

    for (const imgUrl of imageUrls) {
      console.log(`  Downloading: ${imgUrl.slice(0, 80)}...`);
      const publicUrl = await downloadAndUpload(sauna.id, imgUrl);
      if (publicUrl) {
        uploadedUrls.push(publicUrl);
        console.log(`    ✓ Uploaded`);
      } else {
        console.log(`    ✗ Skipped`);
      }
    }

    if (uploadedUrls.length > 0) {
      const { error: updateErr } = await supabase
        .from('saunas')
        .update({ photos: uploadedUrls })
        .eq('id', sauna.id);

      if (updateErr) {
        console.log(`  DB update failed: ${updateErr.message}\n`);
      } else {
        console.log(`  ✓ Saved ${uploadedUrls.length} photo(s) to DB\n`);
      }
    } else {
      console.log(`  No usable images uploaded\n`);
    }
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
