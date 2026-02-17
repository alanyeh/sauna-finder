import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Pricing Data ────────────────────────────────────────────────────────────
// Each entry: { id, pricing_options: [{ duration, price, description }] }
//
// Korean spas / banyas → "Day pass" duration (unlimited time)
// Modern / boutique saunas → session-based (e.g. "90 min", "60 min")
// Gym saunas → "Membership" or "Day pass"
//
// price field is a number (dollars), displayed as "$XX" on the card.
// Add more entries as you research pricing for each city.

const UPDATES = [
  // ── NYC: Korean Spas (day pass, unlimited time) ──
  { id: 4, pricing_options: [
    { duration: 'Day pass', price: '40', description: 'Weekday' },
    { duration: 'Day pass', price: '50', description: 'Weekend' },
  ]},
  { id: 6, pricing_options: [
    { duration: 'Day pass', price: '35', description: '' },
  ]},
  { id: 10, pricing_options: [
    { duration: 'Day pass', price: '45', description: 'Weekday' },
    { duration: 'Day pass', price: '55', description: 'Weekend' },
  ]},
  { id: 12, pricing_options: [
    { duration: 'Day pass', price: '65', description: 'Weekday' },
    { duration: 'Day pass', price: '85', description: 'Weekend/holiday' },
  ]},
  { id: 19, pricing_options: [
    { duration: 'Day pass', price: '40', description: '' },
  ]},

  // ── NYC: Modern Bathhouses (session-based) ──
  { id: 1, pricing_options: [
    { duration: 'Bathing pass', price: '65', description: '' },
  ]},
  { id: 3, pricing_options: [
    { duration: 'Bathing pass', price: '65', description: '' },
  ]},
  { id: 5, pricing_options: [
    { duration: '90 min', price: '55', description: 'Guided session' },
  ]},

  // ── NYC: Traditional / Boutique ──
  { id: 2, pricing_options: [
    { duration: '90 min', price: '110', description: 'Thermal bath experience' },
  ]},
  { id: 7, pricing_options: [
    { duration: 'Day pass', price: '55', description: '' },
  ]},
  { id: 8, pricing_options: [
    { duration: 'Day pass', price: '50', description: '' },
  ]},
  { id: 9, pricing_options: [
    { duration: 'Day pass', price: '73', description: 'Weekday' },
    { duration: 'Day pass', price: '88', description: 'Weekend' },
  ]},
  { id: 11, pricing_options: [
    { duration: '3 hours', price: '75', description: 'Water lounge access' },
  ]},
  { id: 13, pricing_options: [
    { duration: '75 min', price: '60', description: 'Hot tub + sauna' },
  ]},
  { id: 14, pricing_options: [
    { duration: '50 min', price: '55', description: 'Infrared session' },
  ]},
  { id: 15, pricing_options: [
    { duration: '40 min', price: '49', description: 'Infrared session' },
  ]},
  { id: 16, pricing_options: [
    { duration: 'Day pass', price: '45', description: '' },
  ]},
  { id: 17, pricing_options: [
    { duration: 'Day pass', price: '50', description: 'Weekday' },
    { duration: 'Day pass', price: '60', description: 'Weekend' },
  ]},
  { id: 18, pricing_options: [
    { duration: 'Day pass', price: '50', description: '' },
  ]},
  { id: 20, pricing_options: [
    { duration: '30 min', price: '39', description: 'Solo infrared session' },
  ]},
  { id: 45, pricing_options: [
    { duration: '60 min', price: '55', description: 'Ice bath + infrared' },
  ]},

  // ─── Add more cities below ───
  // Copy the pattern above for SF, Seattle, Denver, etc.
  // Use the sauna IDs from Supabase.
];

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=== Populate Sauna Pricing Options ===\n");

  let updated = 0;
  let failed = 0;

  for (const { id, pricing_options } of UPDATES) {
    const { error } = await supabase
      .from('saunas')
      .update({ pricing_options })
      .eq('id', id);

    if (error) {
      console.error(`  FAILED ID ${id}: ${error.message}`);
      failed++;
    } else {
      const summary = pricing_options
        .map((o) => `$${o.price}/${o.duration}`)
        .join(', ');
      console.log(`  Updated ID ${id} → ${summary}`);
      updated++;
    }
  }

  console.log(
    `\nDone! Updated ${updated}/${UPDATES.length} saunas (${failed} failed).`
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
