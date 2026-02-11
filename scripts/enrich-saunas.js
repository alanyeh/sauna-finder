// Enrich existing sauna records with expanded amenity/type inference.
// Usage: node scripts/enrich-saunas.js [--dry-run] [--refetch] [--limit=N] [--city=<slug>]

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// ─── Expanded Amenity Keyword Patterns ──────────────────────────────────────
const AMENITY_PATTERNS = {
  cold_plunge: /cold\s*plunge|ice\s*bath|frigidarium|cold\s*dip|polar\s*plunge|shock\s*pool|cold\s*tub|cold\s*(pool|immersion)|plunge\s*pool/i,
  steam_room: /steam\s*room|steam\s*bath|eucalyptus|wet\s*room|\bhammam\b|turkish\s*bath/i,
  coed: /co[\-\s]?ed|mixed[\-\s]?gender|couples|communal|bathing\s*suit|swimwear\s*required|men\s*and\s*women|all\s*genders?\b/i,
  private: /private\s*(room|suite|session|sauna|cabin|pod|bath|experience)|suites|personal\s*room|hourly\s*booking/i,
  pool: /hot\s*tub|jacuzzi|whirlpool|soaking\s*tub|hydrotherapy|swimming\s*pool|lap\s*pool|thermal\s*pool|rooftop\s*pool|indoor\s*pool|outdoor\s*pool/i,
  massage: /\bmassage\b|body\s*scrub/i,
  dry_sauna: /dry\s*sauna|heated\s*sauna|traditional\s*sauna|finnish\s*sauna|cedar\s*sauna|wood[\s\-]*(fired\s*)?sauna|barrel\s*sauna/i,
  infrared_sauna: /infrared\s*(sauna|room|therapy|cabin|pod|session)|infrared/i,
};

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
  let text = `${sauna.name} ${sauna.description || ''}`;
  if (placeDetails) {
    if (placeDetails.editorialSummary?.text) {
      text += ` ${placeDetails.editorialSummary.text}`;
    }
    if (placeDetails.reviews) {
      text += ' ' + placeDetails.reviews
        .map(r => r.text?.text || r.originalText?.text || '')
        .join(' ');
    }
  }
  return text;
}

// ─── Core Enrichment Functions ──────────────────────────────────────────────
function enrichAmenities(existingAmenities, textCorpus) {
  const newAmenities = [...existingAmenities];
  const added = [];

  for (const [amenity, pattern] of Object.entries(AMENITY_PATTERNS)) {
    if (!newAmenities.includes(amenity) && pattern.test(textCorpus)) {
      newAmenities.push(amenity);
      added.push(amenity);
    }
  }

  return { amenities: newAmenities, added };
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

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'editorialSummary,reviews',
      },
    }
  );

  if (!response.ok) return null;
  return response.json();
}

// ─── Data Fetching ──────────────────────────────────────────────────────────
async function fetchSaunasToEnrich(citySlug, limit) {
  let hasVerificationColumn = true;

  // Try fetching with verification_status filter
  let query = supabase
    .from('saunas')
    .select('id, name, description, types, amenities, place_id, city_slug, verification_status')
    .eq('verification_status', 'unverified')
    .order('id', { ascending: true });

  if (citySlug) query = query.eq('city_slug', citySlug);

  let { data, error } = await query;

  if (error && error.message.includes('verification_status')) {
    console.warn('⚠  verification_status column not found. Processing all records.');
    console.warn('   Run this SQL in Supabase Dashboard to add it:');
    console.warn("   ALTER TABLE saunas ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'unverified';\n");
    hasVerificationColumn = false;

    let retryQuery = supabase
      .from('saunas')
      .select('id, name, description, types, amenities, place_id, city_slug')
      .order('id', { ascending: true });
    if (citySlug) retryQuery = retryQuery.eq('city_slug', citySlug);

    const result = await retryQuery;
    data = result.data;
    error = result.error;
  }

  if (error) throw error;
  if (limit) data = data.slice(0, limit);
  return { saunas: data, hasVerificationColumn };
}

