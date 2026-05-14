import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Seattle Sauna Pricing Updates ──────────────────────────────────────────────
// Pricing tiers: "$" (under ~$30/visit), "$$" (~$30-60), "$$$" ($60+)
// Based on current published rates as of Feb 2026.
const UPDATES = [
  // ── Dedicated Saunas & Bathhouses ──
  { id: 566, price: "$$" },   // Seattle Sauna — $64/90-min guided session
  { id: 567, price: "$$$" },  // Hothouse Spa & Sauna — $190+ private rental
  { id: 568, price: "$$$" },  // Wild Haus Floating Saunas — $150/person communal
  { id: 569, price: "$$$" },  // Banya 5 — $70 standard entry
  { id: 570, price: "$$" },   // Bywater Sauna — $35-40/session
  { id: 571, price: "$$" },   // Sauna Hut Green Lake — $30-60/session
  { id: 572, price: "$$" },   // Von Sauna — $40/75-min session
  { id: 573, price: "$$" },   // Salt & Cedar Sauna Seattle
  { id: 574, price: "$$" },   // Soak & Sage — $60/2-hour access
  { id: 575, price: "$" },    // Steamworks Baths Seattle — ~$9-27 entry
  { id: 576, price: "$$" },   // Bywater Sauna - Alki — $35-40/session
  { id: 577, price: "$$$" },  // The Spa at Four Seasons Hotel Seattle
  { id: 578, price: "$$" },   // Q Sauna & Spa — $40 admission
  { id: 579, price: "$$" },   // Fyre Sauna — $35/session
  { id: 580, price: "$$" },   // Sauna Hut Shoreline — $30-60/session
  { id: 583, price: "$$" },   // Seattle Massage Sauna & Float — ~$40-60
  { id: 587, price: "$$" },   // Vihta Sauna
  { id: 621, price: "$" },    // Sauna n Soak — $30/session
  { id: 622, price: "$" },    // Elliott Bay Sauna & Hot Tub Co — $24.50/hr
  { id: 624, price: "$$" },   // Lustre Infrared Sauna Studio — $45-60/session

  // ── Float Studios ──
  { id: 586, price: "$$" },   // Float Seattle (South Lake Union) — $45-89/session
  { id: 588, price: "$$" },   // Float Seattle (Renton Landing)
  { id: 602, price: "$$" },   // Float Seattle (Greenwood)
  { id: 603, price: "$$" },   // Float Seattle (Greenlake)
  { id: 604, price: "$$" },   // Float Seattle (Bellevue)

  // ── Gyms & Athletic Clubs ──
  { id: 581, price: "$$" },   // Seattle Athletic Club — ~$100+/month membership
  { id: 582, price: "$$" },   // Olympic Athletic Club — ~$80-120/month
  { id: 585, price: "$" },    // Innovative Health Gym & Wellness Center
  { id: 589, price: "$$$" },  // Equinox Rainier Square — luxury gym, $200+/month
  { id: 601, price: "$$" },   // Seattle Athletic Club Northgate
  { id: 605, price: "$" },    // Anytime Fitness (SoDo)
  { id: 608, price: "$" },    // LA Fitness (Ballard)
  { id: 609, price: "$" },    // Anytime Fitness (Fremont)
  { id: 610, price: "$$" },   // Bouldering Project - Fremont — ~$95-105/month
  { id: 611, price: "$" },    // LA Fitness (University District)
  { id: 612, price: "$" },    // Magnuson Athletic Club
  { id: 613, price: "$" },    // Anytime Fitness (South Lake Union)
  { id: 615, price: "$$" },   // Bouldering Project - Poplar — ~$95-105/month
  { id: 616, price: "$" },    // LA Fitness
  { id: 617, price: "$" },    // Anytime Fitness
  { id: 618, price: "$$" },   // Level Seattle - South Lake Union
  { id: 619, price: "$" },    // LA Fitness
  { id: 620, price: "$" },    // Anytime Fitness (Northgate)
  { id: 623, price: "$" },    // LA Fitness
  { id: 625, price: "$" },    // LA Fitness (Renton)
  { id: 626, price: "$" },    // LA Fitness (Renton)
  { id: 627, price: "$" },    // Anytime Fitness (Renton)
  { id: 628, price: "$" },    // LA Fitness (Kent)
  { id: 629, price: "$" },    // LA Fitness
  { id: 630, price: "$" },    // Anytime Fitness (Kent)

  // ── Hotels ──
  { id: 584, price: "$$$" },  // The Spa at Hotel 1000
  { id: 590, price: "$$$" },  // Hotel 1000, LXR Hotels & Resorts
  { id: 591, price: "$$$" },  // The Woodmark Hotel and Still Spa
  { id: 592, price: "$$" },   // Hyatt at Olive 8 — $55 day pass
  { id: 593, price: "$$$" },  // Lotte Hotel Seattle — treatments from $395
  { id: 594, price: "$$$" },  // Grand Hyatt Seattle
  // 595: Four Seasons Hotel Seattle — already $$$
  // 596: The Alexis Royal Sonesta — already $$$
  { id: 597, price: "$$$" },  // Hyatt Regency Lake Washington
  { id: 598, price: "$$$" },  // W Seattle
  { id: 599, price: "$$$" },  // Inn at the WAC
  { id: 600, price: "$$" },   // Hotel Ballard

  // ── Public Facilities ──
  { id: 606, price: "$" },    // Golden Gardens Bathhouse
  { id: 607, price: "$" },    // Pritchard Beach Bath House
  { id: 614, price: "$" },    // Alki Beach Park Bathhouse
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Update Seattle Sauna Pricing ===\n");

  let updated = 0;
  let failed = 0;

  for (const { id, price } of UPDATES) {
    const { error } = await supabase
      .from("saunas")
      .update({ price })
      .eq("id", id);

    if (error) {
      console.error(`  FAILED ID ${id}: ${error.message}`);
      failed++;
    } else {
      console.log(`  Updated ID ${id} → ${price}`);
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated}/${UPDATES.length} saunas (${failed} failed).`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
