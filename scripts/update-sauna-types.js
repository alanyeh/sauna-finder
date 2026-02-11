// One-time script to add dry_sauna / infrared_sauna amenities to Supabase records
// Also standardizes SF entries from "sauna" → "dry_sauna"

const SUPABASE_URL = 'https://oqwwxfecnrspcjjwrylx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error('Set SUPABASE_SERVICE_KEY env var');
  process.exit(1);
}

// Map of Supabase ID → what to add
// "dry" = add dry_sauna, "infrared" = add infrared_sauna, "both" = add both
// "skip" = no change, "rename" = rename "sauna" → "dry_sauna"
const updates = {
  // NYC dedicated saunas (ids 1-20)
  1:  'both',     // Bathhouse Flatiron
  2:  'skip',     // AIRE Ancient Baths (steam/baths only)
  3:  'both',     // Bathhouse Williamsburg
  4:  'dry',      // Spa Castle
  5:  'dry',      // Othership Flatiron
  6:  'dry',      // The SPA Club
  7:  'dry',      // Brooklyn Bathhouse
  8:  'dry',      // Russian & Turkish Baths
  9:  'both',     // QC NY SPA
  10: 'infrared', // JUVENEX SPA
  11: 'skip',     // Great Jones Spa (unclear)
  12: 'both',     // SoJo Spa Club
  13: 'dry',      // cityWell Brooklyn
  14: 'infrared', // Area Infrared Sauna
  15: 'infrared', // Perspire Sauna Studio
  16: 'dry',      // Brooklyn Banya
  17: 'both',     // WORLD SPA
  18: 'dry',      // Wall Street Bath & Spa
  19: 'infrared', // Tribeca Spa of Tranquility
  20: 'infrared', // beem Light Sauna

  // NYC duplicates (ids 21-40, same saunas)
  21: 'both',     // Bathhouse Flatiron
  22: 'skip',     // AIRE Ancient Baths
  23: 'both',     // Bathhouse Williamsburg
  24: 'dry',      // Spa Castle
  25: 'dry',      // Othership Flatiron
  26: 'dry',      // The SPA Club
  27: 'dry',      // Brooklyn Bathhouse
  28: 'dry',      // Russian & Turkish Baths
  29: 'both',     // QC NY SPA
  30: 'infrared', // JUVENEX SPA
  31: 'skip',     // Great Jones Spa
  32: 'both',     // SoJo Spa Club
  33: 'dry',      // cityWell Brooklyn
  34: 'infrared', // Area Infrared Sauna
  35: 'infrared', // Perspire Sauna Studio
  36: 'dry',      // Brooklyn Banya
  37: 'both',     // WORLD SPA
  38: 'dry',      // Wall Street Bath & Spa
  39: 'infrared', // Tribeca Spa of Tranquility
  40: 'infrared', // beem Light Sauna

  // Extra NYC saunas (ids 41-53)
  41: 'skip',     // Lore Bathing Club (already has dry_sauna)
  42: 'dry',      // Saint NYC
  43: 'infrared', // Chill Space NYC
  44: 'dry',      // Akari Sauna Williamsburg
  45: 'dry',      // Akari Sauna Greenpoint
  46: 'dry',      // Mermaid Spa
  47: 'dry',      // Russian Bath of NY
  48: 'dry',      // New York Spa & Sauna
  49: 'dry',      // QF SPA
  50: 'dry',      // BRC Day Spa & Sauna Resort
  51: 'dry',      // Bear and Birch
  52: 'dry',      // Island Spa & Sauna
  53: 'infrared', // NLighten Infrared Sauna

  // SF saunas (ids 54-67) — also rename "sauna" → "dry_sauna"
  54: 'rename',   // Archimedes Banya
  55: 'rename',   // Kabuki Springs & Spa
  56: 'rename',   // Alchemy Springs
  57: 'rename',   // Onsen SF
  58: 'rename',   // Pearl Spa & Sauna
  59: 'rename',   // Reboot Float (also has infrared_sauna already)
  60: 'skip',     // Reboot Float Marina (already has infrared_sauna, no "sauna")
  61: 'skip',     // SweatHouz (already has infrared_sauna)
  62: 'rename',   // Dogpatch Paddle Sauna
  63: 'rename',   // Equinox Sports Club SF
  64: 'rename',   // Dolphin Club
  65: 'skip',     // SenSpa (already has infrared_sauna)
  66: 'rename',   // Bay Club FiDi
  67: 'rename',   // Embarcadero YMCA

  // NYC Gym Saunas (ids 68-74)
  68: 'dry',      // VITAL Climbing Gym
  69: 'dry',      // Life Time Atlantic Avenue
  70: 'dry',      // Chelsea Piers Fitness Brooklyn
  71: 'dry',      // Brooklyn Boulders Queensbridge
  72: 'infrared', // TMPL Avenue A
  73: 'dry',      // Manhattan Plaza Health Club
  74: 'dry',      // Mercedes Club

  // NYC Hotel Spas (ids 75-98)
  75: 'dry',      // Equinox Hotel New York
  76: 'dry',      // Aman New York
  77: 'dry',      // The Dominick Hotel
  78: 'dry',      // The Peninsula New York
  79: 'skip',     // Mandarin Oriental (unclear)
  80: 'dry',      // The William Vale
  81: 'skip',     // The Allen Hotel (unclear)
  82: 'dry',      // Four Seasons Downtown
  83: 'dry',      // The Greenwich Hotel
  84: 'dry',      // Virgin Hotels NYC
  85: 'dry',      // The Hotel Chelsea
  86: 'dry',      // The Iroquois
  87: 'skip',     // Park Terrace Hotel (unclear)
  88: 'dry',      // The Marmara Park Ave
  89: 'skip',     // Trump International (unclear)
  90: 'infrared', // TMPL West Village
  91: 'skip',     // Powerhouse Gym NYC (unclear)
  92: 'both',     // Remedy Place Flatiron
  93: 'dry',      // West Side YMCA
  94: 'dry',      // Baccarat Hotel
  95: 'dry',      // The Ritz-Carlton NoMad
  96: 'dry',      // The Rockaway Hotel
  97: 'dry',      // Hyatt Regency Times Square
  98: 'skip',     // The Chatwal (unclear)
};

