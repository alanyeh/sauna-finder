import { discoveryLocationIssue, hasSpecificSaunaName, classifySaunaTypes } from './lib/discovery-quality.js';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { inferAmenityEvidence, placeTextSources, hasSaunaEvidence } from './lib/amenities.js';
import { fetchPlacesJSON, collectSearchPages, PlacesQuotaError } from './lib/places.js';
import * as dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import { createInterface } from 'readline';

dotenv.config({ path: '.env.local' });

// ─── City Configs ──────────────────────────────────────────────────────────────
// Add new cities here. Each config needs: city_slug, full_name, center coords,
// search radius (meters), and major neighborhoods (used for search + auto-detect).
const CITY_CONFIGS = {
  nyc: {
    city_slug: 'nyc',
    full_name: 'New York City',
    center: { lat: 40.7128, lng: -74.0060 },
    radius: 30000,
    neighborhoods: [
      'Manhattan', 'Brooklyn', 'Williamsburg', 'East Village', 'West Village',
      'Chelsea', 'SoHo', 'Tribeca', 'Midtown', 'Upper East Side',
      'Upper West Side', 'Lower East Side', 'Harlem', 'Flatiron',
      'Park Slope', 'Greenpoint', 'Bushwick', 'Astoria', 'Long Island City',
      'Hell\'s Kitchen', 'Financial District', 'Koreatown',
    ],
    // NYC zip code → neighborhood mapping for auto-detection
    zipToNeighborhood: {
      '10001': 'Chelsea', '10002': 'Lower East Side', '10003': 'East Village',
      '10004': 'Financial District', '10005': 'Financial District', '10006': 'Financial District',
      '10007': 'Tribeca', '10009': 'East Village', '10010': 'Flatiron',
      '10011': 'Chelsea', '10012': 'SoHo', '10013': 'Tribeca',
      '10014': 'West Village', '10016': 'Midtown', '10017': 'Midtown',
      '10018': 'Midtown', '10019': 'Hell\'s Kitchen', '10020': 'Midtown',
      '10021': 'Upper East Side', '10022': 'Midtown', '10023': 'Upper West Side',
      '10024': 'Upper West Side', '10025': 'Upper West Side',
      '10026': 'Harlem', '10027': 'Harlem', '10028': 'Upper East Side',
      '10029': 'Harlem', '10030': 'Harlem', '10031': 'Harlem',
      '10032': 'Harlem', '10033': 'Harlem', '10034': 'Harlem',
      '10035': 'Harlem', '10036': 'Midtown', '10037': 'Harlem',
      '10038': 'Financial District', '10039': 'Harlem', '10040': 'Harlem',
      '10065': 'Upper East Side', '10075': 'Upper East Side',
      '10128': 'Upper East Side',
      '11201': 'Brooklyn', '11205': 'Brooklyn', '11206': 'Bushwick',
      '11211': 'Williamsburg', '11217': 'Park Slope', '11215': 'Park Slope',
      '11218': 'Brooklyn', '11219': 'Brooklyn', '11220': 'Brooklyn',
      '11222': 'Greenpoint', '11226': 'Brooklyn', '11228': 'Brooklyn',
      '11229': 'Brooklyn', '11230': 'Brooklyn', '11237': 'Bushwick',
      '11249': 'Williamsburg',
      '11101': 'Long Island City', '11102': 'Astoria', '11103': 'Astoria',
      '11105': 'Astoria', '11106': 'Astoria',
    },
  },
  sf: {
    city_slug: 'sf',
    full_name: 'San Francisco',
    center: { lat: 37.7749, lng: -122.4194 },
    radius: 20000,
    neighborhoods: [
      'Mission District', 'Castro', 'SoMa', 'Marina', 'Nob Hill',
      'North Beach', 'Haight-Ashbury', 'Richmond', 'Sunset',
      'Japantown', 'Tenderloin', 'Pacific Heights', 'Hayes Valley',
    ],
    zipToNeighborhood: {},
  },
  la: {
    city_slug: 'la',
    full_name: 'Los Angeles',
    center: { lat: 34.0522, lng: -118.2437 },
    radius: 40000,
    neighborhoods: [
      'Hollywood', 'West Hollywood', 'Santa Monica', 'Venice',
      'Silver Lake', 'Downtown LA', 'Koreatown', 'Beverly Hills',
      'Culver City', 'Pasadena', 'Echo Park', 'Mar Vista',
      'Brentwood', 'Studio City', 'Burbank',
    ],
    zipToNeighborhood: {},
  },
  chicago: {
    city_slug: 'chicago',
    full_name: 'Chicago',
    center: { lat: 41.8781, lng: -87.6298 },
    radius: 25000,
    neighborhoods: [
      'Loop', 'Lincoln Park', 'Wicker Park', 'Logan Square',
      'Bucktown', 'River North', 'Gold Coast', 'Lakeview',
      'Andersonville', 'Pilsen', 'West Loop', 'Hyde Park',
      'Ukrainian Village',
    ],
    zipToNeighborhood: {},
  },
  seattle: {
    city_slug: 'seattle',
    full_name: 'Seattle',
    center: { lat: 47.6062, lng: -122.3321 },
    radius: 20000,
    neighborhoods: [
      'Capitol Hill', 'Ballard', 'Fremont', 'Wallingford',
      'University District', 'Queen Anne', 'Georgetown', 'Beacon Hill',
      'Columbia City', 'West Seattle', 'South Lake Union', 'Green Lake',
      'Greenwood', 'Eastlake', 'Magnolia', 'Northgate', 'Shoreline',
      'SeaTac', 'Renton', 'Kent', 'Federal Way',
    ],
    zipToNeighborhood: {
      '98101': 'Downtown', '98102': 'Pioneer Square', '98103': 'Fremont',
      '98104': 'Downtown', '98105': 'University District', '98107': 'Ballard',
      '98109': 'Queen Anne', '98110': 'Ballard', '98112': 'Capitol Hill',
      '98115': 'University District', '98118': 'Columbia City', '98119': 'South Lake Union',
      '98121': 'Fremont', '98122': 'SoDo', '98125': 'Green Lake', '98126': 'West Seattle',
      '98133': 'Greenwood', '98134': 'Beacon Hill', '98136': 'West Seattle',
      '98144': 'Beacon Hill', '98146': 'Skyway', '98154': 'South Lake Union',
      '98155': 'Northgate', '98158': 'SeaTac', '98166': 'Kent',
    },
  },
  portland: {
    city_slug: 'portland',
    full_name: 'Portland',
    center: { lat: 45.5152, lng: -122.6784 },
    radius: 20000,
    neighborhoods: [
      'Pearl District', 'Alberta Arts', 'Hawthorne', 'Division',
      'Mississippi', 'Sellwood', 'Northeast Portland', 'Southeast Portland',
      'Northwest Portland', 'Downtown Portland',
    ],
    zipToNeighborhood: {},
  },
  miami: {
    city_slug: 'miami',
    full_name: 'Miami',
    center: { lat: 25.7617, lng: -80.1918 },
    radius: 25000,
    neighborhoods: [
      'South Beach', 'Wynwood', 'Brickell', 'Coconut Grove',
      'Coral Gables', 'Design District', 'Little Havana',
      'Miami Beach', 'North Miami', 'Key Biscayne', 'Doral',
    ],
    zipToNeighborhood: {},
  },
  houston: {
    city_slug: 'houston',
    full_name: 'Houston',
    center: { lat: 29.7604, lng: -95.3698 },
    radius: 35000,
    neighborhoods: [
      'Downtown', 'Midtown', 'Montrose', 'Heights', 'River Oaks',
      'Galleria', 'Upper Kirby', 'Rice Village', 'Museum District',
      'Memorial', 'Katy', 'Sugar Land', 'The Woodlands',
      'Spring', 'Pearland', 'Bellaire', 'West University',
      'Energy Corridor', 'Chinatown', 'Westchase',
    ],
    zipToNeighborhood: {
      '77002': 'Downtown', '77003': 'East End', '77004': 'Museum District',
      '77005': 'West University', '77006': 'Montrose', '77007': 'Heights',
      '77008': 'Heights', '77009': 'Heights', '77010': 'Downtown',
      '77019': 'River Oaks', '77024': 'Memorial', '77025': 'Braeswood',
      '77027': 'Galleria', '77030': 'Medical Center', '77042': 'Westchase',
      '77043': 'Energy Corridor', '77056': 'Galleria', '77057': 'Upper Kirby',
      '77079': 'Energy Corridor', '77094': 'Katy', '77098': 'Upper Kirby',
      '77401': 'Bellaire', '77478': 'Sugar Land', '77479': 'Sugar Land',
      '77381': 'The Woodlands', '77382': 'The Woodlands',
      '77373': 'Spring', '77581': 'Pearland',
    },
  },
  toronto: {
    city_slug: 'toronto',
    full_name: 'Toronto',
    center: { lat: 43.6532, lng: -79.3832 },
    radius: 30000,
    neighborhoods: [
      'Downtown', 'Entertainment District', 'Financial District', 'King West',
      'Yorkville', 'Corktown', 'Waterfront', 'Davenport', 'The Annex',
      'Leslieville', 'Roncesvalles', 'Liberty Village', 'Midtown',
      'North York', 'Scarborough', 'Etobicoke', 'Mississauga',
      'Richmond Hill', 'Markham', 'Whitby',
    ],
    zipToNeighborhood: {},
  },
  vancouver: {
    city_slug: 'vancouver',
    full_name: 'Vancouver',
    center: { lat: 49.2827, lng: -123.1207 },
    radius: 25000,
    neighborhoods: [
      'Downtown', 'West End', 'Kitsilano', 'Mount Pleasant',
      'Yaletown', 'Gastown', 'Coal Harbour', 'South Granville',
      'Fairview', 'Grandview-Woodland', 'Strathcona',
      'Hastings-Sunrise', 'Renfrew-Collingwood', 'Kerrisdale',
      'Dunbar-Southlands', 'Riley Park', 'North Vancouver',
      'Burnaby', 'Coquitlam', 'Richmond',
    ],
    zipToNeighborhood: {
      'V6B': 'Downtown', 'V6C': 'Coal Harbour', 'V6E': 'West End',
      'V6G': 'West End', 'V6Z': 'Downtown', 'V6H': 'Fairview',
      'V6J': 'Kitsilano', 'V6K': 'Kitsilano', 'V6R': 'Kitsilano',
      'V6T': 'Kitsilano', 'V5Y': 'Mount Pleasant', 'V5T': 'Mount Pleasant',
      'V6A': 'Strathcona', 'V5L': 'Grandview-Woodland',
      'V5K': 'Hastings-Sunrise', 'V5M': 'Renfrew-Collingwood',
      'V5N': 'Riley Park', 'V5V': 'Riley Park',
      'V5W': 'Sunset', 'V5X': 'Sunset', 'V5Z': 'Fairview',
      'V5S': 'Killarney', 'V5R': 'Renfrew-Collingwood',
      'V6L': 'Kerrisdale', 'V6M': 'Kerrisdale',
      'V6N': 'Dunbar-Southlands', 'V6P': 'Dunbar-Southlands',
      'V6S': 'Dunbar-Southlands',
      'V7L': 'North Vancouver', 'V7M': 'North Vancouver',
      'V7N': 'North Vancouver', 'V7P': 'North Vancouver',
      'V3N': 'Burnaby', 'V5A': 'Burnaby', 'V5B': 'Burnaby',
      'V5C': 'Burnaby', 'V5E': 'Burnaby', 'V5G': 'Burnaby',
      'V5H': 'Burnaby', 'V5J': 'Burnaby',
      'V3B': 'Coquitlam', 'V3C': 'Coquitlam', 'V3E': 'Coquitlam',
      'V3J': 'Coquitlam', 'V3K': 'Coquitlam',
      'V6V': 'Richmond', 'V6W': 'Richmond', 'V6X': 'Richmond',
      'V6Y': 'Richmond', 'V7A': 'Richmond', 'V7B': 'Richmond',
      'V7C': 'Richmond', 'V7E': 'Richmond',
    },
  },
  slc: {
    city_slug: 'slc',
    full_name: 'Salt Lake City',
    center: { lat: 40.7608, lng: -111.8910 },
    radius: 25000,
    neighborhoods: ['Downtown', 'Sugar House', 'Central City', 'South Salt Lake', 'Holladay'],
    zipToNeighborhood: {
      '84101': 'Downtown', '84111': 'Central City', '84106': 'Sugar House',
      '84115': 'South Salt Lake', '84117': 'Holladay',
    },
  },
  'park-city': {
    city_slug: 'park-city',
    full_name: 'Park City',
    center: { lat: 40.6461, lng: -111.4980 },
    radius: 20000,
    neighborhoods: [
      'Old Town', 'Main Street', 'Deer Valley', 'Canyons Village',
      'Kimball Junction', 'Prospector', 'Snyderville', 'Silver Summit',
      'Jeremy Ranch', 'Midway', 'Heber City',
    ],
    zipToNeighborhood: {
      '84060': 'Old Town', '84098': 'Kimball Junction',
      '84049': 'Midway', '84032': 'Heber City',
    },
  },
  minneapolis: {
    city_slug: 'minneapolis',
    full_name: 'Minneapolis',
    center: { lat: 44.9778, lng: -93.2650 },
    radius: 25000,
    neighborhoods: [
      'Downtown', 'North Loop', 'Northeast', 'Uptown',
      'Linden Hills', 'Southwest', 'St. Paul', 'Edina',
      'Bloomington', 'Plymouth', 'Minnetonka', 'Eden Prairie',
      'Wayzata', 'Duluth',
    ],
    zipToNeighborhood: {},
  },
};

