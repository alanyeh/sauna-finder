import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function lookupPlaceId(name, address) {
  const query = `${name} ${address}`;
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify({ textQuery: query }),
  });

  const data = await response.json();

  if (data.places && data.places.length > 0) {
    return data.places[0].id;
  }
  return null;
}

async function main() {
  console.log("=== Look Up Google Place IDs for Saunas ===\n");

  // Fetch saunas missing place_id
  const { data: saunas, error } = await supabase
    .from("saunas")
    .select("id, name, address, place_id")
    .or("place_id.is.null,place_id.eq.");

  if (error) {
    console.error("Error fetching saunas:", error.message);
    process.exit(1);
  }

  console.log(`Found ${saunas.length} saunas without Place IDs\n`);

  let updated = 0;
  for (let i = 0; i < saunas.length; i++) {
    const sauna = saunas[i];
    console.log(`[${i + 1}/${saunas.length}] Looking up: ${sauna.name}...`);

    try {
      const placeId = await lookupPlaceId(sauna.name, sauna.address);

      if (placeId) {
        const { error: updateErr } = await supabase
          .from("saunas")
          .update({ place_id: placeId })
          .eq("id", sauna.id);

        if (updateErr) {
          console.error(`  ✗ Failed to update: ${updateErr.message}`);
        } else {
          console.log(`  ✓ ${placeId}`);
          updated++;
        }
      } else {
        console.log(`  ⊘ No result found`);
      }
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
    }

    // Rate limit delay
    if (i < saunas.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\nDone! Updated ${updated}/${saunas.length} Place IDs.`);
  console.log("Now run 'node scripts/scrape-photos.js' to fetch photos.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
