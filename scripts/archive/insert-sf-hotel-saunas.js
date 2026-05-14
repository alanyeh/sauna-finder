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

// ─── SF Hotel Saunas ────────────────────────────────────────────────────────────
// Verified as currently operating with sauna/steam facilities (Feb 2026).
// Excludes Four Seasons (already in DB as Equinox Sports Club, ID 63).
// Excludes Westin St. Francis (spa reported closed).
const SF_HOTEL_SAUNAS = [
  {
    name: "Hotel Nikko San Francisco",
    address: "222 Mason St, San Francisco, CA 94102",
    neighborhood: "Union Square",
    lat: 37.7866,
    lng: -122.4094,
    price: "$$$",
    types: ["Hotel Spa"],
    amenities: ["steam_room", "pool", "massage"],
    hours: "Pool: Daily 6AM-10PM, Health Club: 24 hours",
    description: "10,000 sq ft rooftop health club with glass-enclosed indoor pool, dry sauna, steam room, and hot tub.",
    city_slug: "sf",
    website_url: "https://www.hotelnikkosf.com/",
    gender_policy: "Co-ed",
  },
  {
    name: "Fairmont San Francisco",
    address: "950 California St, San Francisco, CA 94108",
    neighborhood: "Nob Hill",
    lat: 37.7920,
    lng: -122.4100,
    price: "$$$",
    types: ["Hotel Spa"],
    amenities: ["steam_room", "massage"],
    hours: "Mon-Thu: 6AM-10PM, Fri: 6AM-7PM, Sat-Sun: 7AM-6PM",
    description: "Historic Nob Hill landmark hotel with sauna, eucalyptus steam room, and full-service wellness spa.",
    city_slug: "sf",
    website_url: "https://www.fairmont.com/san-francisco/",
    gender_policy: null,
  },
  {
    name: "The Ritz-Carlton, San Francisco",
    address: "600 Stockton St, San Francisco, CA 94108",
    neighborhood: "Nob Hill",
    lat: 37.7912,
    lng: -122.4073,
    price: "$$$",
    types: ["Hotel Spa"],
    amenities: ["steam_room", "massage"],
    hours: "Fitness center: 24 hours, Spa: by appointment",
    description: "Luxury Nob Hill hotel with L'Occitane spa, sauna, steam rooms, and 24-hour fitness center.",
    city_slug: "sf",
    website_url: "https://www.ritzcarlton.com/en/hotels/california/san-francisco",
    gender_policy: null,
  },
  {
    name: "Palace Hotel",
    address: "2 New Montgomery St, San Francisco, CA 94105",
    neighborhood: "SoMa",
    lat: 37.7880,
    lng: -122.4017,
    price: "$$$",
    types: ["Hotel Spa"],
    amenities: ["pool", "massage"],
    hours: "Pool & fitness: Daily 6AM-9PM",
    description: "Historic luxury hotel with glass-domed indoor pool, sauna, jacuzzi, and 24-hour fitness center.",
    city_slug: "sf",
    website_url: "https://www.sfpalace.com/",
    gender_policy: null,
  },
  {
    name: "The Donatello",
    address: "501 Post St, San Francisco, CA 94102",
    neighborhood: "Union Square",
    lat: 37.7879,
    lng: -122.4108,
    price: "$$$",
    types: ["Hotel Spa"],
    amenities: ["massage", "private"],
    hours: "Check with hotel for spa hours",
    description: "Boutique Union Square hotel with rooftop lounge, men's and women's saunas, whirlpool spa, and massage.",
    city_slug: "sf",
    website_url: "https://www.clubdonatello.org/",
    gender_policy: "Gender-separated saunas",
  },
  {
    name: "Handlery Union Square Hotel",
    address: "351 Geary St, San Francisco, CA 94102",
    neighborhood: "Union Square",
    lat: 37.7871,
    lng: -122.4099,
    price: "$$",
    types: ["Hotel Spa"],
    amenities: ["pool"],
    hours: "Pool: Daily 8AM-8PM, Hotel: 24 hours",
    description: "Classic Union Square hotel with heated outdoor pool, dry sauna, and sun loungers.",
    city_slug: "sf",
    website_url: "https://sf.handlery.com/",
    gender_policy: null,
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Insert & Enrich SF Hotel Saunas ===\n");

  if (!API_KEY) {
    console.error("Missing GOOGLE_PLACES_API_KEY in .env.local");
    process.exit(1);
  }

  // Step 1: Check for duplicates
  console.log("Checking existing SF saunas...");
  const { data: existing, error: fetchErr } = await supabase
    .from("saunas")
    .select("id, name")
    .eq("city_slug", "sf");

  if (fetchErr) {
    console.error("Fetch error:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${existing.length} existing SF saunas\n`);

  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const toInsert = [];
  const skipped = [];

  for (const sauna of SF_HOTEL_SAUNAS) {
    const normName = normalize(sauna.name);
    const isDupe = existing.some((ex) => {
      const exNorm = normalize(ex.name);
      return exNorm === normName || exNorm.includes(normName) || normName.includes(exNorm);
    });
    if (isDupe) {
      skipped.push(sauna.name);
    } else {
      toInsert.push(sauna);
    }
  }

  if (skipped.length > 0) {
    console.log(`Skipping ${skipped.length} duplicates:`);
    skipped.forEach((n) => console.log(`  - ${n}`));
    console.log("");
  }

  if (toInsert.length === 0) {
    console.log("No new hotel saunas to insert.");
    return;
  }

  // Step 2: Insert into Supabase
  console.log(`Inserting ${toInsert.length} hotel saunas...\n`);
  const { data: inserted, error: insertErr } = await supabase
    .from("saunas")
    .insert(toInsert)
    .select("id, name, address");

  if (insertErr) {
    console.error("Insert error:", insertErr.message);
    process.exit(1);
  }

  for (const row of inserted) {
    console.log(`  Inserted ID ${row.id}: ${row.name}`);
  }
  console.log("");

  // Step 3: Enrich each with Google Places (place_id, rating, photos)
  console.log("Enriching with Google Places data...\n");

  for (const row of inserted) {
    console.log(`--- ${row.name} (ID ${row.id}) ---`);
    const updates = {};

    try {
      const place = await findPlaceId(row.name, row.address);
      if (place) {
        updates.place_id = place.id;
        console.log(`  Place ID: ${place.id}`);

        if (place.rating != null) {
          updates.rating = place.rating;
          updates.rating_count = place.userRatingCount || 0;
          console.log(`  Rating: ${place.rating} (${place.userRatingCount} reviews)`);
        }

        if (place.photos?.length > 0) {
          const count = Math.min(place.photos.length, 5);
          console.log(`  Downloading ${count} photos...`);
          const photoUrls = [];

          for (let i = 0; i < count; i++) {
            const url = await downloadAndUploadPhoto(place.photos[i].name, row.id, i);
            if (url) {
              photoUrls.push(url);
              console.log(`    Photo ${i + 1} uploaded`);
            }
            await sleep(300);
          }

          if (photoUrls.length > 0) {
            updates.photos = photoUrls;
          }
        }
      } else {
        console.log("  No Google Places result found");
      }
    } catch (err) {
      console.log(`  Error: ${err.message}`);
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateErr } = await supabase
        .from("saunas")
        .update(updates)
        .eq("id", row.id);

      if (updateErr) {
        console.log(`  DB update error: ${updateErr.message}`);
      } else {
        console.log(`  Updated: ${Object.keys(updates).join(", ")}`);
      }
    }

    console.log("");
    await sleep(300);
  }

  console.log(`Done! Inserted and enriched ${inserted.length} SF hotel saunas.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
