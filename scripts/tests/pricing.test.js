import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPricing, pricingReviewSnippets } from '../lib/pricing.js';
import { extractWebsiteContent, crawlWebsite } from '../lib/website-content.js';

const source = (text, structuredData = []) => ({ usable: true, url: 'https://spa.test/pricing', text, structuredData });
const checkedAt = '2026-10-02T12:00:00Z';

test('exact prices retain currency, conditions, source, date and review status', () => {
  const [candidate] = extractPricing([source('Weekday day pass USD $55.50 including tax.')], { checkedAt });
  assert.equal(candidate.price, '55.50');
  assert.equal(candidate.currency, 'USD');
  assert.equal(candidate.duration, 'Day pass');
  assert.equal(candidate.evidence, 'Weekday day pass USD $55.50 including tax.');
  assert.equal(candidate.source_url, 'https://spa.test/pricing');
  assert.equal(candidate.checked_at, checkedAt);
  assert.equal(candidate.verification_status, 'needs_review');
});

test('bare dollars need known location currency and record the inference', () => {
  assert.deepEqual(extractPricing([source('Day pass $60.')]), []);
  const [candidate] = extractPricing([source('Day pass $60.')], { defaultCurrency: 'CAD' });
  assert.equal(candidate.currency, 'CAD');
  assert.equal(candidate.currency_inferred, true);
  assert.equal(candidate.price, '60.00');
});

test('explicit Canadian currency overrides location default; duration is not invented', () => {
  const [candidate] = extractPricing([source('General admission C$70')], { defaultCurrency: 'USD' });
  assert.equal(candidate.currency, 'CAD');
  assert.equal(candidate.currency_inferred, false);
  assert.equal(candidate.duration, null);
  assert.equal(extractPricing([source('60-minute sauna session CAD 45')])[0].duration, '60 min');
});

test('ambiguous, unrelated, promotional, and multiple-price lines are withheld', () => {
  for (const text of ['Day pass from $50', 'Day Pass, Starts at $39', 'Day pass $50–75', 'Day pass $50 weekday / $75 weekend',
    'Day pass membership $99/month', 'Massage $100', 'Day pass gift package $80',
    'Child day pass $20', 'Day pass was $80 now $60', 'Day pass $1,000.00', 'Day pass $50.999']) {
    assert.deepEqual(extractPricing([source(text)], { defaultCurrency: 'USD' }), [], text);
  }
});

test('ambiguous pricing survives as source evidence without becoming a fixed price', () => {
  const page = source('Day Pass, Starts at $39');
  assert.deepEqual(extractPricing([page], { defaultCurrency: 'USD' }), []);
  assert.equal(pricingReviewSnippets([page])[0].evidence, page.text);
  const columns = { ...source('Admission\nWeekday\nWeekend\nAdults\n$85\nAdults\n$110'), heading: 'Admission' };
  assert.ok(pricingReviewSnippets([columns]).length);
  assert.deepEqual(extractPricing([columns], { defaultCurrency: 'USD' }), []);
});

test('structured service offers are extracted without executing scripts', () => {
  const data = { '@context': 'https://schema.org', '@type': 'Service', name: 'Day pass',
    offers: { '@type': 'Offer', price: '65', priceCurrency: 'USD' } };
  const page = extractWebsiteContent(`<h1>Admission</h1><p>Book your sauna visit and enjoy our facilities today.</p>
    <script type="application/ld+json">${JSON.stringify(data)}</script>`, 'https://spa.test/pricing');
  const [candidate] = extractPricing([page], { checkedAt });
  assert.equal(candidate.price, '65.00');
  assert.equal(candidate.extraction_method, 'json-ld');
  assert.ok(!page.text.includes('priceCurrency'));
});

test('expired offers, ranges, and packages cannot bypass restrictions via nested offers', () => {
  for (const product of [
    { name: 'Day pass', offers: { price: '50', validThrough: '2020-01-01' } },
    { name: 'Day pass', offers: { lowPrice: '50', highPrice: '80' } },
    { name: 'Massage package', offers: { name: 'Day pass', price: '50' } },
    { name: 'Day pass', offers: { price: '50', availability: 'https://schema.org/SoldOut' } },
  ]) {
    const node = { '@type': 'Product', ...product, offers: { '@type': 'Offer', priceCurrency: 'USD', ...product.offers } };
    assert.deepEqual(extractPricing([source('', [node])], { checkedAt }), []);
  }
});

test('pricing crawl prioritizes rate pages while retaining its request cap', async () => {
  const calls = [];
  await crawlWebsite('https://spa.test/', {
    maxPages: 2, prioritizePricing: true, sleep: async () => {},
    fetchImpl: async url => {
      calls.push(url);
      return { ok: true, url, headers: { get: () => 'text/html' }, text: async () =>
        '<h1>Our spa</h1><p>Come and enjoy a relaxing afternoon at our sauna facilities.</p><a href="/spa">Spa</a><a href="/rates">Admission rates</a>' };
    },
  });
  assert.deepEqual(calls, ['https://spa.test/', 'https://spa.test/rates']);
});
