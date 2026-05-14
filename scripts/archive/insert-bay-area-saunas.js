import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── New Bay Area Saunas ────────────────────────────────────────────────────────
// All verified as real, currently operating businesses (as of Feb 2026).
// Covers East Bay, South Bay, Peninsula, North Bay, and additional SF-adjacent spots.
// Coordinates are approximate and will be refined by Google Places enrichment.
const NEW_BAY_AREA_SAUNAS = [

  // ── East Bay ──────────────────────────────────────────────────────────────────

  {
    name: "Good Hot",
    address: "1950 Stenmark Dr, Richmond, CA 94801",
    neighborhood: "Richmond",
    lat: 37.9131,
    lng: -122.3617,
    rating: 4.8,
    rating_count: 42,
    price: "$$$",
    types: ["Boutique Sauna"],
    amenities: ["cold_plunge", "coed", "private"],
    hours: "Thu-Mon: by reservation (90-min sessions), Tue-Wed: Closed",
    place_id: "",
    description: "Worker-owned waterfront cedar saunas on the Richmond shoreline with cold plunge directly into SF Bay.",
    city_slug: "sf",
    website_url: "https://good-hot.com/",
    gender_policy: "Co-ed",
  },
  {
    name: "Albany Sauna & Hot Tubs",
    address: "1002 Solano Ave, Albany, CA 94706",
    neighborhood: "Albany",
    lat: 37.8900,
    lng: -122.2978,
    rating: 4.3,
    rating_count: 249,
    price: "$",
    types: ["Traditional Banya"],
    amenities: ["steam_room", "massage", "private"],
    hours: "Daily: 10:30AM-9PM",
    place_id: "",
    description: "Historic Finnish-style steam sauna built in 1934 with outdoor hot tubs and massage therapy on Solano Ave.",
    city_slug: "sf",
    website_url: "https://www.albanysauna.com/",
    gender_policy: null,
  },
  {
    name: "Reboot Float & Cryo Spa — Oakland",
    address: "6239 College Ave, Oakland, CA 94618",
    neighborhood: "Rockridge",
    lat: 37.8501,
    lng: -122.2528,
    rating: 4.7,
    rating_count: 206,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Mon: 11AM-8PM, Tue: 1PM-8PM, Wed-Thu: 11AM-8PM, Fri: 11AM-9PM, Sat-Sun: 10AM-9PM",
    place_id: "",
    description: "Float therapy, cryotherapy, and private infrared sauna with cold plunge contrast therapy in Rockridge.",
    city_slug: "sf",
    website_url: "https://www.rebootfloatspa.com/",
    gender_policy: null,
  },
  {
    name: "Perspire Sauna Studio — Berkeley",
    address: "2598 Shattuck Ave, Berkeley, CA 94704",
    neighborhood: "Berkeley",
    lat: 37.8633,
    lng: -122.2676,
    rating: 4.7,
    rating_count: 52,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["private"],
    hours: "Mon-Fri: 7AM-9PM, Sat: 8AM-7PM, Sun: 8AM-6PM",
    place_id: "",
    description: "Private full-spectrum infrared sauna suites with red light therapy and chromotherapy in downtown Berkeley.",
    city_slug: "sf",
    website_url: "https://www.perspiresaunastudio.com/ca/berkeley/",
    gender_policy: null,
  },
  {
    name: "Worthy Self-Care Studio",
    address: "2633 Ashby Ave, Berkeley, CA 94705",
    neighborhood: "Berkeley",
    lat: 37.8563,
    lng: -122.2582,
    rating: 4.9,
    rating_count: 51,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Mon: 3PM-7PM, Tue-Thu: 10AM-7PM, Fri: 10AM-6PM, Sat-Sun: 9:30AM-3PM",
    place_id: "",
    description: "Boutique self-care studio with infrared sauna, guided cold plunge, red light therapy, and lymphatic drainage.",
    city_slug: "sf",
    website_url: "https://worthyselfcare.com/",
    gender_policy: null,
  },
  {
    name: "Piedmont Springs",
    address: "3939 Piedmont Ave, Oakland, CA 94611",
    neighborhood: "Piedmont",
    lat: 37.8279,
    lng: -122.2501,
    rating: 4.2,
    rating_count: 716,
    price: "$",
    types: ["Day Spa"],
    amenities: ["steam_room", "massage", "private"],
    hours: "Daily: 11AM-10PM",
    place_id: "",
    description: "Neighborhood spa with private outdoor hot tubs, Finnish sauna, steam room, and therapeutic massage since the 1970s.",
    city_slug: "sf",
    website_url: "https://www.piedmontsprings.com/",
    gender_policy: null,
  },
  {
    name: "PSY Spa USA",
    address: "14075 E 14th St, San Leandro, CA 94578",
    neighborhood: "San Leandro",
    lat: 37.7048,
    lng: -122.1526,
    rating: 4.0,
    rating_count: 663,
    price: "$",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage"],
    hours: "Daily: 9AM-9:30PM",
    place_id: "",
    description: "Korean fusion day spa with dry saunas, wood sauna, cold pool, body scrubs, and massage in the East Bay.",
    city_slug: "sf",
    website_url: "https://www.psyspausa.com/",
    gender_policy: "Gender-separated facilities",
  },

  // ── South Bay / Peninsula ─────────────────────────────────────────────────────

  {
    name: "Bay Spa",
    address: "2908 El Camino Real, Ste 160, Santa Clara, CA 95051",
    neighborhood: "Santa Clara",
    lat: 37.3506,
    lng: -121.9756,
    rating: 4.4,
    rating_count: 279,
    price: "$$",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool", "coed"],
    hours: "Mon-Fri: 10AM-10PM, Sat-Sun: 9AM-10PM",
    place_id: "",
    description: "18,000 sq ft Korean jjimjilbang with four customized sauna rooms, pools, body scrubs, and Korean food.",
    city_slug: "sf",
    website_url: "https://www.bayspaca.com/",
    gender_policy: "Co-ed common areas, gender-separated wet areas",
  },
  {
    name: "Family K Spa",
    address: "70 Saratoga Ave, Santa Clara, CA 95051",
    neighborhood: "Santa Clara",
    lat: 37.3513,
    lng: -121.9782,
    rating: 4.1,
    rating_count: 212,
    price: "$$",
    types: ["Korean Spa"],
    amenities: ["steam_room", "massage", "coed"],
    hours: "Daily: 9AM-10PM",
    place_id: "",
    description: "Authentic Korean jimjilbang with Crystal, Clay, and Jade sauna rooms, body scrubs, and communal lounging.",
    city_slug: "sf",
    website_url: "https://www.familykspa.com/",
    gender_policy: "Co-ed common areas, gender-separated wet areas",
  },
  {
    name: "Immersion Spa",
    address: "3990 El Camino Real, Palo Alto, CA 94306",
    neighborhood: "Palo Alto",
    lat: 37.4134,
    lng: -122.1271,
    rating: 3.9,
    rating_count: 769,
    price: "$$",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage"],
    hours: "Mon-Thu: 10AM-8PM, Fri-Sun: 9AM-9PM",
    place_id: "",
    description: "First Aveda concept Korean spa in the Bay Area with herbal dry sauna, eucalyptus steam room, and full body scrubs.",
    city_slug: "sf",
    website_url: "https://immersionspa.com/",
    gender_policy: "Gender-separated wet areas",
  },
  {
    name: "Watercourse Way",
    address: "165 Channing Ave, Palo Alto, CA 94301",
    neighborhood: "Palo Alto",
    lat: 37.4437,
    lng: -122.1621,
    rating: 4.4,
    rating_count: 1890,
    price: "$$",
    types: ["Day Spa"],
    amenities: ["cold_plunge", "steam_room", "massage", "private"],
    hours: "Mon-Thu: 8AM-11:30PM, Fri-Sat: 8AM-12:30AM, Sun: 8AM-11:30PM",
    place_id: "",
    description: "Beloved Palo Alto spa with private hot tub rooms, sauna, steam room, cold plunge, and massage since 1980.",
    city_slug: "sf",
    website_url: "https://watercourseway.com/",
    gender_policy: null,
  },
  {
    name: "Perspire Sauna Studio — Mountain View",
    address: "555 San Antonio Rd, Unit 38, Mountain View, CA 94040",
    neighborhood: "Mountain View",
    lat: 37.4016,
    lng: -122.1136,
    rating: 4.6,
    rating_count: 15,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["private"],
    hours: "Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-7PM",
    place_id: "",
    description: "Private full-spectrum infrared sauna suites with red light therapy and chromotherapy in Mountain View.",
    city_slug: "sf",
    website_url: "https://www.perspiresaunastudio.com/ca/mountain-view/",
    gender_policy: null,
  },
  {
    name: "Perspire Sauna Studio — Santa Clara",
    address: "3935 Rivermark Plz, Santa Clara, CA 95054",
    neighborhood: "Santa Clara",
    lat: 37.3938,
    lng: -121.9557,
    rating: 4.5,
    rating_count: 31,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["private"],
    hours: "Mon-Fri: 7AM-9PM, Sat-Sun: 8AM-8PM",
    place_id: "",
    description: "Private full-spectrum infrared sauna suites with red light and color therapy in the Rivermark district.",
    city_slug: "sf",
    website_url: "https://www.perspiresaunastudio.com/ca/santa-clara/",
    gender_policy: null,
  },

  // ── SF-Adjacent ───────────────────────────────────────────────────────────────

  {
    name: "SweatHouz — Daly City",
    address: "37 Colma Blvd, Colma, CA 94014",
    neighborhood: "Daly City",
    lat: 37.6710,
    lng: -122.4570,
    rating: 4.5,
    rating_count: 21,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Daily: 7AM-9PM",
    place_id: "",
    description: "Private contrast therapy suites with infrared sauna, cold plunge, and vitamin C shower south of SF.",
    city_slug: "sf",
    website_url: "https://sweathouz.com/daly-city-book-now/",
    gender_policy: null,
  },

  // ── North Bay ─────────────────────────────────────────────────────────────────

  {
    name: "Osmosis Day Spa Sanctuary",
    address: "209 Bohemian Hwy, Freestone, CA 95472",
    neighborhood: "Sonoma County",
    lat: 38.3730,
    lng: -122.9143,
    rating: 4.5,
    rating_count: 545,
    price: "$$$",
    types: ["Day Spa"],
    amenities: ["massage", "private"],
    hours: "Daily: 9AM-9PM",
    place_id: "",
    description: "Unique cedar enzyme bath experience in Zen-inspired gardens, voted Best Spa in Sonoma County 17 years running.",
    city_slug: "sf",
    website_url: "https://osmosis.com/",
    gender_policy: null,
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Insert Bay Area Saunas into Supabase ===\n");

  // Step 1: Fetch existing SF saunas to avoid duplicates
  console.log("Checking existing SF/Bay Area saunas...");
  const { data: existing, error: fetchErr } = await supabase
    .from("saunas")
    .select("id, name, address")
    .eq("city_slug", "sf");

  if (fetchErr) {
    console.error("Error fetching existing saunas:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${existing.length} existing SF/Bay Area saunas in Supabase\n`);

  // Step 2: Filter out duplicates by name similarity
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const toInsert = [];
  const skipped = [];

  for (const sauna of NEW_BAY_AREA_SAUNAS) {
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
    skipped.forEach((name) => console.log(`  - ${name}`));
    console.log("");
  }

  if (toInsert.length === 0) {
    console.log("No new saunas to insert. All already exist in the database.");
    return;
  }

  console.log(`Inserting ${toInsert.length} new Bay Area saunas...\n`);

  // Step 3: Insert
  const { data, error: insertErr } = await supabase
    .from("saunas")
    .insert(toInsert)
    .select("id, name, neighborhood");

  if (insertErr) {
    console.error("Insert error:", insertErr.message);
    process.exit(1);
  }

  console.log("Successfully inserted:");
  for (const row of data) {
    console.log(`  ID ${row.id}: ${row.name} (${row.neighborhood})`);
  }
  console.log(`\nDone! Inserted ${data.length} new Bay Area saunas.`);
  console.log("Next steps:");
  console.log("  1. Run 'node scripts/enrich-sf-saunas.js' to fetch Google Place IDs, ratings, and photos");
  console.log("  2. Or run 'node scripts/scrape-photos.js' to fetch photos for entries with place_ids");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