// ─── Search Query Templates ────────────────────────────────────────────────────
const CITY_WIDE_QUERIES = [
  'sauna in {CITY}',
  'bathhouse in {CITY}',
  'Korean spa in {CITY}',
  'Russian banya in {CITY}',
  'steam room in {CITY}',
  'hammam in {CITY}',
  'spa with sauna in {CITY}',
  'infrared sauna in {CITY}',
  'cold plunge in {CITY}',
  'day spa with sauna in {CITY}',
  'gym with sauna in {CITY}',
  'hotel spa sauna in {CITY}',
  'fitness club with sauna in {CITY}',
  'float spa in {CITY}',
  'wellness center with sauna in {CITY}',
];

const NEIGHBORHOOD_QUERIES = [
  'sauna in {NEIGHBORHOOD} {CITY}',
  'bathhouse in {NEIGHBORHOOD} {CITY}',
  'spa with sauna in {NEIGHBORHOOD} {CITY}',
  'gym with sauna {NEIGHBORHOOD} {CITY}',
];

// ─── Filtering Rules ────────────────────────────────────────────────────────────
// Google Places types that disqualify a place
const EXCLUDED_TYPES = new Set([
  'park', 'playground', 'amusement_park', 'zoo',
  'restaurant', 'bar', 'night_club', 'cafe', 'bakery',
  'store', 'shopping_mall', 'clothing_store', 'shoe_store',
  'supermarket', 'grocery_store', 'convenience_store',
  'school', 'university', 'library', 'museum',
  'church', 'mosque', 'synagogue', 'hindu_temple',
  'police', 'fire_station', 'hospital', 'doctor',
  'dentist', 'pharmacy', 'veterinary_care',
  'car_dealer', 'car_repair', 'car_wash', 'gas_station',
  'real_estate_agency', 'insurance_agency', 'bank', 'atm',
  'laundry', 'locksmith', 'moving_company',
  'post_office', 'storage', 'cemetery',
  'movie_theater', 'bowling_alley', 'stadium',
]);

