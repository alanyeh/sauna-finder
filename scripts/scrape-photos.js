import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { fetchPlacesJSON, PlacesQuotaError } from './lib/places.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fetchPhotosFromPlaces(placeId) {
  try {
    const data = await fetchPlacesJSON(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY, 'X-Goog-FieldMask': 'photos' },
    });
    // Return up to 5 photos
    return data.photos?.slice(0, 5) || [];
  } catch (error) {
    if (error instanceof PlacesQuotaError) throw error;
    console.error(`Error fetching photos for ${placeId}:`, error.message);
    return [];
  }
}

async function downloadAndUploadPhotos(sauna) {
  try {
    // Get photo metadata from Google Places
    const photoDatas = await fetchPhotosFromPlaces(sauna.place_id);
    if (photoDatas.length === 0) {
      console.log(`⊘ No photos found for ${sauna.name}`);
      return null;
    }

    console.log(`⬇ Downloading ${photoDatas.length} photo(s) for ${sauna.name}...`);
    const photoUrls = [];

    // Download and upload each photo
    for (let i = 0; i < photoDatas.length; i++) {
      const photoData = photoDatas[i];
      const photoUrl = `https://places.googleapis.com/v1/${photoData.name}/media?maxHeightPx=600`;

      const response = await fetch(photoUrl, {
        headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY },
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error(`Photo download HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) throw new Error('Photo response is not an image');
      const buffer = await response.buffer();
      if (buffer.length < 5000) throw new Error('Photo response is too small');

      // Upload to Supabase Storage
      const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
      const fileName = `${sauna.id}-${i}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from('sauna-photos')
        .upload(`public/${fileName}`, buffer, {
          contentType
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sauna-photos')
        .getPublicUrl(`public/${fileName}`);

      photoUrls.push(publicUrl);
    }

    // Update sauna with array of photo URLs
    let update = supabase
      .from('saunas')
      .update({ photos: photoUrls, updated_at: new Date().toISOString() })
      .eq('id', sauna.id);
    update = sauna.updated_at ? update.eq('updated_at', sauna.updated_at) : update.is('updated_at', null);
    const { data: updated, error: updateError } = await update.select('id');

    if (updateError) throw updateError;
    if (!updated.length) throw new Error('Listing changed during photo download; update skipped');

    console.log(`✓ Added ${photoUrls.length} photo(s) for ${sauna.name}`);
    return photoUrls;
  } catch (error) {
    if (error instanceof PlacesQuotaError) throw error;
    console.error(`✗ Failed to process ${sauna.name}:`, error.message);
    return null;
  }
}

async function scrapeAllSaunas() {
  console.log('🚀 Starting photo scraping...\n');

  // Fetch saunas from Supabase
  const idsArg = process.argv.slice(2).find(arg => arg.startsWith('--ids='));
  const ids = idsArg?.slice(6).split(',').map(Number);
  if (ids && (!ids.length || ids.some(id => !Number.isInteger(id) || id <= 0))) {
    throw new Error('Use --ids=946,947 with positive integer listing IDs');
  }
  let query = supabase
    .from('saunas')
    .select('*')
    .order('id');
  if (ids) query = query.in('id', ids);
  const { data: rows, error } = await query;

  if (error) {
    console.error('Error fetching saunas:', error.message);
    throw error;
  }
  const saunas = rows.filter(row => !row.photos?.length);

  console.log(`Found ${saunas.length} saunas without photos\n`);

  let successCount = 0;
  for (let i = 0; i < saunas.length; i++) {
    const sauna = saunas[i];
    console.log(`[${i + 1}/${saunas.length}]`);

    const result = await downloadAndUploadPhotos(sauna);
    if (result) successCount++;

    // Add delay to avoid rate limiting (Google and Supabase)
    if (i < saunas.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  console.log(`\n✅ Photo scraping complete! Successfully added ${successCount}/${saunas.length} saunas with photos`);
  if (successCount !== saunas.length) process.exitCode = 1;
}

scrapeAllSaunas().catch(error => { console.error(error.message); process.exitCode = 1; });
