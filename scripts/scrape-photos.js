import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function fetchPhotosFromPlaces(placeId) {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${process.env.GOOGLE_PLACES_API_KEY}`
    );
    const data = await response.json();
    // Return up to 5 photos
    return data.photos?.slice(0, 5) || [];
  } catch (error) {
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
      const photoUrl = `https://places.googleapis.com/v1/${photoData.name}/media?maxHeightPx=600&key=${process.env.GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(photoUrl);
      const buffer = await response.buffer();

      // Upload to Supabase Storage
      const fileName = `${sauna.id}-${i}-${Date.now()}.jpg`;
      const { data, error } = await supabase.storage
        .from('sauna-photos')
        .upload(`public/${fileName}`, buffer, {
          contentType: 'image/jpeg'
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('sauna-photos')
        .getPublicUrl(`public/${fileName}`);

      photoUrls.push(publicUrl);
    }

    // Update sauna with array of photo URLs
    const { error: updateError } = await supabase
      .from('saunas')
      .update({ photos: photoUrls })
      .eq('id', sauna.id);

    if (updateError) throw updateError;

    console.log(`✓ Added ${photoUrls.length} photo(s) for ${sauna.name}`);
    return photoUrls;
  } catch (error) {
    console.error(`✗ Failed to process ${sauna.name}:`, error.message);
    return null;
  }
}

async function scrapeAllSaunas() {
  console.log('🚀 Starting photo scraping...\n');

  // Fetch saunas from Supabase
  const { data: saunas, error } = await supabase
    .from('saunas')
    .select('*')
    .is('photos', null); // Only fetch saunas without photos

  if (error) {
    console.error('Error fetching saunas:', error.message);
    return;
  }

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
}

scrapeAllSaunas().catch(console.error);