// Name patterns that DISQUALIFY a result
const EXCLUDED_NAME_PATTERNS = [
  /playground/i, /\bpark\b(?!.*(?:spa|sauna|bath|slope))/i,
  /\bsex\b/i, /adult\s*(store|shop|toy|entertain)/i, /romantic\s+depot/i,
  /nail\s*(salon|spa|bar|lounge)/i, /hair\s*salon/i, /\bbarber\b/i,
  /tattoo/i, /pierc/i, /laund/i, /dry\s*clean/i,
  /\bpet\b/i, /\bdog\b/i, /\bvet(erinar)?\b/i,
  /car\s*wash/i, /\bdental\b/i, /orthodon/i,
  /real\s*estate/i, /\binsurance\b/i, /\battorney\b/i, /\blawyer\b/i,
  /\bcolonics?\b/i, /\bcryotherapy\b/i, /\bcryoskin\b/i,
  /head\s*spa/i, /scalp\s*(care|treat)/i,
  /community\s*center/i, /recreation\s*center/i,
  /\bchurch\b/i, /\bmosque\b/i, /\bsynagogue\b/i,
  /children'?s?\s*fitness/i, /\bkids?\b/i,
];

// Known sauna/wellness brands that may not have "sauna" in their name
const BRAND_WHITELIST = [
  /othership/i, /remedy\s*place/i, /higher\s*dose/i, /clean\s*market/i,
  /restore\s*(hyper)?\s*wellness/i, /perspire/i, /recoverie/i,
  /grind\s*house/i, /sage\s*\+?\s*sound/i, /aire\s*ancient/i,
  /city\s*well/i, /kontra/i, /akari/i, /lore\s*bathing/i,
  /rvivl/i,
];

