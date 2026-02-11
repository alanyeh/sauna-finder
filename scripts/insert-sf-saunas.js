import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── New SF Saunas ──────────────────────────────────────────────────────────────
// All verified as real, currently operating businesses (as of Feb 2026).
const NEW_SF_SAUNAS = [
  {
    name: "Kabuki Springs & Spa",
    address: "1750 Geary Blvd, San Francisco, CA 94115",
    neighborhood: "Japantown",
    lat: 37.7851,
    lng: -122.4287,
    rating: 4.3,
    rating_count: 1321,
    price: "$$",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool"],
    hours: "Tue-Sun: 10AM-9:30PM, Mon: 2PM-8PM (bathing only)",
    place_id: "ChIJG1VwBLmAhYARL7PsbVbgBuk",
    description: "Japantown's iconic communal bathhouse with sauna, steam, cold plunge, and hot pool since 1968.",
    city_slug: "sf",
    website_url: "https://kabukisprings.com/",
    gender_policy: "Gender-separated bathing days (check schedule)",
  },
  {
    name: "Archimedes Banya",
    address: "748 Innes Ave, San Francisco, CA 94124",
    neighborhood: "Bayview",
    lat: 37.7305,
    lng: -122.3728,
    rating: 4.5,
    rating_count: 729,
    price: "$",
    types: ["Traditional Banya"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool", "coed"],
    hours: "Mon, Wed-Fri: 12PM-11PM, Sat-Sun: 10AM-11PM, Tue: Closed",
    place_id: "ChIJtwC_f2l_j4ARaCUiyTcF8Yc",
    description: "Four-story Russian bathhouse with 210°F saunas, cold plunge, and rooftop deck on SF Bay.",
    city_slug: "sf",
    website_url: "https://banyasf.com/",
    gender_policy: "Co-ed, clothing optional",
  },
  {
    name: "Onsen SF",
    address: "466 Eddy St, San Francisco, CA 94109",
    neighborhood: "Tenderloin",
    lat: 37.7835,
    lng: -122.4161,
    rating: 4.4,
    rating_count: 254,
    price: "$$",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "steam_room", "pool", "coed", "massage"],
    hours: "Mon: 4PM-10PM, Tue: 2PM-10PM, Wed: Closed, Thu-Fri: 2PM-10PM, Sat-Sun: 10AM-10PM",
    place_id: "ChIJ-1Txmo-AhYARZrL3jfKPfOY",
    description: "Japanese-inspired bathhouse with redwood sauna, steam room, cold plunge, and 15-person soaking pool.",
    city_slug: "sf",
    website_url: "https://www.onsensf.com/",
    gender_policy: "Co-ed and men's communal bath sessions",
  },
  {
    name: "Alchemy Springs",
    address: "939 Post St, San Francisco, CA 94109",
    neighborhood: "Lower Nob Hill",
    lat: 37.7876,
    lng: -122.4179,
    rating: 4.7,
    rating_count: 10,
    price: "$$",
    types: ["Boutique Sauna"],
    amenities: ["cold_plunge", "coed"],
    hours: "Tue: 6:30PM-9PM, Wed: 5PM-9PM, Sat-Sun: 10AM-4PM",
    place_id: "",
    description: "Outdoor sauna garden featuring the largest freestanding sauna in the U.S. with cold plunge tubs.",
    city_slug: "sf",
    website_url: "https://www.alchemysprings.com/",
    gender_policy: null,
  },
  {
    name: "Pearl Spa & Sauna",
    address: "1654 Post St, San Francisco, CA 94115",
    neighborhood: "Japantown",
    lat: 37.7856,
    lng: -122.4306,
    rating: 4.8,
    rating_count: 472,
    price: "$$",
    types: ["Korean Spa"],
    amenities: ["steam_room", "massage", "pool"],
    hours: "Daily: 7AM-7:45PM",
    place_id: "",
    description: "Authentic Korean spa specializing in full body exfoliation scrubs with sauna and steam facilities.",
    city_slug: "sf",
    website_url: "https://www.pearlspasf.com/",
    gender_policy: "Gender-separated facilities",
  },
  {
    name: "Imperial Day Spa",
    address: "1875 Geary Blvd, San Francisco, CA 94115",
    neighborhood: "Japantown",
    lat: 37.7849,
    lng: -122.4303,
    rating: 4.2,
    rating_count: 859,
    price: "$$",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool"],
    hours: "Mon-Thu: 9AM-8:45PM, Fri-Sun: 8AM-8:45PM",
    place_id: "",
    description: "Korean day spa with gender-separated dry sauna, steam room, hot and cold jacuzzis, and body scrubs.",
    city_slug: "sf",
    website_url: "https://imperialdayspa.com/",
    gender_policy: "Gender-separated facilities",
  },
  {
    name: "Reboot Float & Cryo Spa — Mission",
    address: "810 Valencia St, San Francisco, CA 94110",
    neighborhood: "Mission District",
    lat: 37.7586,
    lng: -122.4212,
    rating: 4.7,
    rating_count: 96,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Mon-Thu: 10:30AM-9PM, Fri-Sun: 9AM-9PM",
    place_id: "",
    description: "Float therapy, cryotherapy, and private infrared sauna with cold plunge contrast therapy.",
    city_slug: "sf",
    website_url: "https://www.rebootfloatspa.com/",
    gender_policy: null,
  },
  {
    name: "Reboot Float & Cryo Spa — Marina",
    address: "1912 Lombard St, San Francisco, CA 94123",
    neighborhood: "Marina",
    lat: 37.7992,
    lng: -122.4363,
    rating: 4.8,
    rating_count: 226,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Mon-Thu: 11AM-8PM, Fri-Sun: 9AM-8PM",
    place_id: "",
    description: "Private contrast therapy suites with infrared sauna and cold plunge in the Marina.",
    city_slug: "sf",
    website_url: "https://www.rebootfloatspa.com/",
    gender_policy: null,
  },
  {
    name: "SweatHouz — Marina",
    address: "2298 Lombard St, San Francisco, CA 94123",
    neighborhood: "Marina",
    lat: 37.7997,
    lng: -122.4410,
    rating: 4.6,
    rating_count: 30,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Daily: 7AM-9PM",
    place_id: "",
    description: "Private contrast therapy suites with infrared sauna, cold plunge, and vitamin C shower.",
    city_slug: "sf",
    website_url: "https://sweathouz.com/the-marina-book-now/",
    gender_policy: null,
  },
  {
    name: "Vital Ice",
    address: "2400 Chestnut St, San Francisco, CA 94123",
    neighborhood: "Marina",
    lat: 37.7999,
    lng: -122.4406,
    rating: 4.9,
    rating_count: 25,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    hours: "Mon-Fri: 7AM-8PM, Sat-Sun: 8AM-6PM",
    place_id: "",
    description: "Premium recovery studio with cold plunge, infrared sauna, red light therapy, and compression.",
    city_slug: "sf",
    website_url: "https://www.vitalicesf.com/",
    gender_policy: null,
  },
  {
    name: "SenSpa",
    address: "1161 Gorgas Ave, San Francisco, CA 94129",
    neighborhood: "Presidio",
    lat: 37.8014,
    lng: -122.4596,
    rating: 4.6,
    rating_count: 359,
    price: "$$",
    types: ["Day Spa"],
    amenities: ["massage", "private"],
    hours: "Mon: 9AM-8PM, Tue-Thu: 10AM-7PM, Fri-Sun: 9AM-8PM",
    place_id: "",
    description: "Presidio day spa near the Golden Gate Bridge with private infrared saunas and massage.",
    city_slug: "sf",
    website_url: "https://www.senspa.com/",
    gender_policy: null,
  },
  {
    name: "Fjord",
    address: "2310 Marinship Way, Sausalito, CA 94965",
    neighborhood: "Sausalito",
    lat: 37.8590,
    lng: -122.4969,
    rating: 4.9,
    rating_count: 24,
    price: "$$$",
    types: ["Boutique Sauna"],
    amenities: ["cold_plunge", "coed", "private"],
    hours: "Shared: Daily 7:30AM-12PM, Private: afternoons/evenings",
    place_id: "",
    description: "Floating Finnish-style sauna on SF Bay with 190°F wood-fired saunas and bay water cold plunge.",
    city_slug: "sf",
    website_url: "https://www.thisisfjord.com/",
    gender_policy: "Co-ed",
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Insert SF Saunas into Supabase ===\n");

  // Step 1: Fetch existing SF saunas to avoid duplicates
  console.log("Checking existing SF saunas...");
  const { data: existing, error: fetchErr } = await supabase
    .from("saunas")
    .select("id, name, address")
    .eq("city_slug", "sf");

  if (fetchErr) {
    console.error("Error fetching existing saunas:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${existing.length} existing SF saunas in Supabase\n`);

  // Step 2: Filter out duplicates by name similarity
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const toInsert = [];
  const skipped = [];

  for (const sauna of NEW_SF_SAUNAS) {
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

  console.log(`Inserting ${toInsert.length} new SF saunas...\n`);

  // Step 3: Insert
  const { data, error: insertErr } = await supabase
    .from("saunas")
    .insert(toInsert)
    .select("id, name");

  if (insertErr) {
    console.error("Insert error:", insertErr.message);
    process.exit(1);
  }

  console.log("Successfully inserted:");
  for (const row of data) {
    console.log(`  ID ${row.id}: ${row.name}`);
  }
  console.log(`\nDone! Inserted ${data.length} new SF saunas.`);
  console.log("Run 'node scripts/scrape-photos.js' to fetch photos for new entries.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
