import { distanceKm, normalizeCategories } from '../../src/lib/saunaQuality.js';
import { inferAmenityEvidence, placeTextSources } from './amenities.js';

export function discoveryLocationIssue(place, config) {
  const distance = distanceKm({ lat: place.location?.latitude, lng: place.location?.longitude }, config.center);
  // Google's locationBias is only a preference, not a geographic restriction.
  const maxKm = Math.min(150, (config.radius || 50000) / 1000);
  if (!Number.isFinite(distance)) return 'Missing or invalid location coordinates';
  return distance > maxKm ? `Outside search area: ${Math.round(distance)} km (limit ${maxKm} km)` : null;
}
export function hasSpecificSaunaName(name) {
  // Floating and sound baths, infrared light therapy and cold plunges alone
  // are not evidence that the facility has a sauna.
  return /\b(?:saunas?|banya|jjimjilbang)\b/i.test(name);
}
export function classifySaunaTypes(place) {
  const name = place.displayName?.text || '';
  const googleTypes = place.types || [];
  const sources = placeTextSources(place);
  const amenities = inferAmenityEvidence(sources);
  const sentences = sources.flatMap(source => String(source || '').split(/[.!?\n]+/));
  const positive = pattern => sentences.some(s => pattern.test(s)) && !sentences.some(s => pattern.test(s) && /\b(?:no|not|without|closed|removed|planned|coming soon|unavailable)\b/i.test(s));
  const types = [];
  if (/banya|russian.*bath/i.test(name) || positive(/\b(?:russian\s*(?:bath|sauna)|banya)\b/i)) types.push('Russian Banya');
  if (/korean|jjimjilbang/i.test(name) || positive(/\bkorean\s*(?:spa|bath)|jjimjilbang/i)) types.push('Korean Spa');
  if (/\bjapanese\b/i.test(name) || positive(/\bjapanese\s*(?:sauna|bath)|\bsento\b/i)) types.push('Japanese Sauna');
  if (amenities.infrared_sauna) types.push('Infrared Sauna');
  if (positive(/\bfinnish\s*sauna/i)) types.push('Finnish Sauna');
  else if (amenities.dry_sauna) types.push('Traditional Sauna');
  if (positive(/\b(?:floatation|flotation|float)\s*(?:tank|pod|therapy|spa|center)\b/i)) types.push('Float Spa');
  if (positive(/\bhammam|turkish\s*bath|moroccan\s*bath/i)) types.push('Traditional Bathhouse');
  if (/bath\s*house|\bbathing\b/i.test(name) && !types.includes('Russian Banya')) types.push('Modern Bathhouse');
  if (googleTypes.some(t => ['gym','fitness_center','health_club'].includes(t)) || /\bgym|\bfitness|equinox|life\s*time|tmpl|climbing/i.test(name)) types.push('Gym Sauna');
  if (googleTypes.some(t => ['hotel','lodging','resort_hotel'].includes(t)) || /\bhotel|\bresort\b/i.test(name)) types.push('Hotel Spa');
  if (!types.length && /sauna/i.test(name)) types.push('Boutique Sauna');
  if (!types.length && /spa/i.test(name)) types.push('Day Spa');
  if (!types.length && /wellness|recovery/i.test(name)) types.push('Wellness Center');
  return normalizeCategories(types);
}
