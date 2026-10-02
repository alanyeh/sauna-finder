import test from 'node:test';
import assert from 'node:assert/strict';
import { inferAmenityEvidence, placeTextSources, hasSaunaEvidence } from '../lib/amenities.js';
import { collectSearchPages, fetchPlacesJSON, PlacesQuotaError } from '../lib/places.js';

test('explicit amenities are detected with supporting text', () => {
  const evidence = inferAmenityEvidence(['Enjoy a Finnish sauna and cold plunge.', 'Our infrared sauna is available daily.']);
  assert.deepEqual(Object.keys(evidence).sort(), ['cold_plunge', 'dry_sauna', 'infrared_sauna']);
  assert.equal(evidence.cold_plunge, 'Enjoy a Finnish sauna and cold plunge');
});

test('negated, unavailable, and future amenities are not suggested', () => {
  for (const text of ['No cold plunge.', 'The cold plunge is closed.', 'I wish they had a cold plunge.',
    'A cold plunge is coming soon.', 'The cold plunge isn’t available.', 'They removed the cold plunge.']) {
    assert.deepEqual(inferAmenityEvidence([text]), {}, text);
  }
});

test('ambiguous words do not imply facilities or gender policies', () => {
  assert.deepEqual(inferAmenityEvidence(['Eucalyptus towels, couples packages, communal seating, private hotel rooms, infrared light therapy and a plunge pool.']), {});
  assert.deepEqual(Object.keys(inferAmenityEvidence(['Our cold pool is open.'])), ['cold_plunge']);
});

test('conflicting evidence is withheld while independent amenities remain', () => {
  const sources = placeTextSources({ displayName: { text: 'Wellness' }, reviews: [
    { text: { text: 'Loved the steam room.' } },
    { originalText: { text: 'The steam room is no longer available. Enjoy the dry sauna.' } },
  ] });
  assert.deepEqual(Object.keys(inferAmenityEvidence(sources)), ['dry_sauna']);
});

test('hotel or gym categories alone do not establish a sauna facility', () => {
  assert.equal(hasSaunaEvidence(['Luxury Hotel', 'A fitness center with massages.']), false);
  assert.equal(hasSaunaEvidence(['Hotel', 'Guests have access to a sauna.']), true);
  assert.equal(hasSaunaEvidence(['Fitness Club', 'This location has no sauna.']), false);
  assert.equal(hasSaunaEvidence(['Hotel', 'Sauna coming soon.']), false);
});

test('pagination consumes tokens and deduplicates IDs across pages', async () => {
  const calls = [];
  const results = await collectSearchPages(async token => {
    calls.push(token);
    return token ? { places: [{ id: 'a' }, { id: 'b' }] }
      : { places: [{ id: 'a' }], nextPageToken: 'page-2' };
  }, async () => {});
  assert.deepEqual(calls, [null, 'page-2']);
  assert.deepEqual(results.map(p => p.id), ['a', 'b']);
});

test('repeated tokens fail instead of creating an infinite request loop', async () => {
  await assert.rejects(collectSearchPages(async () => ({ nextPageToken: 'same' }), async () => {}), /repeated/);
});

const response = (status, body = '') => ({ ok: status === 200, status, text: async () => body, json: async () => ({ places: [] }) });

test('transient failures retry with bounded backoff and preserve request options', async () => {
  let calls = 0;
  const waits = [];
  const result = await fetchPlacesJSON('https://example.test', { method: 'POST', body: '{}' }, {
    fetchImpl: async (_url, options) => {
      assert.equal(options.method, 'POST');
      assert.equal(options.body, '{}');
      assert.ok(options.signal instanceof AbortSignal);
      return response(++calls < 3 ? 503 : 200);
    }, sleep: async ms => waits.push(ms),
  });
  assert.deepEqual(result, { places: [] });
  assert.deepEqual(waits, [500, 1000]);
});

test('daily quota and permanent failures do not retry', async () => {
  for (const status of [429, 403, 400]) {
    let calls = 0;
    await assert.rejects(fetchPlacesJSON('https://example.test', {}, {
      fetchImpl: async () => { calls++; return response(status); },
      sleep: async () => assert.fail('should not retry'),
    }), status === 429 ? PlacesQuotaError : Error);
    assert.equal(calls, 1);
  }
});

test('persistent server failures stop after three attempts', async () => {
  let calls = 0;
  await assert.rejects(fetchPlacesJSON('https://example.test', {}, {
    fetchImpl: async () => { calls++; return response(503); }, sleep: async () => {},
  }), /503/);
  assert.equal(calls, 3);
});
