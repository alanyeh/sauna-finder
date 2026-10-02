// Read-only quality audit: fresh Supabase rows and bounded official-site crawls.
// Resume an interrupted run by passing the same --out=directory.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { crawlWebsite } from './lib/website-content.js';
import { inferAmenityEvidence } from './lib/amenities.js';

config({ path: '.env.local', quiet: true });
const out = resolve(process.argv.find(a => a.startsWith('--out='))?.slice(6) || `reports/quality-${new Date().toISOString().replace(/[:.]/g, '-')}`);
await mkdir(out, { recursive: true });
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY);
const rows = [];
for (let start = 0; ; start += 1000) {
  const { data, error } = await client.from('saunas').select('*').order('id').range(start, start + 999);
  if (error) throw new Error(`Could not read listings: ${error.message}`);
  rows.push(...data);
  if (data.length < 1000) break;
}
await writeFile(`${out}/listings.json`, JSON.stringify(rows, null, 2));
const patterns = {
  sauna: /\b(?:saunas?|banya|banyas?|jjimjilbang)\b/i,
  steam_only: /\b(?:steam\s*room|hammam|turkish\s*bath)\b/i,
  infrared: /\binfrared\s*(?:sauna|room|cabin|pod)s?\b/i,
  finnish: /\b(?:finnish|traditional|wood[ -]fired|dry)\s*saunas?\b/i,
  russian: /\b(?:banya|russian\s*(?:bath|sauna))\b/i,
  korean: /\b(?:korean|jjimjilbang)\b/i,
  japanese: /\b(?:japanese|sento|onsen)\b/i,
  private: /\bprivate\s*(?:sauna|session|room|suite|cabin)\b/i,
  hotel: /\b(?:hotel|resort|guest\s*room)\b/i,
  gym: /\b(?:gym|fitness|athletic\s*club)\b/i,
  public_access: /\b(?:day[ -]pass|day[ -]guest|non[ -]?(?:hotel[ -]?)?guests?|open to the public|public access|outside guests|resortpass)\b/i,
  guest_restriction: /\b(?:(?:hotel|registered|overnight|resort) guests? only|exclusively (?:for|to) .*guests?|reserved for .*guests?|only available to .*guests?)\b/i,
  float: /\b(?:floatation|flotation|float\s*(?:tank|therapy|suite|pod))\b/i,
};
const uncertain = /\b(?:no|not|without|closed|removed|unavailable|coming\s+soon|planned|opening\s+soon|out\s+of\s+order)\b/i;
const typeEvidence = type => /infrared/i.test(type) ? 'infrared'
  : /finnish|traditional sauna/i.test(type) ? 'finnish'
  : /russian|banya/i.test(type) ? 'russian'
  : /korean/i.test(type) ? 'korean'
  : /japanese/i.test(type) ? 'japanese'
  : /private/i.test(type) ? 'private'
  : /hotel/i.test(type) ? 'hotel'
  : /gym|athletic/i.test(type) ? 'gym'
  : /float/i.test(type) ? 'float' : null;
