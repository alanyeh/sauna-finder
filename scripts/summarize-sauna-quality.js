// Supplement the website audit with geographic checks and review queues.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CITY_CONFIG } from '../src/lib/cities.js';
const out = resolve(process.argv[2] || 'reports/quality-2026-10-02');
const rows = JSON.parse(await readFile(`${out}/listings.json`, 'utf8'));
const results = JSON.parse(await readFile(`${out}/results.json`, 'utf8'));
const rad = value => value * Math.PI / 180;
function distance(row, center) {
  const a = Math.sin(rad(row.lat - center.lat) / 2) ** 2 + Math.cos(rad(row.lat)) * Math.cos(rad(center.lat)) * Math.sin(rad(row.lng - center.lng) / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
const geographic = rows.filter(row => row.lat != null && row.lng != null && CITY_CONFIG[row.city_slug]).map(row => ({
  id: row.id, name: row.name, assignedCity: row.city_slug, address: row.address,
  distanceKm: distance(row, CITY_CONFIG[row.city_slug].center),
  action: 'Review metro assignment; 150 km is a review threshold, not an automatic exclusion rule.',
})).filter(row => row.distanceKm > 150);
const groups = Map.groupBy(rows.filter(row => row.address), row => `${row.city_slug}|${row.address.toLowerCase().trim()}`);
const colocated = [...groups.values()].filter(group => group.length > 1).map(group => ({
  ids: group.map(row => row.id), names: group.map(row => row.name), address: group[0].address,
  action: 'Check whether these represent the same sauna access. Co-location alone does not establish duplication.',
}));
const hotels = results.filter(row => row.types.includes('Hotel Spa')).map(row => ({
  id: row.id, name: row.name, city: row.city, website: row.website,
  saunaMentionFound: Boolean(row.evidence.sauna),
  accessReview: row.evidence.public_access ? 'Access-related language found; verify it applies to sauna and non-guests' : 'Public sauna access not established by crawl',
  accessEvidence: row.evidence.public_access || null,
  restrictionLanguage: row.evidence.guest_restriction || null,
  caution: 'Guest restrictions may describe lounges or other amenities. Day passes may describe pools, skiing, or coworking. Neither is a sauna-access decision.',
}));
const counts = {
  total: rows.length, pagesReturned: results.filter(row => row.pages.length).length,
  saunaMentionFound: results.filter(row => row.evidence.sauna).length,
  noSaunaMentionOnRetrievedPages: results.filter(row => row.pages.length && !row.evidence.sauna).length,
  noUsablePages: results.filter(row => !row.pages.length).length,
  categoryEvidenceMissingOnRetrievedPages: results.filter(row => row.pages.length && row.unsupportedTypes.length).length,
  distinctStoredCategories: new Set(rows.flatMap(row => row.types || [])).size,
  hotels: hotels.length, geographicOutliers: geographic.length, sameAddressGroups: colocated.length,
};
function csv(data) {
  if (!data.length) return '';
  const keys = Object.keys(data[0]);
  const esc = value => '"' + String(typeof value === 'object' ? JSON.stringify(value) : value ?? '').replace(/"/g, '""') + '"';
  return [keys.join(','), ...data.map(row => keys.map(key => esc(row[key])).join(','))].join('\n');
}
await writeFile(`${out}/geographic-review.csv`, csv(geographic));
await writeFile(`${out}/colocated-review.csv`, csv(colocated));
await writeFile(`${out}/hotel-access-review.csv`, csv(hotels));
await writeFile(`${out}/quality-counts.json`, JSON.stringify(counts, null, 2));
console.log(JSON.stringify(counts, null, 2));
