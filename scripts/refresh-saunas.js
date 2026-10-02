// Refresh existing sauna records from Google Place Details.
//
// The scraper only ever ADDS places — once a sauna is in the DB its rating,
// review count, hours, website, and open/closed status drift forever. This
// script walks existing records stalest-first (by updated_at) and refreshes
// them via Place Details, one request per sauna.
//
// Quota-aware: the API key is capped at 100 GetPlaceRequest/day (resets
// midnight Pacific), so runs are capped by --limit (default 60) and stop
// gracefully on 429/RESOURCE_EXHAUSTED. Every checked record (changed or not)
// is stamped in scripts/.refresh-checkpoint.json, and records checked within
// --max-age-days (default 14) are skipped — so re-running on later days works
// through the whole set instead of re-checking the same unchanged rows.
//
// What it changes:
//   rating, rating_count  — always updated when Google's value differs
//   place_id              — updated when Google rotates the canonical ID, or
//                           re-resolved via Text Search when the old ID 404s
//   hours, website_url,
//   lat, lng              — filled only when currently empty (never clobbers
//                           manually curated values)
//   closures              — reported (CLOSED_PERMANENTLY / CLOSED_TEMPORARILY);
//                           records are NOT deleted or hidden automatically
//
// Usage:
//   node scripts/refresh-saunas.js [--city=<slug>] [--limit=N] [--dry-run] [--max-age-days=N]

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { readFileSync, writeFileSync, existsSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const FIELD_MASK = [
  'id',
  'businessStatus',
  'rating',
  'userRatingCount',
  'regularOpeningHours',
  'websiteUri',
  'displayName',
  'location',
].join(',');

// Tracks when each sauna id was last checked, so multi-day sweeps progress
// through the whole set instead of re-checking rows that produced no DB write.
const CHECKPOINT_FILE = 'scripts/.refresh-checkpoint.json';

function loadCheckpoint() {
  if (!existsSync(CHECKPOINT_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf8'));
  } catch {
    console.warn(`⚠ Could not parse ${CHECKPOINT_FILE}; treating all records as unchecked.`);
    return {};
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function namesSimilar(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

function formatHours(openingHours) {
  if (!openingHours?.weekdayDescriptions) return '';
  return openingHours.weekdayDescriptions.join(', ');
}

class QuotaExhaustedError extends Error {}

async function fetchPlaceDetails(placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
  });

  if (response.status === 429) {
    throw new QuotaExhaustedError('Place Details daily quota exhausted (HTTP 429)');
  }
  if (response.status === 404) {
    return { notFound: true };
  }
  if (!response.ok) {
    const errText = await response.text();
    if (/RESOURCE_EXHAUSTED/i.test(errText)) {
      throw new QuotaExhaustedError(`Place Details daily quota exhausted: ${errText.slice(0, 200)}`);
    }
    throw new Error(`Place Details error (${response.status}): ${errText.slice(0, 200)}`);
  }

  return response.json();
}

// Re-resolve a dead place_id by searching name + address. Uses the Text Search
// endpoint, which has its own daily quota separate from Place Details.
async function resolvePlaceId(sauna) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName',
    },
    body: JSON.stringify({ textQuery: `${sauna.name} ${sauna.address || ''}`.trim(), pageSize: 3 }),
  });

  if (!response.ok) {
    const errText = await response.text();
    if (response.status === 429 || /RESOURCE_EXHAUSTED/i.test(errText)) {
      throw new QuotaExhaustedError('Text Search daily quota exhausted');
    }
    throw new Error(`Text Search error (${response.status}): ${errText.slice(0, 200)}`);
  }

  const data = await response.json();
  const match = (data.places || []).find(p => namesSimilar(p.displayName?.text, sauna.name));
  return match?.id || null;
}

function diffSauna(sauna, place) {
  const changes = {};

  if (place.id && place.id !== sauna.place_id) {
    changes.place_id = place.id;
  }
  if (place.rating != null && place.rating !== Number(sauna.rating)) {
    changes.rating = place.rating;
  }
  if (place.userRatingCount != null && place.userRatingCount !== sauna.rating_count) {
    changes.rating_count = place.userRatingCount;
  }

  // Fill-if-empty only: existing hours/websites may be manually curated
  const freshHours = formatHours(place.regularOpeningHours);
  if (!sauna.hours && freshHours) {
    changes.hours = freshHours;
  }
  if (!sauna.website_url && place.websiteUri) {
    changes.website_url = place.websiteUri;
  }
  if ((sauna.lat == null || sauna.lng == null) && place.location) {
    changes.lat = place.location.latitude;
    changes.lng = place.location.longitude;
  }

  return changes;
}

function generateCSV(rows) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const lines = ['status,id,city,name,business_status,changes'];
  for (const r of rows) {
    lines.push([r.status, r.id, r.city, esc(r.name), r.businessStatus || '', esc(r.changes)].join(','));
  }
  const filename = `scripts/refresh-report-${Date.now()}.csv`;
  writeFileSync(filename, lines.join('\n'));
  return filename;
}

