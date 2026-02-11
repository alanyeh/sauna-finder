// Scrape website URLs for saunas using Google Places API.
// For hotels/gyms, attempts to find the specific spa/sauna page.
// Usage: node scripts/scrape-websites.js [--dry-run] [--city=<slug>]

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch websiteUri from Google Places API
async function fetchWebsite(placeId) {
  if (!placeId) return null;

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'websiteUri',
      },
    }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.websiteUri || null;
}

// For hotels/gyms, try to find a direct spa/sauna page by checking common URL patterns
async function findSpaPage(baseUrl, name, types) {
  const isHotel = (types || []).some(t =>
    ['Hotel Spa', 'Resort'].includes(t)
  ) || /hotel|resort/i.test(name);

  const isGym = (types || []).some(t => t === 'Gym Sauna')
    || /gym|fitness|climbing|boulders|ymca|equinox|life\s*time|tmpl/i.test(name);

  if (!isHotel && !isGym) return baseUrl;

  // Common spa/sauna subpage paths to try
  const subpages = isHotel
    ? ['/spa', '/wellness', '/spa-wellness', '/amenities/spa', '/amenities', '/wellness-spa', '/the-spa', '/spa-fitness']
    : ['/sauna', '/spa', '/amenities', '/facilities', '/wellness'];

  const baseOrigin = new URL(baseUrl).origin;

  for (const path of subpages) {
    const testUrl = baseOrigin + path;
    try {
      const res = await fetch(testUrl, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        return testUrl;
      }
    } catch {
      // timeout or network error, skip
    }
  }

  // No spa subpage found, return the base URL
  return baseUrl;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1] || null;

  if (!API_KEY) {
    console.error('Missing GOOGLE_PLACES_API_KEY in .env.local');
    process.exit(1);
  }

  console.log('\n=== Scraping website URLs ===');
  if (dryRun) console.log('  [DRY RUN — no DB writes]');
  if (cityArg) console.log(`  [CITY: ${cityArg}]`);
  console.log('');

  // Fetch saunas missing website_url (or all, to find spa-specific pages for hotels/gyms)
  let query = supabase
    .from('saunas')
    .select('id, name, place_id, website_url, types')
    .order('id', { ascending: true });

  if (cityArg) query = query.eq('city_slug', cityArg);

  const { data: saunas, error } = await query;
  if (error) { console.error(error.message); process.exit(1); }

  const needsUrl = saunas.filter(s => !s.website_url && s.place_id);
  const hasUrl = saunas.filter(s => s.website_url);
  const noPlaceId = saunas.filter(s => !s.website_url && !s.place_id);

  console.log(`Total saunas: ${saunas.length}`);
  console.log(`  Missing website + has place_id: ${needsUrl.length} (will fetch)`);
  console.log(`  Already has website: ${hasUrl.length} (will check for spa page)`);
  console.log(`  Missing website + no place_id: ${noPlaceId.length} (skipped)`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Phase 1: Fetch missing website URLs from Google Places
  if (needsUrl.length > 0) {
    console.log('--- Phase 1: Fetching missing website URLs ---');
    for (let i = 0; i < needsUrl.length; i++) {
      const sauna = needsUrl[i];
      process.stdout.write(`  [${i + 1}/${needsUrl.length}] ${sauna.name}...`);

      try {
        let url = await fetchWebsite(sauna.place_id);
        await sleep(300);

        if (!url) {
          console.log(' no website found');
          skipped++;
          continue;
        }

        // For hotels/gyms, try to find the spa-specific page
        url = await findSpaPage(url, sauna.name, sauna.types);

        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from('saunas')
            .update({ website_url: url })
            .eq('id', sauna.id);
          if (updateErr) throw new Error(updateErr.message);
        }

        console.log(` ${url}`);
        updated++;
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        errors++;
      }
    }
    console.log('');
  }

  // Phase 2: For hotels/gyms that already have a base URL, try to find spa-specific page
  const hotelsGyms = hasUrl.filter(s => {
    const types = s.types || [];
    const isHotel = types.includes('Hotel Spa') || types.includes('Resort') || /hotel|resort/i.test(s.name);
    const isGym = types.includes('Gym Sauna') || /gym|fitness|climbing|boulders|ymca/i.test(s.name);
    return isHotel || isGym;
  });

  if (hotelsGyms.length > 0) {
    console.log('--- Phase 2: Finding spa pages for hotels/gyms ---');
    for (let i = 0; i < hotelsGyms.length; i++) {
      const sauna = hotelsGyms[i];
      process.stdout.write(`  [${i + 1}/${hotelsGyms.length}] ${sauna.name}...`);

      try {
        const spaUrl = await findSpaPage(sauna.website_url, sauna.name, sauna.types);

        if (spaUrl !== sauna.website_url) {
          if (!dryRun) {
            const { error: updateErr } = await supabase
              .from('saunas')
              .update({ website_url: spaUrl })
              .eq('id', sauna.id);
            if (updateErr) throw new Error(updateErr.message);
          }
          console.log(` ${sauna.website_url} → ${spaUrl}`);
          updated++;
        } else {
          console.log(' no spa page found, keeping base URL');
          skipped++;
        }
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        errors++;
      }
    }
    console.log('');
  }

  console.log('--- Summary ---');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
