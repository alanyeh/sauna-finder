import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Updates for existing SF saunas ─────────────────────────────────────────────
// Adds hours, descriptions, and normalizes amenities/types to match filter system.
// Filter-compatible amenities: cold_plunge, steam_room, pool, coed, private, massage
// Types should map via TYPE_TO_CATEGORY in useFilters.js
const UPDATES = [
  {
    id: 54, // Archimedes Banya
    hours: "Mon, Wed-Fri: 12PM-11PM, Sat-Sun: 10AM-11PM, Tue: Closed",
    description: "Four-story Russian bathhouse with 210°F saunas, cold plunge, and rooftop deck on SF Bay.",
    types: ["Traditional Banya"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool", "coed"],
    price: "$",
  },
  {
    id: 55, // Kabuki Springs & Spa
    hours: "Tue-Sun: 10AM-9:30PM, Mon: 2PM-8PM (bathing only)",
    description: "Japantown's iconic communal bathhouse with sauna, steam, cold plunge, and hot pool since 1968.",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "steam_room", "pool", "massage"],
  },
  {
    id: 56, // Alchemy Springs
    hours: "Tue: 6:30PM-9PM, Wed: 5PM-9PM, Sat-Sun: 10AM-4PM",
    description: "Outdoor sauna garden featuring the largest freestanding sauna in the U.S. with cold plunge tubs.",
    types: ["Boutique Sauna"],
    amenities: ["cold_plunge", "coed"],
  },
  {
    id: 57, // Onsen SF
    hours: "Mon: 4PM-10PM, Tue: 2PM-10PM, Wed: Closed, Thu-Fri: 2PM-10PM, Sat-Sun: 10AM-10PM",
    description: "Japanese-inspired bathhouse with redwood sauna, steam room, cold plunge, and 15-person soaking pool.",
    types: ["Modern Bathhouse"],
    amenities: ["cold_plunge", "steam_room", "pool", "coed", "massage"],
  },
  {
    id: 58, // Pearl Spa & Sauna
    hours: "Daily: 7AM-7:45PM",
    description: "Authentic Korean spa specializing in full body exfoliation scrubs with sauna and steam facilities.",
    types: ["Korean Spa"],
    amenities: ["cold_plunge", "steam_room", "massage", "pool"],
    price: "$$",
  },
  {
    id: 59, // Reboot Float & Cryo Spa (Mission)
    hours: "Mon-Thu: 10:30AM-9PM, Fri-Sun: 9AM-9PM",
    description: "Float therapy, cryotherapy, and private infrared sauna with cold plunge contrast therapy.",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    price: "$$",
  },
  {
    id: 60, // Reboot Float & Cryo Spa (Marina)
    hours: "Mon-Thu: 11AM-8PM, Fri-Sun: 9AM-8PM",
    description: "Private contrast therapy suites with infrared sauna and cold plunge in the Marina.",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
    price: "$$",
  },
  {
    id: 61, // SweatHouz
    hours: "Daily: 7AM-9PM",
    description: "Private contrast therapy suites with infrared sauna, cold plunge, and vitamin C shower.",
    types: ["Infrared Sauna"],
    amenities: ["cold_plunge", "private"],
  },
  {
    id: 62, // Dogpatch Paddle Sauna
    hours: "Check website for session times",
    description: "Unique outdoor sauna experience on the SF waterfront with open-water cold plunge.",
    types: ["Boutique Sauna"],
    amenities: ["cold_plunge", "coed"],
  },
  {
    id: 63, // Equinox Sports Club San Francisco
    hours: "Mon-Fri: 5AM-10PM, Sat-Sun: 7AM-9PM",
    description: "Luxury fitness club with full-size sauna, steam rooms, junior Olympic pool, and spa.",
    types: ["Gym Sauna"],
    amenities: ["steam_room", "pool", "massage", "coed"],
  },
  {
    id: 64, // Dolphin Club
    hours: "Daily: 6AM-6PM (members), check website for guest hours",
    description: "Historic swimming and rowing club with sauna and open-water swimming in SF Bay since 1877.",
    types: ["Boutique Sauna"],
    amenities: ["coed"],
    price: "$",
  },
  {
    id: 65, // SenSpa
    hours: "Mon: 9AM-8PM, Tue-Thu: 10AM-7PM, Fri-Sun: 9AM-8PM",
    description: "Presidio day spa near the Golden Gate Bridge with private infrared saunas and massage.",
    types: ["Day Spa"],
    amenities: ["massage", "private"],
  },
  {
    id: 66, // Bay Club Financial District
    hours: "Mon-Fri: 5:30AM-10PM, Sat-Sun: 7AM-8PM",
    description: "Luxury fitness club with sauna, steam room, hot tub, and indoor pool in the Financial District.",
    types: ["Gym Sauna"],
    amenities: ["steam_room", "pool", "coed"],
  },
  {
    id: 67, // Embarcadero YMCA
    hours: "Mon-Fri: 5:30AM-9:30PM, Sat: 7AM-7PM, Sun: 8AM-6PM",
    description: "Community fitness center with sauna, steam room, and indoor pool along the Embarcadero.",
    types: ["Gym Sauna"],
    amenities: ["steam_room", "pool", "coed"],
  },
];

async function main() {
  console.log("=== Updating existing SF saunas with hours, descriptions & normalized data ===\n");

  let updated = 0;
  let failed = 0;

  for (const update of UPDATES) {
    const { id, ...fields } = update;
    const { error } = await supabase
      .from("saunas")
      .update(fields)
      .eq("id", id);

    if (error) {
      console.error(`  FAILED ID ${id}: ${error.message}`);
      failed++;
    } else {
      console.log(`  Updated ID ${id}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated}/${UPDATES.length} saunas (${failed} failed).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