async function updateRecord(id, currentAmenities, action) {
  let newAmenities = [...currentAmenities];

  if (action === 'skip') return null;

  if (action === 'rename') {
    // Replace "sauna" with "dry_sauna"
    newAmenities = newAmenities.map(a => a === 'sauna' ? 'dry_sauna' : a);
  } else {
    if ((action === 'dry' || action === 'both') && !newAmenities.includes('dry_sauna')) {
      newAmenities.unshift('dry_sauna');
    }
    if ((action === 'infrared' || action === 'both') && !newAmenities.includes('infrared_sauna')) {
      const idx = newAmenities.includes('dry_sauna') ? 1 : 0;
      newAmenities.splice(idx, 0, 'infrared_sauna');
    }
  }

  // Skip if nothing changed
  if (JSON.stringify(newAmenities) === JSON.stringify(currentAmenities)) {
    return null;
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/saunas?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ amenities: newAmenities }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update id ${id}: ${res.status} ${text}`);
  }

  return newAmenities;
}

async function main() {
  // Fetch all current records
  const res = await fetch(`${SUPABASE_URL}/rest/v1/saunas?select=id,name,amenities&order=id`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const saunas = await res.json();

  let updated = 0;
  let skipped = 0;

  for (const sauna of saunas) {
    const action = updates[sauna.id];
    if (!action) {
      console.log(`  ? id ${sauna.id} "${sauna.name}" — not in update map, skipping`);
      skipped++;
      continue;
    }

    const result = await updateRecord(sauna.id, sauna.amenities, action);
    if (result) {
      console.log(`  ✓ id ${sauna.id} "${sauna.name}" — ${action} → [${result.join(', ')}]`);
      updated++;
    } else {
      console.log(`  - id ${sauna.id} "${sauna.name}" — ${action} (no change needed)`);
      skipped++;
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
}

main().catch(console.error);
