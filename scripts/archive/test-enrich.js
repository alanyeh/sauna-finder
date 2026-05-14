// Quick test: search for a single place and show enriched output
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) { console.error('Missing GOOGLE_PLACES_API_KEY'); process.exit(1); }

const FIELD_MASK = [
  'places.id', 'places.displayName', 'places.formattedAddress', 'places.location',
  'places.rating', 'places.userRatingCount', 'places.websiteUri',
  'places.regularOpeningHours', 'places.types', 'places.photos',
  'places.priceLevel', 'places.primaryType', 'places.primaryTypeDisplayName',
  'places.editorialSummary', 'places.reviews',
].join(',');

// ── Copy of enrichment functions from scrape-saunas.js ──

function classifyType(place) {
  const name = (place.displayName?.text || '');
  const types = place.types || [];
  const saunaTypes = [];

  if (/banya/i.test(name) || /russian.*bath/i.test(name)) saunaTypes.push('Russian Bathhouse');
  else if (/bath\s*house/i.test(name) || /\bbathing\b/i.test(name)) saunaTypes.push('Modern Bathhouse');
  if (/korean/i.test(name) || /k[\-\s]?spa/i.test(name) || /jjimjil/i.test(name)) saunaTypes.push('Korean Spa');
  if (/hammam/i.test(name) || /moroccan.*bath/i.test(name) || /turkish.*bath/i.test(name)) saunaTypes.push('Traditional Bathhouse');
  if (/infrared/i.test(name)) saunaTypes.push('Infrared Sauna');
  if (/float/i.test(name)) saunaTypes.push('Float Spa');
  if (types.includes('gym') || types.includes('fitness_center') || /\bgym\b/i.test(name) || /equinox/i.test(name)) saunaTypes.push('Gym Sauna');
  if (types.includes('hotel') || types.includes('lodging') || /\bhotel\b/i.test(name) || /\bresort\b/i.test(name)) saunaTypes.push('Hotel Spa');

  const editorial = (place.editorialSummary?.text || '').toLowerCase();
  const reviewText = (place.reviews || []).map(r => (r.text?.text || r.originalText?.text || '').toLowerCase()).join(' ');
  const extraText = `${editorial} ${reviewText}`;
  const has = (t) => saunaTypes.includes(t);
  if (!has('Korean Spa') && /korean\s*(spa|bath)|jjimjil/i.test(extraText)) saunaTypes.unshift('Korean Spa');
  if (!has('Russian Bathhouse') && /russian|banya/i.test(extraText)) saunaTypes.unshift('Russian Bathhouse');
  if (!has('Traditional Bathhouse') && /hammam|turkish\s*bath|moroccan/i.test(extraText)) saunaTypes.unshift('Traditional Bathhouse');
  if (!has('Infrared Sauna') && /infrared/i.test(extraText)) saunaTypes.unshift('Infrared Sauna');
  if (!has('Float Spa') && /float(ation)?[\s\-]*(tank|pod|therapy|spa|center)/i.test(extraText)) saunaTypes.unshift('Float Spa');
  if (!has('Modern Bathhouse') && /bath\s*house|communal\s*bath|\bbathing\b/i.test(extraText)) saunaTypes.push('Modern Bathhouse');

  if (saunaTypes.length === 0 && /sauna/i.test(name)) saunaTypes.push('Boutique Sauna');
  if (saunaTypes.length === 0 && (/\bspa\b/i.test(name) || /wellness/i.test(name))) saunaTypes.push('Day Spa');
  if (saunaTypes.length === 0 && (/recovery/i.test(name) || /plunge/i.test(name))) saunaTypes.push('Wellness Center');
  return saunaTypes;
}

