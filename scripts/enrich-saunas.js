// Enrich existing sauna records with expanded amenity/type inference.
// Usage: node scripts/enrich-saunas.js [--dry-run] [--refetch] [--website] [--limit=N] [--city=<slug>]

import { createClient } from '@supabase/supabase-js';
import { inferAmenityEvidence, placeTextSources } from './lib/amenities.js';
import { fetchPlacesJSON, PlacesQuotaError } from './lib/places.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { crawlWebsite } from './lib/website-content.js';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─── Type Categorization Rules ──────────────────────────────────────────────
// Each rule maps a keyword pattern to a type, with a category group to prevent
// redundant additions (e.g., don't add "Russian Banya" if "Traditional Banya"
// already covers the same filter category).
const TYPE_RULES = [
  { pattern: /\bbanya\b/i, type: 'Russian Banya', category: 'russian',
    nameOnly: true }, // only match name, not description (avoids tagging hotels that mention "banya" as a feature)
  { pattern: /jjimjilbang|korean.*scrub|body\s*scrub.*korean/i, type: 'Korean Spa', category: 'korean' },
  { pattern: /private\s*(room\s*)?booking|book\s*a\s*private|hourly\s*(private\s*)?session/i, type: 'Private Sauna Studio', category: 'private' },
  { pattern: /infrared/i, type: 'Infrared Sauna', category: 'infrared',
    nameOnly: true }, // only match name to avoid over-categorizing spas that mention infrared as secondary
];

// Types that belong to each category — used to skip redundant additions
const CATEGORY_MEMBERS = {
  russian: ['Russian Banya', 'Russian Bathhouse', 'Traditional Banya', 'Traditional Russian Banya'],
  korean: ['Korean Spa', 'Korean Day Spa', 'Korean Fitness & Spa'],
  private: ['Private Sauna Studio', 'Boutique Sauna'],
  infrared: ['Infrared Sauna'],
};

// ─── Helpers ────────────────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildTextCorpus(sauna, placeDetails) {
  return [sauna.name, sauna.description, ...(placeDetails ? placeTextSources(placeDetails) : [])];
}

function enrichAmenities(existingAmenities, sources) {
  const evidence = inferAmenityEvidence(sources);
  const added = Object.keys(evidence).filter(amenity => !existingAmenities.includes(amenity));
  return { amenities: [...existingAmenities, ...added], added, evidence };
}

function enrichTypes(existingTypes, name, description) {
  const newTypes = [...existingTypes];
  const added = [];

  for (const rule of TYPE_RULES) {
    // Skip if this exact type already exists
    if (newTypes.includes(rule.type)) continue;

    // Skip if another type in the same category already exists (e.g., "Traditional Banya" covers "Russian Banya")
    const categoryTypes = CATEGORY_MEMBERS[rule.category] || [];
    if (categoryTypes.some(t => newTypes.includes(t))) continue;

    // Match against name only (for nameOnly rules) or name + description
    const text = rule.nameOnly ? name : `${name} ${description || ''}`;
    if (rule.pattern.test(text)) {
      newTypes.push(rule.type);
      added.push(rule.type);
    }
  }

  return { types: newTypes, added };
}

