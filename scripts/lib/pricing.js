const ADMISSION = /\b(?:day[ -]?pass|daily admission|general admission|bathing pass|bathhouse admission|thermal (?:entry|access)|sauna (?:session|admission))\b/i;
const AMBIGUOUS = /\b(?:from|starts?|starting|save|discount|membership|monthly|annual|package|bundle|gift|massage|facial|children|child|student|senior|deposit|was|previously|expired|sold out|unavailable)\b|\bper\s+(?:month|week|year)\b|\/(?:mo|month|year)\b|\d\s*[-–]\s*\$?\d/i;

function duration(label) {
  const minutes = label.match(/\b(\d+)[\s-]*(?:min(?:ute)?s?)\b/i);
  if (minutes) return `${minutes[1]} min`;
  const hours = label.match(/\b(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i);
  if (hours) return `${hours[1]} hours`;
  return /day[ -]?pass|daily admission/i.test(label) ? 'Day pass' : null;
}

// Candidates still need a person to confirm branch, eligibility, taxes, and
// what facilities admission includes. No extracted price is marked verified.
export function extractPricing(pages, { defaultCurrency = null, checkedAt = new Date().toISOString() } = {}) {
  const results = new Map();
  const add = (label, amount, currency, page, evidence, method, currencyInferred = false) => {
    if (!ADMISSION.test(label) || AMBIGUOUS.test(label) || !/^\d+(?:\.\d{1,2})?$/.test(String(amount))) return;
    const price = Number(amount);
    if (!Number.isFinite(price) || price <= 0 || price > 2000 || !['USD', 'CAD'].includes(currency)) return;
    const candidate = {
      duration: duration(label), price: price.toFixed(2), currency,
      description: label.trim(), source_url: page.url, evidence,
      extraction_method: method, currency_inferred: currencyInferred,
      checked_at: checkedAt, verification_status: 'needs_review',
    };
    const key = JSON.stringify([candidate.description, candidate.price, currency, page.url]);
    if (!results.has(key)) results.set(key, candidate);
  };

  for (const page of pages) {
    if (!page.usable) continue;
    const visit = (node, depth = 0) => {
      if (!node || typeof node !== 'object' || depth > 20) return;
      if (Array.isArray(node)) { node.forEach(item => visit(item, depth + 1)); return; }
      const types = [].concat(node['@type'] || []);
      if (types.some(type => ['Product', 'Service', 'Offer'].includes(type))) {
        const offers = types.includes('Offer') ? [node] : [].concat(node.offers || []);
        for (const offer of offers) {
          if (!offer || typeof offer !== 'object' || /SoldOut|OutOfStock|Discontinued/i.test(offer.availability || '')) continue;
          if (offer.validThrough && new Date(offer.validThrough) < new Date(checkedAt)) continue;
          if (offer.validFrom && new Date(offer.validFrom) > new Date(checkedAt)) continue;
          const label = [node.name, offer === node ? null : offer.name, offer.description, node.description].filter(Boolean).join(' — ');
          add(label, offer.price, offer.priceCurrency, page, JSON.stringify({ name: node.name, offer }), 'json-ld');
        }
      }
      // Offers handled with their parent must not be reinterpreted without
      // the parent's restrictions (for example a massage + day-pass package).
      for (const [key, value] of Object.entries(node)) {
        if (key !== 'offers' && typeof value === 'object') visit(value, depth + 1);
      }
    };
    for (const node of page.structuredData || []) visit(node);

    for (const line of page.text.split('\n')) {
      if (!ADMISSION.test(line) || AMBIGUOUS.test(line)) continue;
      const amounts = [...line.matchAll(/(?:(USD|CAD|US|CA|C)\s*)?\$\s*(\d+(?:\.\d{1,2})?)(?!\d|[.,]\d)(?:\s*(USD|CAD)\b)?|\b(USD|CAD)\s+(\d+(?:\.\d{1,2})?)(?!\d|[.,]\d)/gi)];
      if (amounts.length !== 1) continue;
      const match = amounts[0];
      const explicit = (match[1] || match[3] || match[4] || '').toUpperCase();
      const currency = ['C', 'CA', 'CAD'].includes(explicit) ? 'CAD' : ['US', 'USD'].includes(explicit) ? 'USD' : defaultCurrency;
      add(line, match[2] || match[5], currency, page, line, 'visible-text', !explicit);
    }
  }
  return [...results.values()];
}

// Keep multi-column prices and lower bounds useful for human review without
// guessing which labels, durations, or conditions apply to their amounts.
export function pricingReviewSnippets(pages) {
  return pages.filter(page => page.usable).flatMap(page => {
    const lines = page.text.split('\n');
    const snippets = new Set();
    for (let index = 0; index < lines.length; index++) {
      if (!/\$\s*\d|\b(?:USD|CAD)\s*\d/i.test(lines[index])) continue;
      const context = lines.slice(Math.max(0, index - 3), index + 3).join('\n');
      if (ADMISSION.test(context) || /\badmission\b/i.test(page.heading)) snippets.add(context);
    }
    return [...snippets].map(evidence => ({ source_url: page.url, evidence, verification_status: 'needs_review' }));
  });
}
