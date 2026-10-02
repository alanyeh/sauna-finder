import { CITY_CONFIG } from './cities.js';

export const CATEGORY_ALIASES = {
  'Russian Bathhouse': 'Russian Banya', 'Traditional Banya': 'Russian Banya',
  'Traditional Russian Banya': 'Russian Banya',
  'Korean Day Spa': 'Korean Spa', 'Korean Fitness & Spa': 'Korean Spa',
  'Japanese Neighborhood Sauna': 'Japanese Sauna',
  'Infrared Sauna Studio': 'Infrared Sauna', 'Infrared Sauna & Cold Plunge': 'Infrared Sauna',
  'Infrared Studio': 'Infrared Sauna',
  'Gym': 'Gym Sauna', 'Luxury Athletic Club': 'Gym Sauna',
  'Luxury Spa': 'Day Spa', 'Italian Spa': 'Day Spa', 'Wellness Spa': 'Day Spa',
  'World Spa': 'Modern Bathhouse', 'Bathhouse': 'Modern Bathhouse',
  'Modern Wellness Club': 'Wellness Center', 'Resort': 'Hotel Spa',
};
export const SAUNA_CATEGORIES = [
  'Modern Bathhouse', 'Traditional Bathhouse', 'Finnish Sauna', 'Traditional Sauna',
  'Nordic Spa', 'Russian Banya', 'Korean Spa', 'Japanese Sauna', 'Infrared Sauna',
  'Boutique Sauna', 'Private Sauna Studio', 'Outdoor Sauna', 'Float Spa',
  'Day Spa', 'Day Spa & Sauna Resort', 'Wellness Center', 'Recovery Center', 'Hotel Spa', 'Gym Sauna',
];
export const normalizeCategory = type => CATEGORY_ALIASES[type] || type;
export const normalizeCategories = types => [...new Set((types || []).map(normalizeCategory))];
export const ACCESS_LABELS = {
  unknown: 'Access not confirmed', public: 'Open to non-guests', day_pass: 'Day pass available',
  treatment: 'Sauna included with treatment', guests_only: 'Hotel guests only', members_only: 'Members only',
};
export function isHotelSauna(sauna) {
  return normalizeCategories(sauna.types).includes('Hotel Spa') || /\b(?:hotel|resort)\b/i.test(sauna.name || '');
}
export function validSource(url) {
  try { return ['http:', 'https:'].includes(new URL(url).protocol); } catch { return false; }
}
export function hasConfirmedPublicAccess(sauna) {
  return ['public', 'day_pass', 'treatment'].includes(sauna.access_policy)
    && validSource(sauna.access_source_url) && Number.isFinite(Date.parse(sauna.access_checked_at))
    && validSource(sauna.sauna_source_url) && Number.isFinite(Date.parse(sauna.sauna_checked_at));
}
export function distanceKm(a, b) {
  if (![a?.lat,a?.lng,b?.lat,b?.lng].every(v => typeof v === 'number' && Number.isFinite(v))
      || Math.abs(a.lat)>90 || Math.abs(b.lat)>90 || Math.abs(a.lng)>180 || Math.abs(b.lng)>180) return Infinity;
  const rad = v => v * Math.PI / 180;
  const x = Math.sin(rad(a.lat-b.lat)/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(rad(a.lng-b.lng)/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1,x)));
}
export function locationIssue(sauna, maxKm = 150) {
  const city = CITY_CONFIG[sauna.city_slug];
  if (!city || sauna.city_slug === 'all') return 'Unsupported city';
  const distance = distanceKm(sauna, city.center);
  if (!Number.isFinite(distance)) return 'Missing or invalid coordinates';
  return distance > maxKm ? `${Math.round(distance)} km from ${city.fullName}; outside the ${maxKm} km metro limit` : null;
}
export function publicationIssue(sauna) {
  const issue = locationIssue(sauna);
  if (issue) return issue;
  if (!normalizeCategories(sauna.types).length) return 'Choose at least one category';
  if (normalizeCategories(sauna.types).some(type => !SAUNA_CATEGORIES.includes(type))) return 'Choose supported categories';
  if (!validSource(sauna.sauna_source_url) || !Number.isFinite(Date.parse(sauna.sauna_checked_at))) return 'Add a sauna evidence URL and checked date';
  if (isHotelSauna(sauna) && !hasConfirmedPublicAccess(sauna)) return 'Hotels need confirmed non-guest sauna access, with a source URL and checked date';
  return null;
}
export function isPublicSauna(sauna) {
  if ((sauna.listing_status || 'active') !== 'active' || sauna.duplicate_of) return false;
  if (locationIssue(sauna)) return false;
  return !isHotelSauna(sauna) || hasConfirmedPublicAccess(sauna);
}
