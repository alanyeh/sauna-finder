import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Denver Saunas ──────────────────────────────────────────────────────────────
// All verified as real, currently operating businesses (as of Feb 2026).
const DENVER_SAUNAS = [
  {
    name: "RÖK Spas",
    address: "2025 17th St, Denver, CO 80202",
    neighborhood: "LoDo",
    lat: 39.7536,
    lng: -104.9986,
    rating: 4.9,
    rating_count: 232,
    price: "$$",
    types: ["Nordic Spa"],
    amenities: ["cold_plunge", "steam_room", "coed"],
    hours: "Daily: 8AM-8PM",
    place_id: "",
    description: "Nordic-inspired bathhouse with Denver's largest custom sauna, steam room, four cold plunge tubs, and guided saunagus sessions.",
    city_slug: "denver",
    website_url: "https://rokspas.com/",
    gender_policy: null,
  },
  {
    name: "Lake Steam Baths",
    address: "3540 W Colfax Ave, Denver, CO 80204",
    neighborhood: "West Colfax",
    lat: 39.7401,
    lng: -105.0234,
    rating: 4.5,
    rating_count: 434,
    price: "$",
    types: ["Russian Banya"],
    amenities: ["steam_room", "massage", "pool", "coed"],
    hours: "Daily: 7AM-10PM",
    place_id: "ChIJRfjCsFeHa4cRzLaMRNosnz4",
    description: "Denver's iconic nude Russian bathhouse since 1927, offering steams, soaks, and massages for nearly 100 years.",
    city_slug: "denver",
    website_url: "https://www.lakesteam.com/",
    gender_policy: "Co-ed, clothing optional",
  },
  {
    name: "Portal Thermaculture",
    address: "2949 Federal Blvd, Denver, CO 80211",
    neighborhood: "Federal Boulevard",
    lat: 39.7614,
    lng: -105.0246,
    rating: 4.7,
    rating_count: 150,
    price: "$$",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "coed", "outdoor"],
    hours: "Sun: 8AM-10PM, Mon: 7AM-10PM, Tue: 2PM-10PM, Wed-Sat: 7AM-10PM",
    place_id: "",
    description: "Outdoor contrast therapy club with two saunas, three individual cold plunges, and a social clubhouse atmosphere.",
    city_slug: "denver",
    website_url: "https://www.portalthermaculture.com/",
    gender_policy: null,
  },
  {
    name: "Garden Sauna",
    address: "1407 N Ogden St, Denver, CO 80218",
    neighborhood: "Capitol Hill",
    lat: 39.7414,
    lng: -104.9706,
    rating: 4.8,
    rating_count: 85,
    price: "$",
    types: ["Traditional Sauna"],
    amenities: ["cold_plunge", "coed", "outdoor"],
    hours: "Mon-Tue: 4PM-9PM, Wed: Closed, Thu-Fri: 4PM-9PM, Sat-Sun: 9AM-9PM",
    place_id: "",
    description: "Intimate outdoor barrel sauna and cold plunge garden tucked behind a yoga studio in Capitol Hill.",
    city_slug: "denver",
    website_url: "https://www.gardensaunadenver.com/",
    gender_policy: null,
  },
  {
    name: "Red Rock Sauna",
    address: "4460 W 29th Ave, Denver, CO 80212",
    neighborhood: "Sloan's Lake",
    lat: 39.7594,
    lng: -105.0360,
    rating: 4.8,
    rating_count: 120,
    price: "$",
    types: ["Traditional Sauna"],
    amenities: ["cold_plunge", "coed", "outdoor"],
    hours: "Mon: 7AM-10AM & 4PM-9PM, Tue-Thu: 4PM-9PM, Fri: 7AM-10AM & 4PM-9PM, Sat-Sun: check website",
    place_id: "",
    description: "Community-focused sauna and cold plunge at Hogshead Brewery with a 10-seater sauna and BOGO beer deal.",
    city_slug: "denver",
    website_url: "https://redrocksauna.com/",
    gender_policy: null,
  },
  {
    name: "The Cove",
    address: "1361 S Broadway, Denver, CO 80210",
    neighborhood: "Overland",
    lat: 39.6934,
    lng: -104.9876,
    rating: 4.6,
    rating_count: 60,
    price: "$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "infrared", "pool", "gym", "coed"],
    hours: "Mon: 12PM-9PM, Tue: Closed, Wed-Sun: 12PM-9PM",
    place_id: "",
    description: "Affordable wellness center with five saunas, cold plunges, hot tubs, salt therapy, and an on-site gym.",
    city_slug: "denver",
    website_url: "https://thecovesauna.com/",
    gender_policy: null,
  },
  {
    name: "Upswell — RiNo Station",
    address: "3636 Blake St, Denver, CO 80205",
    neighborhood: "RiNo",
    lat: 39.7671,
    lng: -104.9780,
    rating: 4.8,
    rating_count: 45,
    price: "$$",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "infrared", "coed", "gym"],
    hours: "Check website for current schedule",
    place_id: "",
    description: "Wellness club with a massive in-ground cold plunge pool, traditional sauna, infrared light therapy, and Pilates.",
    city_slug: "denver",
    website_url: "https://upswellstudio.com/",
    gender_policy: null,
  },
  {
    name: "Havana Health Sauna",
    address: "2020 S Havana St, Aurora, CO 80014",
    neighborhood: "Aurora",
    lat: 39.6764,
    lng: -104.8263,
    rating: 4.3,
    rating_count: 192,
    price: "$",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool"],
    hours: "Daily: 7AM-8PM",
    place_id: "",
    description: "Authentic Korean spa with gender-separated dry and steam saunas, jade and crystal rooms, hot and cold tubs, and body scrubs.",
    city_slug: "denver",
    website_url: "https://www.havanahealthsauna.com/",
    gender_policy: "Gender-separated facilities",
  },
  {
    name: "Denver Sports Recovery",
    address: "2242 W 29th Ave, Denver, CO 80211",
    neighborhood: "LoHi",
    lat: 39.7590,
    lng: -105.0171,
    rating: 4.9,
    rating_count: 327,
    price: "$$",
    types: ["Day Spa"],
    amenities: ["cold_plunge", "infrared", "massage", "coed"],
    hours: "Mon-Thu: 6:30AM-8PM, Fri: 6:30AM-6PM, Sat: 10AM-5PM",
    place_id: "",
    description: "LoHi recovery center with three cold plunge pools, dry sauna, infrared saunas, and sports therapy services.",
    city_slug: "denver",
    website_url: "https://www.denversportsrecovery.com/",
    gender_policy: null,
  },
  {
    name: "5 Star Salt Caves",
    address: "722 S Pearl St, Denver, CO 80209",
    neighborhood: "Platt Park",
    lat: 39.7048,
    lng: -104.9779,
    rating: 4.9,
    rating_count: 252,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["infrared", "massage", "private"],
    hours: "Wed-Fri: 10AM-4PM, Sat-Sun: 10AM-7PM, Mon-Tue: Closed",
    place_id: "",
    description: "Wellness spa specializing in Himalayan salt cave therapy, full-spectrum infrared sauna, and ionic foot baths.",
    city_slug: "denver",
    website_url: "https://5starsaltcaves.com/",
    gender_policy: null,
  },
  {
    name: "Sapa Spa & Wellness",
    address: "344 E 7th Ave, Denver, CO 80203",
    neighborhood: "Capitol Hill",
    lat: 39.7277,
    lng: -104.9814,
    rating: 4.8,
    rating_count: 102,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["infrared", "massage", "private"],
    hours: "Daily: 10AM-6PM",
    place_id: "",
    description: "Contemporary Vietnamese-inspired wellness spa with infrared sauna, salt therapy, herbal baths, and lymphatic massage.",
    city_slug: "denver",
    website_url: "https://sapa-spa.com/",
    gender_policy: null,
  },
  {
    name: "SweatHouz — South Broadway",
    address: "2101 S Broadway, Denver, CO 80210",
    neighborhood: "Overland",
    lat: 39.6826,
    lng: -104.9876,
    rating: 4.7,
    rating_count: 40,
    price: "$$",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "infrared", "private"],
    hours: "Daily: 7AM-9PM",
    place_id: "",
    description: "Private contrast therapy suites with infrared sauna, cold plunge, and vitamin C shower.",
    city_slug: "denver",
    website_url: "https://sweathouz.com/south-broadway-book-now/",
    gender_policy: null,
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Insert Denver Saunas into Supabase ===\n");

  // Step 1: Fetch existing Denver saunas to avoid duplicates
  console.log("Checking existing Denver saunas...");
  const { data: existing, error: fetchErr } = await supabase
    .from("saunas")
    .select("id, name, address")
    .eq("city_slug", "denver");

  if (fetchErr) {
    console.error("Error fetching existing saunas:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${existing.length} existing Denver saunas in Supabase\n`);

  // Step 2: Filter out duplicates by name similarity
  const normalize = (s) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();

  const toInsert = [];
  const skipped = [];

  for (const sauna of DENVER_SAUNAS) {
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

  console.log(`Inserting ${toInsert.length} new Denver saunas...\n`);

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
  console.log(`\nDone! Inserted ${data.length} new Denver saunas.`);
  console.log("Run 'node scripts/scrape-photos.js' to fetch photos for new entries.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