// ─── Supabase & API Setup ──────────────────────────────────────────────────────
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

const FIELD_MASK = [
  'nextPageToken',
  'places.id',
  'places.businessStatus',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.websiteUri',
  'places.regularOpeningHours',
  'places.types',
  'places.photos',
  'places.priceLevel',
  'places.editorialSummary',
  'places.reviews',
].join(',');

// ─── Google Places Text Search (v1 API) ─────────────────────────────────────
async function textSearch(query, cityConfig, pageToken = null) {
  const body = {
    textQuery: query,
    locationBias: {
      circle: {
        center: { latitude: cityConfig.center.lat, longitude: cityConfig.center.lng },
        radius: cityConfig.radius,
      },
    },
    pageSize: 20,
  };
  if (pageToken) body.pageToken = pageToken;

  return fetchPlacesJSON('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

}

async function searchAllPages(query, cityConfig) {
  return collectSearchPages(token => textSearch(query, cityConfig, token));
}

// ─── Filtering ──────────────────────────────────────────────────────────────────
function shouldInclude(place) {
  const name = place.displayName?.text || '';
  const types = place.types || [];
  const reviews = place.userRatingCount || 0;

  // Closed businesses never belong in a fresh scrape
  if (place.businessStatus === 'CLOSED_PERMANENTLY' || place.businessStatus === 'CLOSED_TEMPORARILY') {
    return { include: false, reason: `business status: ${place.businessStatus}` };
  }

  // Hard exclude by Google Places type
  for (const t of types) {
    if (EXCLUDED_TYPES.has(t)) {
      return { include: false, reason: `excluded type: ${t}` };
    }
  }

  // Hard exclude by name pattern
  for (const pattern of EXCLUDED_NAME_PATTERNS) {
    if (pattern.test(name)) {
      return { include: false, reason: `excluded name: ${pattern.source}` };
    }
  }

  // Minimum review threshold — filters out fake/placeholder listings
  if (reviews < 10) {
    return { include: false, reason: `too few reviews (${reviews})` };
  }

  if (hasSpecificSaunaName(name)) return { include: true, reason: 'Explicit sauna name; requires source review before publishing' };

  // Always include: known sauna/wellness brands
  for (const pattern of BRAND_WHITELIST) {
    if (pattern.test(name)) {
      return { include: true, reason: `known brand: ${pattern.source}` };
    }
  }

  // Search relevance and chain membership do not confirm this location has a
  // sauna. Require explicit text evidence for generic hotels, gyms, and spas.
  if (hasSaunaEvidence(placeTextSources(place))) {
    return { include: true, reason: 'explicit sauna evidence in place text (needs review)' };
  }

  // Everything else (generic spas, massage parlors, etc.): exclude
  return { include: false, reason: 'no sauna-specific signals' };
}

// ─── Auto-Classification ────────────────────────────────────────────────────────
// ─── Amenity Inference ────────────────────────────────────────────────────────
// Scans name, editorial summary, and reviews for amenity keywords.
function inferAmenities(place) {
  return Object.keys(inferAmenityEvidence(placeTextSources(place)));
}

// ─── Description Generation ──────────────────────────────────────────────────
// Prefers editorial summary, falls back to a relevant review snippet.
function generateDescription(place, saunaTypes) {
  const editorial = place.editorialSummary?.text || '';
  if (editorial) {
    if (editorial.length <= 150) return editorial;
    const firstSentence = editorial.match(/^[^.!?]+[.!?]/);
    return firstSentence ? firstSentence[0].trim() : editorial.slice(0, 147) + '...';
  }

  // Try to extract a descriptive sentence from reviews
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

  // Fallback: brief type-based description
  if (saunaTypes.length > 0) {
    return `${saunaTypes[0]}. Details awaiting source review.`;
  }

  return '';
}

function detectNeighborhood(address, cityConfig) {
  const addr = address || '';

  // Try matching known neighborhood names in the address
  for (const hood of cityConfig.neighborhoods) {
    if (addr.toLowerCase().includes(hood.toLowerCase())) {
      return hood;
    }
  }

  // Try zip/postal code mapping
  if (cityConfig.zipToNeighborhood) {
    // US 5-digit zip
    const zipMatch = addr.match(/\b(\d{5})\b/);
    if (zipMatch && cityConfig.zipToNeighborhood[zipMatch[1]]) {
      return cityConfig.zipToNeighborhood[zipMatch[1]];
    }
    // Canadian postal code (first 3 chars = FSA, e.g. V6B)
    const caMatch = addr.match(/\b([A-Za-z]\d[A-Za-z])\s*\d[A-Za-z]\d\b/);
    if (caMatch && cityConfig.zipToNeighborhood[caMatch[1].toUpperCase()]) {
      return cityConfig.zipToNeighborhood[caMatch[1].toUpperCase()];
    }
  }

  // Borough-level fallbacks for NYC-style addresses
  const addrLower = addr.toLowerCase();
  if (addrLower.includes('brooklyn')) return 'Brooklyn';
  if (addrLower.includes('queens')) return 'Queens';
  if (addrLower.includes('astoria')) return 'Astoria';
  if (addrLower.includes('long island city')) return 'Long Island City';
  if (addrLower.includes('bronx')) return 'Bronx';
  if (addrLower.includes('staten island')) return 'Staten Island';

  return '';
}

function mapPriceLevel(priceLevel) {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$';
    case 'PRICE_LEVEL_MODERATE':
      return '$$';
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$';
    default:
      return null;
  }
}

