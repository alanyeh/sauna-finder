// Run after vite build + prerender. Exercises actual browser navigation using
// the build snapshot, without depending on Maps or the live database.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { startStaticServer, puppeteer, launchOptions } from './prerender.js';
import { isDiscoverableSauna } from '../src/lib/publicSaunas.js';
import { saunaPath } from '../src/lib/saunaRoutes.js';

const rows = JSON.parse(await readFile(new URL('../src/data/saunas-prebuilt.json', import.meta.url), 'utf8'));
const sauna = rows.find(row => isDiscoverableSauna(row) && row.photos?.length > 1);
assert.ok(sauna, 'Need a published listing with photos for the browser checks');
const origin = 'http://localhost:4319';
const path = saunaPath(sauna);
const server = await startStaticServer();
let browser;
try {
  browser = await puppeteer.launch(launchOptions);
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.evaluateOnNewDocument(() => { window.__PRERENDER__ = true; });
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().startsWith(origin + '/') || request.resourceType() === 'image') request.continue();
    else request.abort();
  });
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`[data-sauna-detail="${sauna.id}"]`);
  assert.equal(await page.$eval('h1', el => el.textContent), sauna.name);
  assert.equal(await page.$eval('link[rel=canonical]', el => el.href), `https://sauna-finder.koriboshi.com${path}`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile layout must not overflow');
  await page.click('button[aria-label="Show photo 2"]');
  assert.equal(await page.$eval('button[aria-label="Show photo 2"]', el => el.getAttribute('aria-pressed')), 'true');
  await page.waitForFunction(() => {
    const hero = document.querySelector('section[aria-label^="Photos"] > img');
    return hero?.complete && hero.naturalWidth > 0;
  }, { timeout: 15000, polling: 100 });
  await page.screenshot({ path: '/private/tmp/sauna-detail-mobile.png', fullPage: true });
  await page.setViewport({ width: 1440, height: 1000 });
  await page.screenshot({ path: '/private/tmp/sauna-detail-desktop.png', fullPage: true });
  await page.goto(`${origin}/city/wrong-city/sauna/old-name-${sauna.id}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(expected => location.pathname === expected, {}, path);
  await page.waitForSelector('[data-sauna-detail]');
  await page.goto(`${origin}/city/nyc/sauna/missing-999999999`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('meta[name=robots]')?.content === 'noindex,follow');
  assert.ok((await page.$eval('h1', el => el.textContent)).includes('unavailable'));
  await page.goto(`${origin}/city/${sauna.city_slug}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`[data-sauna-id="${sauna.id}"] a[href="${path}"]`);
  await page.click(`[data-sauna-id="${sauna.id}"] .amenity-badge`);
  await page.waitForSelector('[data-sauna-detail]');
  assert.equal(new URL(page.url()).pathname, path);
  await page.click('a[href^="/city/"][class*="text-center"]');
  await page.waitForSelector(`[data-sauna-id="${sauna.id}"]`);
  assert.ok(await page.$eval(`[data-sauna-id="${sauna.id}"]`, el => el.className.includes('border-l-accent-red')), 'Map link should select the listing');
  await page.click(`[data-sauna-id="${sauna.id}"] button[aria-label="Next photo"]`);
  assert.equal(new URL(page.url()).pathname, `/city/${sauna.city_slug}`, 'Photo controls must not open the detail page');
  await page.focus(`[data-sauna-id="${sauna.id}"]`);
  await page.keyboard.press('Enter');
  await page.waitForSelector('[data-sauna-detail]');
  assert.equal(new URL(page.url()).pathname, path, 'Enter should open the focused card');
  assert.deepEqual(errors, []);
  console.log('Passed: detail links, map selection, stale URLs, missing listings, gallery, mobile layout, metadata.');
  console.log('Screenshots: /private/tmp/sauna-detail-mobile.png and /private/tmp/sauna-detail-desktop.png');
} finally {
  if (browser) await browser.close();
  server.close();
}
