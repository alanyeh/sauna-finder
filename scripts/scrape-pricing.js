// Read official websites and write a review report. Never modifies Supabase.
import { readFile, writeFile } from 'node:fs/promises';
import { crawlWebsite } from './lib/website-content.js';
import { extractPricing, pricingReviewSnippets } from './lib/pricing.js';

const args = process.argv.slice(2);
const option = name => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (args.includes('--help')) {
  console.log('Usage: node scripts/scrape-pricing.js [--city=nyc] [--limit=10] [--input=saunas.json] [--output=report.json]');
  console.log('Reads up to 3 pages per listing. Writes price candidates with evidence; never updates listings.');
  process.exit(0);
}
const limit = Number(option('limit') ?? 10);
if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('--limit must be a positive integer');
const city = option('city');
const rows = JSON.parse(await readFile(option('input') || 'src/data/saunas-prebuilt.json', 'utf8'));
if (!Array.isArray(rows)) throw new Error('Input must be an array of sauna records');
const selected = rows.filter(row => row.website_url && (!city || row.city_slug === city)).slice(0, limit);
const checkedAt = new Date().toISOString();
const report = [];
for (const row of selected) {
  console.log(`Checking ${row.name}`);
  try {
    const { pages, errors } = await crawlWebsite(row.website_url, { prioritizePricing: true });
    const canadian = ['toronto', 'vancouver'];
    const american = ['nyc', 'sf', 'la', 'chicago', 'seattle', 'portland', 'miami', 'houston', 'park-city', 'minneapolis', 'denver'];
    const currency = canadian.includes(row.city_slug) ? 'CAD' : american.includes(row.city_slug) ? 'USD' : null;
    const candidates = extractPricing(pages, { defaultCurrency: currency, checkedAt });
    report.push({ id: row.id, name: row.name, city_slug: row.city_slug,
      existing_pricing: row.pricing_options || [], candidates, review_snippets: pricingReviewSnippets(pages),
      pages_checked: pages.map(page => page.url), errors });
    console.log(`  ${candidates.length} price candidate(s), ${errors.length} page error(s)`);
  } catch (error) {
    report.push({ id: row.id, name: row.name, candidates: [], errors: [{ error: error.message }] });
  }
}
const output = option('output') || `scripts/pricing-report-${Date.now()}.json`;
await writeFile(output, JSON.stringify({ checked_at: checkedAt, status: 'needs_review', listings: report }, null, 2));
console.log(`Saved ${output}. Confirm source, location, currency, conditions, and taxes before publishing.`);
