import { CITY_CONFIG } from './cities.js';
import { distanceKm } from './saunaQuality.js';

// Keep the initial/permission-denied order stable as city inventories change.
const cityOrder = Object.keys(CITY_CONFIG);

export function orderHomeCities(cities, location) {
  return [...cities].sort((a, b) => {
    const aDistance = distanceKm(location, CITY_CONFIG[a.slug]?.center);
    const bDistance = distanceKm(location, CITY_CONFIG[b.slug]?.center);
    if (aDistance !== bDistance) return aDistance - bDistance;
    const rank = slug => {
      const index = cityOrder.indexOf(slug);
      return index === -1 ? cityOrder.length : index;
    };
    return rank(a.slug) - rank(b.slug) || a.slug.localeCompare(b.slug);
  });
}