async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1];
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const maxAgeArg = args.find(a => a.startsWith('--max-age-days='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const limit = Math.max(1, parseInt(limitArg || '60', 10));
  const maxAgeDays = Math.max(0, parseInt(maxAgeArg || '14', 10));

  if (!API_KEY) {
    console.error('Missing GOOGLE_PLACES_API_KEY in .env.local');
    process.exit(1);
  }

  console.log(`\n=== Refreshing saunas ${cityArg ? `for ${cityArg}` : '(all cities)'} — stalest first, limit ${limit} ===`);
  if (dryRun) console.log('  [DRY RUN - no DB writes, checkpoint not advanced]');
  console.log('');

  let query = supabase
    .from('saunas')
    .select('id, name, address, place_id, rating, rating_count, hours, website_url, lat, lng, city_slug, updated_at')
    .order('updated_at', { ascending: true });
  if (cityArg) query = query.eq('city_slug', cityArg);

  const { data: allSaunas, error } = await query;
  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }

  // Skip anything checked recently, then take the least-recently-checked rows
  const checkpoint = loadCheckpoint();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const due = allSaunas.filter(s => {
    const last = checkpoint[s.id];
    return !last || new Date(last).getTime() < cutoff;
  });
  due.sort((a, b) => new Date(checkpoint[a.id] || 0) - new Date(checkpoint[b.id] || 0));
  const saunas = due.slice(0, limit);

  console.log(`Total: ${allSaunas.length} — checked < ${maxAgeDays}d ago: ${allSaunas.length - due.length} — due: ${due.length} — this run: ${saunas.length}\n`);
  if (saunas.length === 0) {
    console.log('Nothing due for refresh.');
    return;
  }

  const report = [];
  const closures = [];
  let updated = 0;
  let unchanged = 0;
  let processed = 0;

  const checkedIds = [];

  for (const sauna of saunas) {
    const label = `[${sauna.city_slug}] ${sauna.name}`;

    let place;
    try {
      place = sauna.place_id ? await fetchPlaceDetails(sauna.place_id) : { notFound: true };

      // Dead or missing place_id → try to re-resolve by name + address
      if (place.notFound) {
        await sleep(150);
        const newId = await resolvePlaceId(sauna);
        if (newId && newId !== sauna.place_id) {
          await sleep(150);
          place = await fetchPlaceDetails(newId);
          if (!place.notFound) {
            console.log(`  ↻ ${label} — place_id re-resolved via Text Search`);
          }
        }
      }
    } catch (err) {
      if (err instanceof QuotaExhaustedError) {
        console.log(`\n!! ${err.message}`);
        console.log(`   Stopping after ${processed} lookups. Progress is saved; rerun after midnight Pacific to continue.`);
        break;
      }
      console.log(`  ! ${label} — ${err.message}`);
      report.push({ status: 'ERROR', id: sauna.id, city: sauna.city_slug, name: sauna.name, changes: err.message });
      continue;
    }
    processed++;
    checkedIds.push(sauna.id);

    if (place.notFound) {
      console.log(`  ✗ ${label} — not found on Google, even by name search (possibly closed/merged)`);
      closures.push({ ...sauna, businessStatus: 'NOT_FOUND' });
      report.push({ status: 'NOT_FOUND', id: sauna.id, city: sauna.city_slug, name: sauna.name, changes: '' });
      await sleep(150);
      continue;
    }

    const isClosed = place.businessStatus === 'CLOSED_PERMANENTLY' || place.businessStatus === 'CLOSED_TEMPORARILY';
    if (isClosed) {
      console.log(`  ✗ ${label} — ${place.businessStatus}`);
      closures.push({ ...sauna, businessStatus: place.businessStatus });
    }

    const changes = diffSauna(sauna, place);
    const changeDesc = Object.entries(changes).map(([k, v]) => `${k}→${String(v).slice(0, 40)}`).join('; ');

    if (Object.keys(changes).length === 0) {
      unchanged++;
      report.push({ status: isClosed ? 'CLOSED' : 'UNCHANGED', id: sauna.id, city: sauna.city_slug, name: sauna.name, businessStatus: place.businessStatus, changes: '' });
    } else {
      if (dryRun) {
        console.log(`  ✓ ${label} — would update: ${changeDesc}`);
      } else {
        const { error: updateError } = await supabase
          .from('saunas')
          .update(changes)
          .eq('id', sauna.id);
        if (updateError) {
          console.log(`  ! ${label} — update failed: ${updateError.message}`);
          report.push({ status: 'ERROR', id: sauna.id, city: sauna.city_slug, name: sauna.name, changes: updateError.message });
          await sleep(150);
          continue;
        }
        console.log(`  ✓ ${label} — updated: ${changeDesc}`);
        updated++;
      }
      report.push({ status: isClosed ? 'CLOSED' : 'UPDATED', id: sauna.id, city: sauna.city_slug, name: sauna.name, businessStatus: place.businessStatus, changes: changeDesc });
    }

    await sleep(150);
  }

  console.log('\n--- Summary ---');
  console.log(`  Looked up:  ${processed}/${saunas.length}`);
  console.log(`  Updated:    ${dryRun ? '(dry run)' : updated}`);
  console.log(`  Unchanged:  ${unchanged}`);

  if (closures.length > 0) {
    console.log(`\n⚠ ${closures.length} CLOSED or missing on Google — review these (not auto-removed):`);
    for (const c of closures) {
      console.log(`    id=${c.id} [${c.city_slug}] ${c.name} — ${c.businessStatus}`);
    }
  }

  const csvFile = generateCSV(report);
  console.log(`\nCSV report saved to: ${csvFile}`);

  if (dryRun) {
    console.log('[DRY RUN] Checkpoint not advanced — note the API quota was still spent.');
  } else {
    const now = new Date().toISOString();
    for (const id of checkedIds) checkpoint[id] = now;
    writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
    console.log(`Checkpoint advanced for ${checkedIds.length} records (${CHECKPOINT_FILE}).`);
  }

  if (!dryRun && updated > 0) {
    console.log('Run `node scripts/prefetch-saunas.js` (or wait for the nightly rebuild) to refresh the site snapshot.');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