const origins = new Map();
for (const row of rows) {
  try { const origin = new URL(row.website_url).origin; origins.set(origin, (origins.get(origin) || 0) + 1); } catch { /* Report missing URL below. */ }
}
const cache = new Map();
const hostJobs = new Map();
function crawl(url) {
  if (cache.has(url)) return cache.get(url);
  const origin = new URL(url).origin;
  const job = (hostJobs.get(origin) || Promise.resolve()).catch(() => {}).then(() => crawlWebsite(url));
  hostJobs.set(origin, job);
  cache.set(url, job);
  return job;
}
let index = 0;
const results = [];
async function audit(row) {
  const filename = `${out}/listing-${row.id}.json`;
  try { const saved = JSON.parse(await readFile(filename, 'utf8')); if (saved.website === row.website_url && JSON.stringify(saved.types) === JSON.stringify(row.types)) return saved; } catch { /* New listing. */ }
  let website;
  try { website = row.website_url ? await crawl(row.website_url) : { pages: [], errors: [{ error: 'Missing website' }] }; }
  catch (error) { website = { pages: [], errors: [{ error: error.message }] }; }
  const evidence = {};
  const contradictions = [];
  for (const page of website.pages) {
    for (const sentence of page.text.split(/[.!?\n]+/).map(s => s.trim()).filter(Boolean)) {
      for (const [key, pattern] of Object.entries(patterns)) {
        if (!pattern.test(sentence)) continue;
        if (uncertain.test(sentence)) {
          if (['sauna', 'infrared', 'finnish', 'steam_only'].includes(key)) contradictions.push({ category: key, text: sentence.slice(0, 500), url: page.url });
        } else if (!evidence[key]) evidence[key] = { text: sentence.slice(0, 500), url: page.url };
      }
    }
  }
  const flags = [];
  if (!website.pages.length) flags.push('website_unavailable');
  else if (!evidence.sauna) flags.push(evidence.steam_only ? 'steam_evidence_only' : 'no_sauna_evidence_found');
  if (contradictions.length) flags.push('availability_language_needs_review');
  const unsupportedTypes = (row.types || []).filter(type => typeEvidence(type) && !evidence[typeEvidence(type)]);
  if (unsupportedTypes.length) flags.push('category_not_supported_by_crawled_pages');
  try {
    const url = new URL(row.website_url);
    if ((origins.get(url.origin) || 0) > 1 && /^\/(?:index\.html?)?$/.test(url.pathname)) flags.push('shared_brand_homepage_needs_location_check');
    if (website.pages[0] && new URL(website.pages[0].url).pathname === '/' && url.pathname !== '/') flags.push('location_redirected_to_homepage');
  } catch { /* Already reported. */ }
  if ((row.types || []).some(type => /hotel/i.test(type))) {
    if (evidence.guest_restriction) flags.push('hotel_guest_restriction_found');
    if (evidence.public_access) flags.push('hotel_public_access_mentioned_confirm_sauna_included');
    else flags.push('hotel_public_access_not_established');
  }
  if (!row.address || row.lat == null || row.lng == null) flags.push('missing_location_data');
  if (!(row.types || []).length) flags.push('missing_category');
  const duplicateIds = rows.filter(other => other.id !== row.id && ((row.place_id && row.place_id === other.place_id) || (row.address && row.name?.toLowerCase() === other.name?.toLowerCase() && row.address === other.address))).map(other => other.id);
  if (duplicateIds.length) flags.push('possible_duplicate');
  const amenities = inferAmenityEvidence(website.pages.map(page => page.text));
  const result = {
    id: row.id, name: row.name, city: row.city_slug, website: row.website_url, types: row.types,
    checkedAt: new Date().toISOString(), status: !website.pages.length ? 'unavailable' : flags.length ? 'review' : 'sauna_text_found',
    flags, unsupportedTypes, duplicateIds, evidence, contradictions: contradictions.slice(0, 10),
    amenitiesFound: Object.keys(amenities), existingAmenitiesNotFound: (row.amenities || []).filter(a => !amenities[a]),
    pages: website.pages.map(({ url, heading }) => ({ url, heading })), errors: website.errors,
  };
  await writeFile(filename, JSON.stringify(result, null, 2));
  return result;
}
await Promise.all(Array.from({ length: 4 }, async () => {
  while (index < rows.length) {
    const row = rows[index++];
    const result = await audit(row);
    results.push(result);
    console.log(`[${results.length}/${rows.length}] ${row.city_slug}: ${row.name}: ${result.status}`);
  }
}));
results.sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));
const tally = key => results.reduce((counts, row) => { for (const value of Array.isArray(row[key]) ? row[key] : [row[key]]) counts[value] = (counts[value] || 0) + 1; return counts; }, {});
const summary = { checkedAt: new Date().toISOString(), total: results.length, status: tally('status'), flags: tally('flags'), cities: tally('city'), limitations: 'Static HTML, at most 3 requests per website; missing evidence is not proof of absence. Shared brand pages may describe other locations. Keyword matches are review leads, not verification. No database writes or paid Places requests.' };
await writeFile(`${out}/summary.json`, JSON.stringify(summary, null, 2));
await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
const columns = ['id','name','city','status','website','types','flags','unsupportedTypes','existingAmenitiesNotFound','evidence','contradictions','errors'];
const esc = v => '"' + String(typeof v === 'object' ? JSON.stringify(v) : v ?? '').replace(/"/g, '""') + '"';
await writeFile(`${out}/review.csv`, [columns.join(','), ...results.map(row => columns.map(key => esc(row[key])).join(','))].join('\n'));
console.log(JSON.stringify(summary, null, 2));
console.log(`Reports: ${out}`);
