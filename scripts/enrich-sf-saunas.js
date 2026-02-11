import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Google Places API helpers ──────────────────────────────────────────────────

// Fetch place details (rating, review count) by place_id
async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "id,rating,userRatingCount,photos",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place details failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Text search to find a place_id by name + address
async function findPlaceId(name, address) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos",
    },
    body: JSON.stringify({
      textQuery: `${name} ${address}`,
      maxResultCount: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Text search failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  return data.places?.[0] || null;
}

// Download a photo and upload to Supabase Storage
async function downloadAndUploadPhoto(photoName, saunaId, index) {
  const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&key=${API_KEY}`;
  const res = await fetch(photoUrl);
  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());
  const fileName = `${saunaId}-${index}-${Date.now()}.jpg`;

  const { error } = await supabase.storage
    .from("sauna-photos")
    .upload(`public/${fileName}`, buffer, { contentType: "image/jpeg" });

  if (error) {
    console.log(`    Upload failed: ${error.message}`);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("sauna-photos").getPublicUrl(`public/${fileName}`);

  return publicUrl;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Enrich SF saunas: Google ratings + missing photos ===\n");

  if (!API_KEY) {
    console.error("Missing GOOGLE_PLACES_API_KEY in .env.local");
    process.exit(1);
  }

  // Fetch all SF saunas
  const { data: saunas, error } = await supabase
    .from("saunas")
    .select("id, name, address, place_id, rating, rating_count, photos")
    .eq("city_slug", "sf")
    .order("id");

  if (error) {
    console.error("Fetch error:", error.message);
    process.exit(1);
  }

  console.log(`Found ${saunas.length} SF saunas\n`);

  let ratingsUpdated = 0;
  let photosUpdated = 0;
  let placeIdsFound = 0;

  for (const sauna of saunas) {
    console.log(`--- ${sauna.name} (ID ${sauna.id}) ---`);

    const updates = {};
    let placeData = null;

    // Step 1: If missing place_id, find it via text search
    if (!sauna.place_id) {
      console.log("  Finding place_id via text search...");
      try {
        const result = await findPlaceId(sauna.name, sauna.address);
        if (result) {
          updates.place_id = result.id;
          placeData = result;
          placeIdsFound++;
          console.log(`  Found place_id: ${result.id}`);
        } else {
          console.log("  No result found");
        }
      } catch (err) {
        console.log(`  Search error: ${err.message}`);
      }
      await sleep(300);
    }

    // Step 2: Fetch rating from Google Places
    const placeId = updates.place_id || sauna.place_id;
    if (placeId && !placeData) {
      try {
        placeData = await getPlaceDetails(placeId);
      } catch (err) {
        console.log(`  Details error: ${err.message}`);
      }
      await sleep(300);
    }

    if (placeData) {
      const newRating = placeData.rating;
      const newCount = placeData.userRatingCount;
      if (newRating != null) {
        updates.rating = newRating;
        updates.rating_count = newCount || 0;
        console.log(`  Rating: ${newRating} (${newCount} reviews)`);
        ratingsUpdated++;
      }
    }

    // Step 3: Fetch photos if missing
    const hasPhotos = (sauna.photos || []).length > 0;
    if (!hasPhotos && placeData?.photos?.length > 0) {
      console.log(`  Downloading ${Math.min(placeData.photos.length, 5)} photos...`);
      const photoUrls = [];

      for (let i = 0; i < Math.min(placeData.photos.length, 5); i++) {
        const url = await downloadAndUploadPhoto(
          placeData.photos[i].name,
          sauna.id,
          i
        );
        if (url) {
          photoUrls.push(url);
          console.log(`    Photo ${i + 1} uploaded`);
        }
        await sleep(300);
      }

      if (photoUrls.length > 0) {
        updates.photos = photoUrls;
        photosUpdated++;
        console.log(`  ${photoUrls.length} photos saved`);
      }
    } else if (hasPhotos) {
      console.log(`  Photos: already has ${sauna.photos.length}`);
    }

    // Step 4: Write updates to Supabase
    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from("saunas")
        .update(updates)
        .eq("id", sauna.id);

      if (updateErr) {
        console.log(`  DB update error: ${updateErr.message}`);
      } else {
        console.log(`  Updated: ${Object.keys(updates).join(", ")}`);
      }
    } else {
      console.log("  No updates needed");
    }

    console.log("");
    await sleep(200);
  }

  console.log("=== Summary ===");
  console.log(`  Ratings updated: ${ratingsUpdated}/${saunas.length}`);
  console.log(`  Photos added: ${photosUpdated} saunas`);
  console.log(`  Place IDs found: ${placeIdsFound}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
