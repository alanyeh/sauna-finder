import fetch from 'node-fetch';

const RELEVANT = /\b(?:sauna|spa|wellness|amenities|facilities|bathhouse|thermal|pricing|prices|rates|admission|day[ -]?pass)\b/i;
const NOT_FOUND = /\b(?:404|page not found|access denied|just a moment|verify you are human)\b/i;

function locationScope(url) {
  // File entry points belong to their parent location directory.
  return url.pathname.replace(/\/[^/]+\.(?:html?|php|aspx?)$/i, '').replace(/\/$/, '');
}

function linkPriority(url) {
  const path = new URL(url).pathname.replace(/[-_/]/g, ' ');
  if (/\b(?:sauna|amenities|facilities|bathhouse|thermal)\b/i.test(path)) return 3;
  if (/\b(?:spa|wellness)\b/i.test(path)) return 2;
  return 1;
}

function decode(text) {
  const entities = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', nbsp: ' ' };
  return text.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi, (entity, value) => {
    if (!value.startsWith('#')) return entities[value.toLowerCase()] || entity;
    const code = value[1].toLowerCase() === 'x' ? parseInt(value.slice(2), 16) : Number(value.slice(1));
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
  });
}

// Lightweight static HTML extraction. Scripts are never executed; sites that
// require JavaScript need separate review rather than an invented result.
export function extractWebsiteContent(html, pageUrl, scopeUrl = pageUrl) {
  const structuredData = [];
  for (const match of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)) {
    try { structuredData.push(JSON.parse(match[1])); } catch { /* Malformed metadata is not evidence. */ }
  }
  const clean = html.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const toText = value => decode(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
  const heading = [...clean.matchAll(/<(title|h1)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)]
    .map(match => toText(match[2])).join(' ');
  const body = clean.replace(/<(nav|header|footer)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '');
  const text = body.split(/<\/(?:p|div|li|section|h[1-6]|article|tr)>|<br\s*\/?>/i)
    .map(toText).filter(Boolean).join('\n');
  const base = new URL(pageUrl);
  const links = new Set();
  for (const match of clean.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const href = match[1].match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (!href) continue;
    try {
      const url = new URL(decode(href[1] ?? href[2] ?? href[3]), base);
      url.hash = '';
      if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin || url.href === base.href) continue;
      // On chain websites, stay under the supplied location path instead of
      // selecting another property's spa or a corporate amenities page.
      const scope = locationScope(new URL(scopeUrl));
      if (scope && !url.pathname.startsWith(`${scope}/`)) continue;
      if (RELEVANT.test(`${url.pathname.replace(/[-_/]/g, ' ')} ${toText(match[2])}`)) links.add(url.href);
    } catch { /* Ignore malformed links. */ }
  }
  return { url: base.href, heading, text, structuredData, links: [...links].sort((a, b) => linkPriority(b) - linkPriority(a)), usable: !NOT_FOUND.test(heading) && text.length > 40 };
}

export async function crawlWebsite(baseUrl, {
  fetchImpl = fetch,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  maxPages = 3,
  prioritizePricing = false,
} = {}) {
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 5) throw new Error('maxPages must be 1–5');
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol)) throw new Error('Website must use HTTP or HTTPS');
  const pages = [];
  const errors = [];
  const seen = new Set();
  base.hash = '';
  const queue = [base.href];
  const scheduled = new Set(queue);
  let rootUrl;
  let origin;
  let scope;
  for (let requests = 0; queue.length && requests < maxPages; requests++) {
    const url = queue.shift();
    if (seen.has(url)) { requests--; continue; }
    if (requests) await sleep(300);
    try {
      const response = await fetchImpl(url, {
        headers: { 'User-Agent': 'KoriboshiSaunaFinder/1.0', Accept: 'text/html' },
        signal: AbortSignal.timeout(10000), size: 2 * 1024 * 1024, follow: 5,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!/text\/html|application\/xhtml\+xml/i.test(response.headers.get('content-type') || '')) {
        throw new Error('Not an HTML page');
      }
      const finalUrl = new URL(response.url || url);
      finalUrl.hash = '';
      if (origin && (finalUrl.origin !== origin || (scope && !finalUrl.pathname.startsWith(`${scope}/`)))) {
        errors.push({ url, error: 'Redirect left the location scope' });
        continue;
      }
      if (seen.has(finalUrl.href)) continue;
      seen.add(finalUrl.href);
      const page = extractWebsiteContent(await response.text(), finalUrl.href, rootUrl || finalUrl.href);
      if (!page.usable) {
        errors.push({ url, error: 'Empty, error, or challenge page' });
        continue;
      }
      pages.push(page);
      if (requests === 0) {
        origin = finalUrl.origin;
        scope = locationScope(finalUrl);
        rootUrl = finalUrl.href;
      }
      for (const link of page.links) {
        if (!scheduled.has(link) && !seen.has(link)) {
          scheduled.add(link);
          queue.push(link);
        }
      }
      const priority = url => prioritizePricing && /pricing|prices|rates|admission|day[-_]?pass/i.test(new URL(url).pathname) ? 4 : linkPriority(url);
      queue.sort((a, b) => priority(b) - priority(a));
    } catch (error) {
      errors.push({ url, error: error.message });
    }
  }
  return { pages, errors };
}

export function selectSpaPage(pages, fallback) {
  // A relevant heading is required: a navigation link mentioning "spa" on
  // every page must not validate a soft 404 or an unrelated landing page.
  const candidates = [...pages.slice(1), ...pages.slice(0, 1)];
  return candidates.find(page => page.usable && /\b(?:sauna|spa|wellness|bathhouse|thermal)\b/i.test(page.heading))?.url || fallback;
}