// ─── CSV Report ─────────────────────────────────────────────────────────────
function generateEnrichCSV(changes, errors, citySlug) {
  const esc = (s) => `"${(s || '').toString().replace(/"/g, '""')}"`;
  const lines = ['id,name,field,before,after,status'];

  for (const change of changes) {
    const before = Array.isArray(change.before) ? change.before.join('; ') : change.before;
    const after = Array.isArray(change.after) ? change.after.join('; ') : change.after;
    lines.push(`${change.id},${esc(change.name)},${change.field},${esc(before)},${esc(after)},CHANGED`);
  }

  for (const err of errors) {
    lines.push(`${err.id},${esc(err.name)},error,,,${esc(err.error)}`);
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
    console.log('Usage: node scripts/enrich-saunas.js [--dry-run] [--refetch] [--limit=N] [--city=<slug>]');
    console.log('\nFlags:');
    console.log('  --dry-run   Output CSV of proposed changes, no DB writes');
    console.log('  --refetch   Re-fetch Google Places API for richer text matching');
    console.log('  --limit=N   Process only N records');
    console.log('  --city=X    Filter by city_slug (e.g., nyc, sf)');
    process.exit(0);
  }

  const dryRun = args.includes('--dry-run');
  const refetch = args.includes('--refetch');
  const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1];
  const limit = limitArg ? parseInt(limitArg, 10) : null;
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

  const { saunas, hasVerificationColumn } = await fetchSaunasToEnrich(cityArg, limit);
  console.log(`Fetched ${saunas.length} saunas to enrich\n`);

  if (saunas.length === 0) {
    console.log('Nothing to enrich.');
    return;
  }

  const changes = [];
  const errors = [];

  for (let i = 0; i < saunas.length; i++) {
    const sauna = saunas[i];
    process.stdout.write(`  [${i + 1}/${saunas.length}] ${sauna.name}...`);

    try {
      // Build text corpus
      let placeDetails = null;
      if (refetch && sauna.place_id) {
        placeDetails = await fetchPlaceDetails(sauna.place_id);
        await sleep(300);
      }
      const textCorpus = buildTextCorpus(sauna, placeDetails);

      // Enrich amenities
      const { amenities: newAmenities, added: addedAmenities } =
        enrichAmenities(sauna.amenities || [], textCorpus);

      // Enrich types
      const { types: newTypes, added: addedTypes } =
        enrichTypes(sauna.types || [], sauna.name, sauna.description || '');

      // Build update payload
      const update = {};
      let hasChanges = false;

      if (addedAmenities.length > 0) {
        update.amenities = newAmenities;
        changes.push({ id: sauna.id, name: sauna.name, field: 'amenities',
          before: sauna.amenities, after: newAmenities });
        hasChanges = true;
      }
      if (addedTypes.length > 0) {
        update.types = newTypes;
        changes.push({ id: sauna.id, name: sauna.name, field: 'types',
          before: sauna.types, after: newTypes });
        hasChanges = true;
      }

      if (hasVerificationColumn) {
        update.verification_status = 'verified';
      }

      if ((hasChanges || hasVerificationColumn) && !dryRun) {
        const { error } = await supabase
          .from('saunas')
          .update(update)
          .eq('id', sauna.id);
        if (error) throw error;
      }

      const parts = [];
      if (addedAmenities.length > 0) parts.push(`+${addedAmenities.length} amenities (${addedAmenities.join(', ')})`);
      if (addedTypes.length > 0) parts.push(`+${addedTypes.length} types (${addedTypes.join(', ')})`);
      console.log(parts.length > 0 ? ` ${parts.join(', ')}` : ' no changes');

    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      errors.push({ id: sauna.id, name: sauna.name, error: err.message });
    }
  }

  // Summary
  const changedIds = new Set(changes.map(c => c.id));
  console.log(`\n--- Summary ---`);
  console.log(`  Processed: ${saunas.length}`);
  console.log(`  Changed:   ${changedIds.size}`);
  console.log(`  Errors:    ${errors.length}`);

  if (changes.length > 0) {
    const csvFile = generateEnrichCSV(changes, errors, cityArg);
    console.log(`\nCSV report saved to: ${csvFile}`);
  }

  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