function inferAmenities(place) {
  const name = (place.displayName?.text || '');
  const editorial = (place.editorialSummary?.text || '');
  const reviewTexts = (place.reviews || []).map(r => (r.text?.text || r.originalText?.text || '')).join(' ');
  const allText = `${name} ${editorial} ${reviewTexts}`;
  const amenities = [];

  if (/dry\s*sauna|heated\s*sauna|traditional\s*sauna|finnish\s*sauna|cedar\s*sauna|wood[\s\-]*(fired\s*)?sauna|barrel\s*sauna/i.test(allText)) amenities.push('dry_sauna');
  if (/cold\s*plunge|ice\s*bath|cold\s*(pool|tub|dip)|plunge\s*pool|cold\s*immersion/i.test(allText)) amenities.push('cold_plunge');
  if (/steam\s*room|steam\s*bath|eucalyptus\s*steam/i.test(allText)) amenities.push('steam_room');
  if (/\bmassage\b|body\s*scrub/i.test(allText)) amenities.push('massage');
  if (/swimming\s*pool|lap\s*pool|hot\s*tub|jacuzzi|whirlpool|soaking\s*(tub|pool)|thermal\s*pool|rooftop\s*pool|outdoor\s*pool|indoor\s*pool|\bpool\b/i.test(allText)) amenities.push('pool');
  if (/co[\-\s]?ed|mixed[\-\s]?gender|men\s*and\s*women|all\s*genders?\b/i.test(allText)) amenities.push('coed');
  if (/private\s*(room|suite|session|sauna|cabin|pod|bath|experience)/i.test(allText)) amenities.push('private');
  return amenities;
}

function generateDescription(place, saunaTypes) {
  const editorial = place.editorialSummary?.text || '';
  if (editorial) {
    if (editorial.length <= 150) return editorial;
    const firstSentence = editorial.match(/^[^.!?]+[.!?]/);
    return firstSentence ? firstSentence[0].trim() : editorial.slice(0, 147) + '...';
  }
  const reviews = place.reviews || [];
  for (const review of reviews) {
    const text = review.text?.text || review.originalText?.text || '';
    const sentences = text.match(/[^.!?]+[.!?]/g) || [];
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (trimmed.length >= 30 && trimmed.length <= 150 &&
          /sauna|steam|bath|plunge|spa|relax|hot|cold|wellness|pool|soak|thermal/i.test(trimmed) &&
          !/\bI\b|\bmy\s|\bwe\s|\bour\s/i.test(trimmed)) {
        return trimmed;
      }
    }
  }
  if (saunaTypes.length > 0) return `${saunaTypes[0]} offering sauna and wellness experiences.`;
  return '';
}

// ── Search ──

async function main() {
  const query = process.argv[2] || 'Lore Bathing Club Manhattan';
  console.log(`\nSearching for: "${query}"\n`);

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 5,
    }),
  });

  if (!response.ok) {
    console.error(`API error (${response.status}):`, await response.text());
    process.exit(1);
  }

  const data = await response.json();
  const places = data.places || [];
  console.log(`Found ${places.length} result(s)\n`);

  for (const place of places) {
    const types = classifyType(place);
    const amenities = inferAmenities(place);
    const description = generateDescription(place, types);

    console.log('═'.repeat(70));
    console.log(`Name:          ${place.displayName?.text}`);
    console.log(`Address:       ${place.formattedAddress}`);
    console.log(`Rating:        ${place.rating} (${place.userRatingCount} reviews)`);
    console.log(`Price:         ${place.priceLevel || 'not set'}`);
    console.log(`Website:       ${place.websiteUri || 'none'}`);
    console.log(`Place ID:      ${place.id}`);
    console.log(`Primary Type:  ${place.primaryTypeDisplayName?.text || place.primaryType || 'none'}`);
    console.log(`Google Types:  ${(place.types || []).join(', ')}`);
    console.log('');
    console.log(`→ Types:       ${types.join(', ') || 'unclassified'}`);
    console.log(`→ Amenities:   ${amenities.join(', ') || 'none detected'}`);
    console.log(`→ Description: ${description || '(empty)'}`);

    // Show raw editorial + review snippets for debugging
    if (place.editorialSummary?.text) {
      console.log(`\n  [Editorial] ${place.editorialSummary.text}`);
    }
    if (place.reviews?.length) {
      console.log(`\n  [Reviews - ${place.reviews.length} returned]`);
      for (const r of place.reviews.slice(0, 3)) {
        const txt = (r.text?.text || r.originalText?.text || '').slice(0, 200);
        console.log(`    ★${r.rating} "${txt}${txt.length >= 200 ? '...' : ''}"`);
      }
    }
    console.log('');
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
