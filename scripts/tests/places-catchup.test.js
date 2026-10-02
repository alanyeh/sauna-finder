import test from 'node:test';
import assert from 'node:assert/strict';
import { refreshPatch, shouldRefresh, matchingPlaceId } from '../resume-places-refresh.js';

const row = { id: 1, name: 'Test sauna', place_id: 'place1', listing_status: 'active', city_slug: 'nyc', lat: 40.71, lng: -74, types: ['Traditional Sauna'], hours: 'Original hours', review_notes: 'Reviewed amenities' };
test('missing Places values do not erase hours or ratings', () => {
  const patch = refreshPatch(row, { id: 'place1', businessStatus: 'OPERATIONAL' }, '[done]', '2026-10-03T08:20:00Z');
  assert.equal(patch.hours, undefined);
  assert.equal(patch.rating, undefined);
  assert.equal(patch.listing_status, undefined);
  assert.match(patch.review_notes, /^Reviewed amenities\n\[done\]/);
});
test('closures leave public results and mismatched IDs fail', () => {
  assert.equal(refreshPatch(row, { id: 'place1', businessStatus: 'CLOSED_PERMANENTLY' }, '[done]', 'now').listing_status, 'hidden');
  assert.equal(refreshPatch(row, { id: 'place1', businessStatus: 'CLOSED_TEMPORARILY' }, '[done]', 'now').listing_status, 'review');
  assert.throws(() => refreshPatch(row, { id: 'other' }, '[done]', 'now'), /identity/);
});
test('completed, unpublished, and changed-place listings are not fetched', () => {
  const entry = { place_id: 'place1' };
  assert.equal(shouldRefresh(row, entry, '[done]'), true);
  assert.equal(shouldRefresh({ ...row, review_notes: '[done] earlier' }, entry, '[done]'), false);
  assert.equal(shouldRefresh({ ...row, listing_status: 'review' }, entry, '[done]'), false);
  assert.equal(shouldRefresh(row, { place_id: 'different' }, '[done]'), false);
});
test('missing Place IDs require a unique exact-name nearby match', () => {
  const place = { id: 'match', displayName: { text: 'Test Sauna' }, location: { latitude: 40.71, longitude: -74 } };
  assert.equal(matchingPlaceId(row, [place]), 'match');
  assert.throws(() => matchingPlaceId(row, [place, place]), /unique/);
  assert.throws(() => matchingPlaceId(row, [{ ...place, location: { latitude: 42, longitude: -74 } }]), /unique/);
  assert.throws(() => matchingPlaceId(row, [{ ...place, displayName: { text: 'Other sauna' } }]), /unique/);
});