// ─── Google Places Re-Fetch ─────────────────────────────────────────────────
async function fetchPlaceDetails(placeId) {
  if (!placeId || !API_KEY) return null;

  return fetchPlacesJSON(
    `https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'editorialSummary,reviews',
      },
    }
  );

}

// ─── Data Fetching ──────────────────────────────────────────────────────────
async function fetchSaunasToEnrich(citySlug, limit) {
  // Try fetching with verification_status filter
  let query = supabase
    .from('saunas')
    .select('id, name, description, types, amenities, place_id, website_url, city_slug, verification_status')
    .eq('verification_status', 'unverified')
    .order('id', { ascending: true });

  if (citySlug) query = query.eq('city_slug', citySlug);
  if (limit) query = query.limit(limit);

  let { data, error } = await query;

  if (error && error.message.includes('verification_status')) {
    console.warn('⚠  verification_status column not found. Processing all records.');
    console.warn('   Run this SQL in Supabase Dashboard to add it:');
    console.warn("   ALTER TABLE saunas ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified';\n");

    let retryQuery = supabase
      .from('saunas')
      .select('id, name, description, types, amenities, place_id, website_url, city_slug')
      .order('id', { ascending: true });
    if (citySlug) retryQuery = retryQuery.eq('city_slug', citySlug);
    if (limit) retryQuery = retryQuery.limit(limit);

    const result = await retryQuery;
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  if (limit) data = data.slice(0, limit);
  return { saunas: data };
}

// ─── CSV Report ─────────────────────────────────────────────────────────────
function generateEnrichCSV(changes, errors, citySlug, dryRun) {
  const esc = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;
  const lines = ['id,name,field,before,after,status,evidence'];

  for (const change of changes) {
    const before = Array.isArray(change.before) ? change.before.join('; ') : change.before;
    const after = Array.isArray(change.after) ? change.after.join('; ') : change.after;
    lines.push(`${change.id},${esc(change.name)},${change.field},${esc(before)},${esc(after)},${dryRun ? 'PROPOSED' : 'CHANGED'},${esc(change.evidence)}`);
  }

  for (const err of errors) {
    lines.push(`${err.id},${esc(err.name)},error,,,${esc(err.error)},`);
  }

  const slug = citySlug || 'all';
  const filename = `scripts/enrich-report-${slug}-${Date.now()}.csv`;
  writeFileSync(filename, lines.join('\n'));
  return filename;
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help')) {
    console.log('Usage: node scripts/enrich-saunas.js [--dry-run] [--refetch] [--website] [--limit=N] [--city=<slug>]');
    console.log('\nFlags:');
    console.log('  --dry-run   Output CSV of proposed changes, no DB writes');
    console.log('  --website   Read up to 3 linked official website pages per record');
    console.log('  --refetch   Re-fetch Google Places API for richer text matching');
    console.log('  --limit=N   Process only N records');
    console.log('  --city=X    Filter by city_slug (e.g., nyc, sf)');
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const refetch = args.includes('--refetch');
  const withWebsite = args.includes('--website');
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg === undefined ? null : Number(limitArg);
  if (limit !== null && (!Number.isSafeInteger(limit) || limit < 1)) {
    throw new Error('--limit must be a positive integer');
  }
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1] || null;

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local');
    process.exit(1);
  }
  if (refetch && !API_KEY) {
    console.error('--refetch requires GOOGLE_PLACES_API_KEY in .env.local');
    process.exit(1);
  }

  console.log(`\n=== Enriching sauna data ===`);
  if (dryRun) console.log('  [DRY RUN — no DB writes]');
  if (refetch) console.log('  [REFETCH — using Google Places API]');
  if (cityArg) console.log(`  [CITY: ${cityArg}]`);
  if (limit) console.log(`  [LIMIT: ${limit}]`);
  console.log('');

  const { saunas } = await fetchSaunasToEnrich(cityArg, limit);
  console.log(`Fetched ${saunas.length} saunas to enrich\n`);

  if (saunas.length === 0) {
    console.log('Nothing to enrich.');
    return;
  }

  const changes = [];
  const errors = [];
  let processed = 0;

  for (let i = 0; i < saunas.length; i++) {
    const sauna = saunas[i];
    processed++;
    process.stdout.write(`  [${i + 1}/${saunas.length}] ${sauna.name}...`);

    try {
      // Try official pages first; pay for review details only as a fallback.
      const website = withWebsite && sauna.website_url
        ? await crawlWebsite(sauna.website_url) : { pages: [], errors: [] };
      let placeDetails = null;
      if (refetch && sauna.place_id && !website.pages.length) {
        placeDetails = await fetchPlaceDetails(sauna.place_id);
        await sleep(300);
      }
      for (const failure of website.errors) {
        errors.push({ id: sauna.id, name: sauna.name, error: `${failure.url}: ${failure.error}` });
      }
      // Prefer available official page text over review snippets. Preserve the
      // page URL alongside each supporting sentence in the review report.
      const textCorpus = website.pages.length
        ? website.pages.map(page => page.text) : buildTextCorpus(sauna, placeDetails);

      // Enrich amenities
      const { amenities: newAmenities, added: addedAmenities, evidence } =
        enrichAmenities(sauna.amenities || [], textCorpus);

      // Enrich types
      const { types: newTypes, added: addedTypes } =
        enrichTypes(sauna.types || [], sauna.name, sauna.description || '');

      // Build update payload
      const update = {};
      const pendingChanges = [];
      let hasChanges = false;

      if (addedAmenities.length > 0) {
        update.amenities = newAmenities;
        pendingChanges.push({ id: sauna.id, name: sauna.name, field: 'amenities',
          before: sauna.amenities, after: newAmenities,
          evidence: addedAmenities.map(amenity => {
            const source = website.pages.find(page => page.text.includes(evidence[amenity]));
            return `${amenity}: ${evidence[amenity]}${source ? ` [${source.url}]` : ''}`;
          }).join(' | ') });
        hasChanges = true;
      }
      if (addedTypes.length > 0) {
        update.types = newTypes;
        pendingChanges.push({ id: sauna.id, name: sauna.name, field: 'types',
          before: sauna.types, after: newTypes });
        hasChanges = true;
      }

      // Keyword inference is not human verification. Keep these records reviewable.
      if (hasChanges && !dryRun) {
        const { error } = await supabase
          .from('saunas')
          .update(update)
          .eq('id', sauna.id);
        if (error) throw error;
      }

      changes.push(...pendingChanges);
      const parts = [];
      if (addedAmenities.length > 0) parts.push(`+${addedAmenities.length} amenities (${addedAmenities.join(', ')})`);
      if (addedTypes.length > 0) parts.push(`+${addedTypes.length} types (${addedTypes.join(', ')})`);
      console.log(parts.length > 0 ? ` ${parts.join(', ')}` : ' no changes');

    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      errors.push({ id: sauna.id, name: sauna.name, error: err.message });
      if (err instanceof PlacesQuotaError) break;
    }
  }

  // Summary
  const changedIds = new Set(changes.map(c => c.id));
  console.log(`\n--- Summary ---`);
  console.log(`  Processed: ${processed}`);
  console.log(`  Changed:   ${changedIds.size}`);
  console.log(`  Errors:    ${errors.length}`);

  if (changes.length > 0 || errors.length > 0) {
    const csvFile = generateEnrichCSV(changes, errors, cityArg, dryRun);
    console.log(`\nCSV report saved to: ${csvFile}`);
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
