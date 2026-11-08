// Check the HTML served to crawlers, without executing client JavaScript.
import fs from 'node:fs/promises';
import { CITY_CONFIG } from '../src/lib/cities.js';
import { saunaPath, saunaRoutes } from '../src/lib/saunaRoutes.js';
import { isDiscoverableSauna } from '../src/lib/publicSaunas.js';
const site = 'https://sauna-finder.koriboshi.com';
const origin = process.argv[2] || site;
const rows = JSON.parse(await fs.readFile(new URL('../src/data/saunas-prebuilt.json', import.meta.url), 'utf8')).filter(isDiscoverableSauna);
const routes = ['/', ...Object.keys(CITY_CONFIG).filter(s => s !== 'all').map(s => `/city/${s}`), ...saunaRoutes(rows)];
const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
const listed = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
const failures = [];
for (const path of routes) if (!listed.includes(site + path)) failures.push(`${path}: missing from sitemap`);
for (const url of listed) if (!routes.includes(url.replace(site, ''))) failures.push(`${url}: stale sitemap entry`);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
let cursor = 0;
await Promise.all(Array.from({ length: 8 }, async () => {
  while (cursor < routes.length) {
    const path = routes[cursor++];
    try {
      const response = await fetch(origin + path, { signal: AbortSignal.timeout(30000) });
      const html = await response.text();
      const check = (ok, reason) => { if (!ok) failures.push(`${path}: ${reason}`); };
      check(response.status === 200, `HTTP ${response.status}`);
      const links = html.match(/<link\b[^>]*>/g) || [];
      const canonical = links.filter(t => attr(t, 'rel') === 'canonical');
      check(canonical.length === 1 && attr(canonical[0], 'href') === site + path, 'canonical mismatch');
      const metas = html.match(/<meta\b[^>]*>/g) || [];
      const meta = key => metas.find(t => attr(t, 'name') === key || attr(t, 'property') === key);
      check(!!attr(meta('description') || '', 'content'), 'missing description');
      check(attr(meta('robots') || '', 'content') === 'index,follow', 'not indexable');
      check(attr(meta('og:url') || '', 'content') === site + path, 'OG URL mismatch');
      check((html.match(/<h1\b/g) || []).length === 1, 'expected one H1');
      check((html.match(/<title>/g) || []).length === 1, 'expected one title');
      const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
      check(schemas.length > 0, 'missing structured data');
      const nodes = schemas.flatMap(s => s['@graph'] || [s]);
      const row = rows.find(r => saunaPath(r) === path);
      if (row) {
        const business = nodes.find(n => n['@type'] === 'LocalBusiness');
        check(business?.name === row.name && business?.url === site + path, 'wrong business schema');
        check(nodes.some(n => n['@type'] === 'BreadcrumbList'), 'missing breadcrumbs');
        check(!business?.aggregateRating, 'third-party ratings in review schema');
        if (row.photos?.length) check(attr(meta('og:image') || '', 'content') === row.photos[0], 'missing venue sharing image');
      } else if (path.startsWith('/city/')) {
        const city = path.split('/')[2];
        const expected = rows.filter(r => r.city_slug === city);
        const list = nodes.find(n => n['@type'] === 'ItemList');
        check(list?.numberOfItems === expected.length, 'stale city count');
        check(list?.itemListElement?.length === expected.length, 'incomplete city structured data');
        for (const row of expected) check(html.includes(saunaPath(row)), `missing internal link to ${row.name}`);
      }
    } catch (error) { failures.push(`${path}: ${error.message}`); }
  }
}));
const robots = await (await fetch(`${origin}/robots.txt`)).text();
if (!robots.includes(`Sitemap: ${site}/sitemap.xml`)) failures.push('robots.txt: missing sitemap');
console.log(JSON.stringify({ pages: routes.length, cities: Object.keys(CITY_CONFIG).length - 1, venues: rows.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
