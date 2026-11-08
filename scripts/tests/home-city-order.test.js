import test from 'node:test';
import assert from 'node:assert/strict';
import { orderHomeCities } from '../../src/lib/homeCityOrder.js';

const cities = [{ slug: 'san-diego', totalCount: 80 }, { slug: 'la', totalCount: 26 }, { slug: 'nyc', totalCount: 20 }];

test('homepage puts the nearest city first regardless of listing count', () => {
  assert.equal(orderHomeCities(cities, { lat: 40.71, lng: -74 })[0].slug, 'nyc');
  assert.equal(orderHomeCities(cities, { lat: 32.72, lng: -117.16 })[0].slug, 'san-diego');
  assert.deepEqual(orderHomeCities(cities, { lat: 34.05, lng: -118.24 }).map(c => c.slug), ['la', 'san-diego', 'nyc']);
  assert.equal(cities[0].slug, 'san-diego');
});

test('missing or invalid location uses stable city order rather than inventory size', () => {
  for (const location of [undefined, { lat: null, lng: null }, { lat: NaN, lng: 0 }, { lat: 100, lng: 0 }]) {
    assert.deepEqual(orderHomeCities(cities, location).map(c => c.slug), ['nyc', 'la', 'san-diego']);
  }
});
