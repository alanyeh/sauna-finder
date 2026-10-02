import test from 'node:test';
import assert from 'node:assert/strict';
import { crawlWebsite, extractWebsiteContent, selectSpaPage } from '../lib/website-content.js';

const page = (title, text, links = '') => `<html><head><title>${title}</title></head><body><h1>${title}</h1><p>${text}</p>${links}</body></html>`;
const text = 'Visit our location for Finnish sauna sessions and relaxing cold plunge experiences.';
const htmlResponse = (url, html) => ({
  ok: true, url, headers: { get: () => 'text/html; charset=utf-8' }, text: async () => html,
});

test('extracts visible text and scoped links without script or navigation claims', () => {
  const result = extractWebsiteContent(page('Hotel', text,
    `<script>const x = 'infrared sauna';</script><nav>Swimming pool</nav>
    <a href='/locations/nyc/spa'>Spa &amp; Wellness</a>
    <a href='/locations/boston/spa'>Boston Spa</a>
    <a href='https://other.test/spa'>Spa</a>
    <a href='javascript:alert(1)'>Spa</a>`), 'https://hotel.test/locations/nyc/');
  assert.deepEqual(result.links, ['https://hotel.test/locations/nyc/spa']);
  assert.ok(result.text.includes('Finnish sauna'));
  assert.ok(!result.text.includes('infrared sauna'));
  assert.ok(!result.text.includes('Swimming pool'));
});

test('resolves relative links, decodes entities, and deduplicates anchors', () => {
  const result = extractWebsiteContent(page('Hotel', text,
    `<a href="spa?x=1&amp;y=2#menu">Spa</a><a href='spa?x=1&amp;y=2'>Spa</a>`), 'https://hotel.test/location/');
  assert.deepEqual(result.links, ['https://hotel.test/location/spa?x=1&y=2']);
});

test('crawl follows actual links, enforces request cap, and prefers spa heading', async () => {
  const calls = [];
  const result = await crawlWebsite('https://hotel.test/', {
    fetchImpl: async (url, options) => {
      calls.push(url);
      assert.equal(options.size, 2 * 1024 * 1024);
      assert.ok(options.signal instanceof AbortSignal);
      return htmlResponse(url, url.endsWith('/spa') ? page('Spa and Wellness', text)
        : page('Hotel', text, `<a href='/spa'>Spa</a><a href='/pricing'>Pricing</a>`));
    }, sleep: async () => {}, maxPages: 2,
  });
  assert.deepEqual(calls, ['https://hotel.test/', 'https://hotel.test/spa']);
  assert.equal(selectSpaPage(result.pages, 'https://hotel.test/'), 'https://hotel.test/spa');
});

test('soft 404 and challenge pages are rejected despite HTTP 200', async () => {
  for (const title of ['404 Page Not Found', 'Just a moment', 'Access Denied']) {
    const result = await crawlWebsite('https://hotel.test/', {
      fetchImpl: async url => htmlResponse(url, page(title, text, `<a href='/spa'>Spa</a>`)),
    });
    assert.equal(result.pages.length, 0);
    assert.equal(result.errors.length, 1);
  }
});

test('redirects to homepage or another property do not replace location URL', async () => {
  for (const destination of ['https://hotel.test/', 'https://other.test/spa', 'https://hotel.test/locations/boston/spa']) {
    const base = 'https://hotel.test/locations/nyc/';
    const result = await crawlWebsite(base, {
      fetchImpl: async url => url === base
        ? htmlResponse(url, page('NYC Hotel', text, `<a href='spa'>Spa</a>`))
        : htmlResponse(destination, page('Spa', text)),
      sleep: async () => {},
    });
    assert.equal(result.pages.length, 1);
    assert.equal(selectSpaPage(result.pages, base), base);
  }
});

test('network failures and non-HTML responses produce reviewable errors', async () => {
  for (const fetchImpl of [async () => { throw new Error('timeout'); },
    async () => ({ ok: true, headers: { get: () => 'application/pdf' } })]) {
    const result = await crawlWebsite('https://hotel.test/', { fetchImpl });
    assert.equal(result.pages.length, 0);
    assert.equal(result.errors.length, 1);
  }
});

test('file entry points allow sibling pages within the location only', () => {
  const result = extractWebsiteContent(page('Hotel', text,
    `<a href='spa.html'>Spa</a><a href='/locations/boston/spa'>Spa</a>`),
  'https://hotel.test/locations/nyc/index.html');
  assert.deepEqual(result.links, ['https://hotel.test/locations/nyc/spa.html']);
});

test('crawl discovers deeper pages and keeps the original location scope', async () => {
  const base = 'https://hotel.test/locations/nyc/';
  const calls = [];
  const result = await crawlWebsite(base, {
    fetchImpl: async url => {
      calls.push(url);
      const links = url === base ? `<a href='wellness'>Wellness</a>`
        : `<a href='amenities'>Amenities</a><a href='/locations/boston/sauna'>Sauna</a>`;
      return htmlResponse(url, page('Hotel', text, links));
    }, sleep: async () => {},
  });
  assert.deepEqual(calls, [base, `${base}wellness`, `${base}amenities`]);
  assert.equal(result.pages.length, 3);
});

test('prioritizes facility evidence over pricing links with the same request cap', async () => {
  const calls = [];
  await crawlWebsite('https://hotel.test/', {
    fetchImpl: async url => {
      calls.push(url);
      return htmlResponse(url, page('Hotel', text,
        `<a href='/pricing'>Prices</a><a href='/spa'>Spa</a><a href='/amenities'>Facilities</a>`));
    }, sleep: async () => {}, maxPages: 2,
  });
  assert.deepEqual(calls, ['https://hotel.test/', 'https://hotel.test/amenities']);
});

test('redirect aliases are not downloaded again from the pending queue', async () => {
  const calls = [];
  await crawlWebsite('https://hotel.test/', {
    fetchImpl: async url => {
      calls.push(url);
      return htmlResponse(url.endsWith('/spa') ? 'https://hotel.test/wellness' : url,
        page('Hotel', text, `<a href='/spa'>Spa</a><a href='/wellness'>Wellness</a><a href='/pricing'>Prices</a>`));
    }, sleep: async () => {}, maxPages: 3,
  });
  assert.deepEqual(calls, ['https://hotel.test/', 'https://hotel.test/spa', 'https://hotel.test/pricing']);
});
