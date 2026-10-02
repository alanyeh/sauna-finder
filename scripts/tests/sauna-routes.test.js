import test from 'node:test';
import assert from 'node:assert/strict';
import { saunaPath, saunaIdFromSlug, saunaRoutes } from '../../src/lib/saunaRoutes.js';
import { buildSitemapXml } from '../generate-sitemap.js';

const sauna = { id: 42, name: 'Bäth & Sauna / NYC', city_slug: 'nyc', lat: 40.7, lng: -74, types: ['Modern Bathhouse'], listing_status: 'active' };

test('descriptive paths are safe and IDs survive venue renames', () => {
  assert.equal(saunaPath(sauna), '/city/nyc/sauna/bath-sauna-nyc-42');
  assert.equal(saunaIdFromSlug('previous-name-42'), '42');
  assert.equal(saunaIdFromSlug('sauna-42-bad'), null);
  assert.equal(saunaIdFromSlug('42'), null);
  assert.equal(saunaPath({ ...sauna, name: '♨' }), '/city/nyc/sauna/sauna-42');
});

test('prerender routes and sitemap exclude hidden, duplicate and unconfirmed hotel listings', () => {
  const rows = [sauna, sauna,
    { ...sauna, id: 43, listing_status: 'review' },
    { ...sauna, id: 44, duplicate_of: 42 },
    { ...sauna, id: 45, types: ['Hotel Spa'] },
    { ...sauna, id: 46, name: 'Anytime Fitness' },
  ];
  assert.deepEqual(saunaRoutes(rows), [saunaPath(sauna)]);
  const xml = buildSitemapXml(rows);
  assert.ok(xml.includes(saunaPath(sauna)));
  assert.equal((xml.match(/\/sauna\//g) || []).length, 1);
  assert.ok(!xml.includes('/admin/'));
});