function formatHours(openingHours) {
  if (!openingHours?.weekdayDescriptions) return '';
  return openingHours.weekdayDescriptions.join(', ');
}

function placeToRecord(place, citySlug, cityConfig) {
  const types = classifySaunaTypes(place);
  return {
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    neighborhood: detectNeighborhood(place.formattedAddress, cityConfig),
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    rating: place.rating || null,
    rating_count: place.userRatingCount || null,
    price: mapPriceLevel(place.priceLevel) || null,
    types,
    amenities: inferAmenities(place),
    hours: formatHours(place.regularOpeningHours),
    place_id: place.id || '',
    description: generateDescription(place, types),
    city_slug: citySlug,
    photos: null,
    website_url: place.websiteUri || null,
    gender_policy: null,
    listing_status: 'review',
    access_policy: 'unknown',
    review_notes: 'New discovery: confirm location-specific sauna evidence, category and access before publishing.',
  };
}

// ─── Photo Pipeline ─────────────────────────────────────────────────────────────
async function downloadAndUploadPhotos(supabaseId, place) {
  const photoRefs = place.photos?.slice(0, 5) || [];
  if (photoRefs.length === 0) return null;

  const photoUrls = [];
  const timestamp = Date.now();

  for (let i = 0; i < photoRefs.length; i++) {
    try {
      // Download from Google Places
      const mediaUrl = `https://places.googleapis.com/v1/${photoRefs[i].name}/media?maxHeightPx=600&key=${API_KEY}`;
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        console.log(`    Photo ${i + 1} download failed: ${response.status}`);
        continue;
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      // Upload to Supabase Storage
      const fileName = `${supabaseId}-${i}-${timestamp}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('sauna-photos')
        .upload(`public/${fileName}`, buffer, { contentType: 'image/jpeg' });

      if (uploadError) {
        console.log(`    Photo ${i + 1} upload failed: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('sauna-photos')
        .getPublicUrl(`public/${fileName}`);

      photoUrls.push(publicUrl);
      await sleep(200); // Rate limit between photo downloads
    } catch (err) {
      console.log(`    Photo ${i + 1} error: ${err.message}`);
    }
  }

  if (photoUrls.length === 0) return null;

  // Update the DB record with photo URLs
  const { error: updateError } = await supabase
    .from('saunas')
    .update({ photos: photoUrls })
    .eq('id', supabaseId);

  if (updateError) {
    console.log(`    DB update failed: ${updateError.message}`);
    return null;
  }

  return photoUrls;
}

