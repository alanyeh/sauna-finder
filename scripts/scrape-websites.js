// Scrape website URLs for saunas using Google Places API.
// For hotels/gyms, attempts to find the specific spa/sauna page.
// Usage: node scripts/scrape-websites.js [--dry-run] [--city=<slug>]

import { createClient } from '@supabase/supabase-js';
import { crawlWebsite, selectSpaPage } from './lib/website-content.js';
import { fetchPlacesJSON, PlacesQuotaError } from './lib/places.js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch websiteUri from Google Places API
async function fetchWebsite(placeId) {
  if (!placeId) return null;

  const data = await fetchPlacesJSON(
    `https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'websiteUri',
      },
    }
  );

  return data.websiteUri || null;
}

function isHotelOrGym(name, types = []) {
  return (types || []).some(type => ['Hotel Spa', 'Resort', 'Gym Sauna'].includes(type))
    || /hotel|resort|gym|fitness|climbing|boulders|ymca|equinox|life\s*time|tmpl/i.test(name);
}

async function findSpaPage(baseUrl, name, types) {
  if (!isHotelOrGym(name, types)) return baseUrl;
  const { pages, errors } = await crawlWebsite(baseUrl);
  for (const error of errors) console.warn(`\n    Website: ${error.url}: ${error.error}`);
  return selectSpaPage(pages, baseUrl);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1] || null;

  console.log('\n=== Scraping website URLs ===');
  if (dryRun) console.log('  [DRY RUN — no DB writes]');
  if (cityArg) console.log(`  [CITY: ${cityArg}]`);
  console.log('');

  // Fetch saunas missing website_url (or all, to find spa-specific pages for hotels/gyms)
  let query = supabase
    .from('saunas')
    .select('id, name, place_id, website_url, types')
    .order('id', { ascending: true });

  if (cityArg) query = query.eq('city_slug', cityArg);

  const { data: saunas, error } = await query;
  if (error) { console.error(error.message); process.exit(1); }

  const needsUrl = saunas.filter(s => !s.website_url && s.place_id);
  const hasUrl = saunas.filter(s => s.website_url);
  const noPlaceId = saunas.filter(s => !s.website_url && !s.place_id);

  console.log(`Total saunas: ${saunas.length}`);
  console.log(`  Missing website + has place_id: ${needsUrl.length} (will fetch)`);
  console.log(`  Already has website: ${hasUrl.length} (will check for spa page)`);
  console.log(`  Missing website + no place_id: ${noPlaceId.length} (skipped)`);
  console.log('');

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Phase 1: Fetch missing website URLs from Google Places
  if (needsUrl.length > 0 && !API_KEY) {
    console.warn('Missing GOOGLE_PLACES_API_KEY: skipping missing URLs; checking existing websites only.');
  }
  if (needsUrl.length > 0 && API_KEY) {
    console.log('--- Phase 1: Fetching missing website URLs ---');
    for (let i = 0; i < needsUrl.length; i++) {
      const sauna = needsUrl[i];
      process.stdout.write(`  [${i + 1}/${needsUrl.length}] ${sauna.name}...`);

      try {
        let url = await fetchWebsite(sauna.place_id);
        await sleep(300);

        if (!url) {
          console.log(' no website found');
          skipped++;
          continue;
        }

        // For hotels/gyms, try to find the spa-specific page
        url = await findSpaPage(url, sauna.name, sauna.types);

        if (!dryRun) {
          const { error: updateErr } = await supabase
            .from('saunas')
            .update({ website_url: url })
            .eq('id', sauna.id);
          if (updateErr) throw new Error(updateErr.message);
        }

        console.log(` ${url}`);
        updated++;
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        errors++;
        if (err instanceof PlacesQuotaError) break;
      }
    }
    console.log('');
  }

  // Phase 2: For hotels/gyms that already have a base URL, try to find spa-specific page
  const hotelsGyms = hasUrl.filter(s => isHotelOrGym(s.name, s.types));

  if (hotelsGyms.length > 0) {
    console.log('--- Phase 2: Finding spa pages for hotels/gyms ---');
    for (let i = 0; i < hotelsGyms.length; i++) {
      const sauna = hotelsGyms[i];
      process.stdout.write(`  [${i + 1}/${hotelsGyms.length}] ${sauna.name}...`);

      try {
        const spaUrl = await findSpaPage(sauna.website_url, sauna.name, sauna.types);

        if (spaUrl !== sauna.website_url) {
          if (!dryRun) {
            const { error: updateErr } = await supabase
              .from('saunas')
              .update({ website_url: spaUrl })
              .eq('id', sauna.id);
            if (updateErr) throw new Error(updateErr.message);
          }
          console.log(` ${sauna.website_url} → ${spaUrl}`);
          updated++;
        } else {
          console.log(' no spa page found, keeping base URL');
          skipped++;
        }
      } catch (err) {
        console.log(` ERROR: ${err.message}`);
        errors++;
      }
    }
    console.log('');
  }

  console.log('--- Summary ---');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