// ─── Prompts & Helpers ──────────────────────────────────────────────────────────
function confirm(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase().startsWith('y'));
    });
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSimilar(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  const common = wordsA.filter(w => wordsB.includes(w));
  const overlap = common.length / Math.max(wordsA.length, wordsB.length);
  return overlap >= 0.7;
}

function extractStreetNumber(address) {
  const match = (address || '').match(/^(\d+)/);
  return match ? match[1] : '';
}

function isDuplicate(place, existing) {
  const placeStreet = extractStreetNumber(place.formattedAddress);
  for (const ex of existing) {
    const exStreet = extractStreetNumber(ex.address);
    if (isSimilar(place.displayName?.text, ex.name)) {
      if (placeStreet && exStreet && placeStreet === exStreet) return ex;
      if (!placeStreet || !exStreet) return ex;
    }
  }
  return null;
}

function deduplicatePlaces(places) {
  const seen = new Map();
  for (const p of places) {
    if (!seen.has(p.id)) {
      seen.set(p.id, p);
    }
  }
  return [...seen.values()];
}

// ─── CSV Report ─────────────────────────────────────────────────────────────────
function generateCSV(newPlaces, duplicates, filtered, citySlug) {
  const esc = (s) => `"${(s || '').replace(/"/g, '""')}"`;
  const lines = ['status,name,address,rating,reviews,types,amenities,neighborhood,website,place_id,description,reason'];

  for (const { place, record } of newPlaces) {
    lines.push(`NEW,${esc(place.displayName?.text)},${esc(place.formattedAddress)},${place.rating || ''},${place.userRatingCount || ''},${esc((record?.types || []).join('; '))},${esc((record?.amenities || []).join('; '))},${esc(record?.neighborhood)},${esc(record?.website_url)},${place.id},${esc(record?.description)},`);
  }

  for (const { place, match } of duplicates) {
    lines.push(`EXISTS,${esc(place.displayName?.text)},${esc(place.formattedAddress)},${place.rating || ''},${place.userRatingCount || ''},,,,${esc(place.websiteUri)},${place.id},,${esc('matched: ' + match.name)}`);
  }

  for (const { place, reason } of filtered) {
    lines.push(`FILTERED,${esc(place.displayName?.text)},${esc(place.formattedAddress)},${place.rating || ''},${place.userRatingCount || ''},,,,${esc(place.websiteUri)},${place.id},,${esc(reason)}`);
  }

  const filename = `scripts/scrape-report-${citySlug}-${Date.now()}.csv`;
  writeFileSync(filename, lines.join('\n'));
  return filename;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const cityArg = args.find(a => a.startsWith('--city='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');
  const withPhotos = args.includes('--with-photos');
  const noFilter = args.includes('--no-filter');
  const skipGyms = args.includes('--skip-gyms');
  const skipHotels = args.includes('--skip-hotels');

  if (!cityArg || !CITY_CONFIGS[cityArg]) {
    console.error('Usage: node scripts/scrape-saunas.js --city=<slug> [--dry-run] [--with-photos] [--no-filter]');
    console.error(`Available cities: ${Object.keys(CITY_CONFIGS).join(', ')}`);
    console.error('\nFlags:');
    console.error('  --dry-run      Search and report only, no DB writes');
    console.error('  --with-photos  Download and upload photos for each new entry');
    console.error('  --no-filter    Skip filtering (include all results)');
    console.error('  --skip-gyms    Exclude Gym Sauna type results');
    console.error('  --skip-hotels  Exclude Hotel Spa type results');
    process.exit(1);
  }

  if (!API_KEY) {
    console.error('Missing GOOGLE_PLACES_API_KEY in .env.local');
    process.exit(1);
  }

  const config = CITY_CONFIGS[cityArg];
  console.log(`\n=== Scraping saunas for ${config.full_name} (${config.city_slug}) ===`);
  if (dryRun) console.log('  [DRY RUN - no inserts will be made]');
  if (withPhotos) console.log('  [WITH PHOTOS - will download and upload photos]');
  if (noFilter) console.log('  [NO FILTER - all results included]');
  if (skipGyms) console.log('  [SKIP GYMS - excluding Gym Sauna types]');
  if (skipHotels) console.log('  [SKIP HOTELS - excluding Hotel Spa types]');
  console.log('');

  // ── Step 1: Build search queries ──────────────────────────────────────────
  const queries = [];
  for (const template of CITY_WIDE_QUERIES) {
    queries.push(template.replace('{CITY}', config.full_name));
  }
  for (const hood of config.neighborhoods) {
    for (const template of NEIGHBORHOOD_QUERIES) {
      queries.push(template.replace('{NEIGHBORHOOD}', hood).replace('{CITY}', config.full_name));
    }
  }
  console.log(`Built ${queries.length} search queries\n`);

  // ── Step 2: Run all searches ──────────────────────────────────────────────
  const allPlaces = [];
  let queryCount = 0;

  for (const query of queries) {
    queryCount++;
    process.stdout.write(`  [${queryCount}/${queries.length}] "${query}"...`);

    try {
      const results = await searchAllPages(query, config);
      console.log(` ${results.length} results`);
      allPlaces.push(...results);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
      if (err instanceof PlacesQuotaError) break;
    }

    await sleep(200);
  }

  console.log(`\nTotal raw results: ${allPlaces.length}`);

  // ── Step 3: Deduplicate by place_id ───────────────────────────────────────
  const uniquePlaces = deduplicatePlaces(allPlaces);
  console.log(`Unique places (by place_id): ${uniquePlaces.length}`);

  // ── Step 4: Filter results ────────────────────────────────────────────────
  const passedFilter = [];
  const filteredOut = [];

  for (const place of uniquePlaces) {
    const locationProblem = discoveryLocationIssue(place, config);
    if (locationProblem) {
      filteredOut.push({ place, reason: locationProblem });
      continue;
    }
    if (noFilter) {
      passedFilter.push(place);
      continue;
    }

    const result = shouldInclude(place);
    if (result.include) {
      passedFilter.push(place);
    } else {
      filteredOut.push({ place, reason: result.reason });
    }
  }

  console.log(`Passed filter: ${passedFilter.length}`);
  console.log(`Filtered out: ${filteredOut.length}`);

  // ── Step 5: Check against existing DB entries ─────────────────────────────
  console.log(`\nFetching existing saunas across all cities from Supabase...`);
  const existingSaunas = [];
  for (let start = 0; ; start += 1000) {
    const { data, error } = await supabase.from('saunas')
      .select('id, name, address, place_id, city_slug').order('id').range(start, start + 999);
    if (error) throw error;
    existingSaunas.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`Found ${existingSaunas.length} existing saunas across all cities\n`);

  const existingPlaceIds = new Set(existingSaunas.map(s => s.place_id).filter(Boolean));

  const newPlaces = [];
  const duplicates = [];

  for (const place of passedFilter) {
    if (place.id && existingPlaceIds.has(place.id)) {
      const match = existingSaunas.find(s => s.place_id === place.id);
      duplicates.push({ place, match });
      continue;
    }

    const match = isDuplicate(place, existingSaunas.filter(row => row.city_slug === config.city_slug));
    if (match) {
      duplicates.push({ place, match });
    } else {
      const record = placeToRecord(place, config.city_slug, config);
      newPlaces.push({ place, record });
    }
  }

  // Filter out gyms/hotels if flags are set
  const skippedByType = [];
  if (skipGyms || skipHotels) {
    for (let i = newPlaces.length - 1; i >= 0; i--) {
      const types = newPlaces[i].record.types || [];
      const isGymOnly = skipGyms && types.includes('Gym Sauna') && types.every(t => ['Gym Sauna', 'Hotel Spa'].includes(t));
      const isHotelOnly = skipHotels && types.includes('Hotel Spa') && types.every(t => ['Hotel Spa', 'Gym Sauna'].includes(t));
      if (isGymOnly || isHotelOnly) {
        skippedByType.push(newPlaces.splice(i, 1)[0]);
      }
    }
    if (skippedByType.length > 0) {
      console.log(`Skipped ${skippedByType.length} gym/hotel entries by type filter`);
    }
  }

  console.log('--- Results ---');
  console.log(`  New (not in DB):     ${newPlaces.length}`);
  console.log(`  Already exists:      ${duplicates.length}`);
  console.log(`  Filtered out:        ${filteredOut.length}`);
  console.log('');

  // Show new places
  if (newPlaces.length > 0) {
    console.log('New saunas found:');
    for (const { place, record } of newPlaces) {
      const stars = place.rating ? `${place.rating} stars` : '? stars';
      const reviews = place.userRatingCount || 0;
      const types = record.types.join(', ') || 'unclassified';
      const hood = record.neighborhood || '?';
      const amenities = record.amenities.length > 0 ? record.amenities.join(', ') : 'none detected';
      console.log(`  + ${place.displayName?.text} [${types}] (${hood}) — ${stars}, ${reviews} reviews`);
      console.log(`    amenities: ${amenities}`);
      if (record.description) console.log(`    desc: ${record.description}`);
      if (record.website_url) console.log(`    web: ${record.website_url}`);
    }
    console.log('');
  }

  // ── Step 6: Insert new saunas ─────────────────────────────────────────────
  if (!dryRun && newPlaces.length > 0) {
    const proceed = await confirm(`\nInsert ${newPlaces.length} new saunas into Supabase? (y/n) `);
    if (!proceed) {
      console.log('Aborted. No changes were made.');
      const csvFile = generateCSV(newPlaces, duplicates, filteredOut, config.city_slug);
      console.log(`CSV report saved to: ${csvFile}`);
      process.exit(0);
    }

    console.log('\nInserting new saunas into Supabase...');
    const records = newPlaces.map(({ record }) => record);

    let inserted = 0;
    const insertedRecords = []; // Track inserted records for photo pipeline

    for (let i = 0; i < records.length; i += 25) {
      const batch = records.slice(i, i + 25);
      const { data, error: insertError } = await supabase
        .from('saunas')
        .insert(batch)
        .select('id, name');

      if (insertError) {
        console.error(`  Insert error (batch ${Math.floor(i / 25) + 1}):`, insertError.message);
      } else {
        inserted += data.length;
        for (let j = 0; j < data.length; j++) {
          console.log(`  Inserted ID ${data[j].id}: ${data[j].name}`);
          // Pair the Supabase record with the original place data (for photos)
          insertedRecords.push({
            supabaseId: data[j].id,
            place: newPlaces[i + j].place,
          });
        }
      }
    }
    console.log(`\nInserted ${inserted}/${newPlaces.length} new saunas`);

    // ── Step 7: Photo pipeline ────────────────────────────────────────────
    if (withPhotos && insertedRecords.length > 0) {
      console.log(`\nStarting photo pipeline for ${insertedRecords.length} new saunas...`);
      let photoSuccess = 0;

      for (let i = 0; i < insertedRecords.length; i++) {
        const { supabaseId, place } = insertedRecords[i];
        const name = place.displayName?.text || 'Unknown';
        process.stdout.write(`  [${i + 1}/${insertedRecords.length}] ${name}...`);

        const photos = await downloadAndUploadPhotos(supabaseId, place);
        if (photos) {
          console.log(` ${photos.length} photos uploaded`);
          photoSuccess++;
        } else {
          console.log(` no photos`);
        }

        await sleep(500); // Rate limit between places
      }
      console.log(`\nPhotos: ${photoSuccess}/${insertedRecords.length} saunas with photos`);
    }
  } else if (dryRun && newPlaces.length > 0) {
    console.log('[DRY RUN] Skipping insert and photo upload');
  }

  // ── Step 8: Generate CSV report ───────────────────────────────────────────
  const csvFile = generateCSV(newPlaces, duplicates, filteredOut, config.city_slug);
  console.log(`\nCSV report saved to: ${csvFile}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
