import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ─── Cherry-picked new saunas ────────────────────────────────────────────────
const NEW_SAUNAS = [
  {
    name: 'Othership Williamsburg',
    address: '25 Kent Ave, Brooklyn, NY 11249, USA',
    neighborhood: 'Williamsburg',
    lat: null, lng: null, // will fill from Places data
    rating: 5,
    rating_count: 390,
    price: null,
    types: ['Modern Bathhouse'],
    amenities: ['dry_sauna', 'cold_plunge', 'steam_room'],
    hours: '',
    place_id: 'ChIJGakjPLVZwokRVwUuwN_dxkU',
    description: 'Guided breathwork-and-sauna experience from the Othership brand, set in a Williamsburg waterfront space.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://othership.us/williamsburg',
    gender_policy: null,
  },
  {
    name: 'Perspire Sauna Studio Flatiron',
    address: '50 W 23rd St, New York, NY 10010, USA',
    neighborhood: 'Flatiron',
    lat: null, lng: null,
    rating: 4.8,
    rating_count: 93,
    price: '$$',
    types: ['Infrared Sauna'],
    amenities: [],
    hours: '',
    place_id: 'ChIJZRUpK31ZwokRelH9J1ARTN4',
    description: 'Private infrared sauna suites with red-light therapy and chromotherapy options.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://www.perspiresaunastudio.com/ny/flatiron/',
    gender_policy: null,
  },
  {
    name: 'Bathhouse Atlantic Ave',
    address: '540 Atlantic Ave, Brooklyn, NY 11217, USA',
    neighborhood: 'Brooklyn',
    lat: null, lng: null,
    rating: 4.3,
    rating_count: 51,
    price: '$$$',
    types: ['Modern Bathhouse'],
    amenities: ['dry_sauna', 'cold_plunge', 'steam_room'],
    hours: '',
    place_id: 'ChIJv0mlV4JbwokRHAw1FiNWnKI',
    description: 'New Brooklyn outpost of the Bathhouse brand with saunas, cold plunge, and communal bathing.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://abathhouse.com/',
    gender_policy: null,
  },
  {
    name: 'Sage + Sound',
    address: '1481 3rd Ave, New York, NY 10028, USA',
    neighborhood: 'Upper East Side',
    lat: null, lng: null,
    rating: 4.5,
    rating_count: 113,
    price: '$$$',
    types: ['Wellness Center'],
    amenities: ['dry_sauna', 'steam_room'],
    hours: '',
    place_id: 'ChIJ03-PM7hZwokR5T8Vop9drIo',
    description: 'Holistic wellness club on the Upper East Side with sauna, sound baths, and meditation classes.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://www.sage-sound.com/',
    gender_policy: null,
  },
  {
    name: 'Malika Moroccan Bath',
    address: '65 Page Ave, Staten Island, NY 10309, USA',
    neighborhood: 'Staten Island',
    lat: null, lng: null,
    rating: 4.8,
    rating_count: 185,
    price: '$$',
    types: ['Traditional Bathhouse'],
    amenities: ['steam_room', 'massage'],
    hours: '',
    place_id: 'ChIJd82KKum1w4kRFQd0_2hStL8',
    description: 'Authentic Moroccan hammam with traditional body scrub and steam treatments.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://www.malikaspany.com/',
    gender_policy: null,
  },
  {
    name: 'Healing Spa Woori NY',
    address: '157-16B Northern Blvd, Flushing, NY 11354, USA',
    neighborhood: 'Flushing',
    lat: null, lng: null,
    rating: 4.1,
    rating_count: 54,
    price: '$$',
    types: ['Korean Spa'],
    amenities: ['dry_sauna', 'steam_room', 'massage'],
    hours: '',
    place_id: 'ChIJCfpAkyVgwokRxS-LjDiCXgY',
    description: "Women-only Korean jjimjilbang in Flushing with sauna rooms and body treatments.",
    city_slug: 'nyc',
    photos: null,
    website_url: 'https://healingspa.nyc/',
    gender_policy: 'Women only',
  },
  {
    name: 'Sui Spa',
    address: '180 6th Ave, New York, NY 10013, USA',
    neighborhood: 'Tribeca',
    lat: null, lng: null,
    rating: 5,
    rating_count: 17,
    price: '$$',
    types: ['Boutique Sauna'],
    amenities: ['cold_plunge', 'massage'],
    hours: '',
    place_id: 'ChIJA9R9q9VZwokR0gr7pUhcIrc',
    description: 'Boutique Tribeca spa offering sauna, cold plunge, and therapeutic massage.',
    city_slug: 'nyc',
    photos: null,
    website_url: 'http://www.suiyoga.com/',
    gender_policy: null,
  },
];

// ─── Ratings updates for existing saunas (from Google Places fresh data) ─────
const RATINGS_UPDATES = [
  { place_id: 'ChIJkTyq0SlZwokRdtbwK-vZxLw', rating: 4.4, rating_count: 2451 }, // Bathhouse Flatiron
  { place_id: 'ChIJKxPbBwBZwokRkGZEW6k9FsU', rating: 4.9, rating_count: 1189 }, // Othership Flatiron
  { place_id: 'ChIJBTF_ACxZwokRk8y1ICME3F4', rating: 4.3, rating_count: 3833 }, // Bathhouse Williamsburg
  { place_id: 'ChIJT6uag51ZwokRBV2vUMM3FWQ', rating: 4.2, rating_count: 724 },  // Russian & Turkish Baths
  { place_id: 'ChIJTTUrPSJgwokRA5GNq_8dxJI', rating: 3.8, rating_count: 759 },  // New York Spa & Sauna
  { place_id: 'ChIJVQTtaABZwokR7eq_fU_19eM', rating: 5, rating_count: 100 },    // Lore Bathing Club
  { place_id: 'ChIJcX7MZwBbwokRxlktDQLDP1I', rating: 4.4, rating_count: 115 },  // Brooklyn Bathhouse
  { place_id: 'ChIJfUyIa1pZwokR5WXLrcSKMFA', rating: 5, rating_count: 55 },     // Akari
  { place_id: 'ChIJFVLapYpEwokRg7c0afZfk_0', rating: 4.3, rating_count: 918 },  // Bath Club of NY
  { place_id: 'ChIJvSpYN81ZwokR0PqfuPKUN4M', rating: 4.8, rating_count: 144 },  // Perspire Williamsburg
  { place_id: 'ChIJTaEkma5bwokRbf4oUePYORU', rating: 4.5, rating_count: 155 },  // Area Infrared Sauna
  { place_id: 'ChIJ0cKEvVVawokRpgRnrnuR1LQ', rating: 4.9, rating_count: 158 },  // cityWell brooklyn
  { place_id: 'ChIJh_URM9RZwokRiY2kg524fRg', rating: 4.2, rating_count: 559 },  // Manhattan Plaza Health Club
  { place_id: 'ChIJsZLEW1pYwokRocjM7COUYJI', rating: 4.5, rating_count: 195 },  // Mercedes Club
  { place_id: 'ChIJn_7Cad1ZwokRenmBoBeVDLc', rating: 4.9, rating_count: 1385 }, // TMPL Avenue A
  { place_id: 'ChIJiz9V4xhawokRorqq7eXaNxM', rating: 4.7, rating_count: 1292 }, // Four Seasons Downtown
  { place_id: 'ChIJTWkuhfVZwokRvaommqZ2oqA', rating: 4.6, rating_count: 421 },  // The Greenwich Hotel
  { place_id: 'ChIJf-JE3ehZwokRXgoRYPxLMhA', rating: 4.4, rating_count: 712 },  // Equinox Hotel
  { place_id: 'ChIJ4zLglElZwokR7tWZPZGVsLY', rating: 3.9, rating_count: 1225 }, // Virgin Hotels NYC
  { place_id: 'ChIJL83lHfZYwokRnd7wA8PLD1E', rating: 4.6, rating_count: 1821 }, // Mandarin Oriental
  { place_id: 'ChIJazM5w4xZwokRr28B0Zb4tCE', rating: 4.3, rating_count: 714 },  // The Dominick
  { place_id: 'ChIJ613balVYwokR2Sd7fEqauZs', rating: 4.5, rating_count: 457 },  // The Chatwal
  { place_id: 'ChIJT0OO0UJZwokRDV4t1oFOrso', rating: 4.3, rating_count: 2953 }, // The William Vale
  { place_id: 'ChIJZSWtT1NZwokRHh_3WWnggZE', rating: 4.4, rating_count: 627 },  // Ritz-Carlton NoMad
  { place_id: 'ChIJM-uWC9VZwokRMm_7bwjHFBg', rating: 4.4, rating_count: 348 },  // Aman New York
  { place_id: 'ChIJxYqdJ9NZwokRt4-PwpWWSaQ', rating: 4.6, rating_count: 488 },  // TMPL West Village
  { place_id: 'ChIJt6S1MDBbwokRQEKGKk5lbCs', rating: 3.7, rating_count: 445 },  // Brooklyn Banya
  { place_id: 'ChIJM1CUCQ5ZwokRmVUE8mzRHJM', rating: 5, rating_count: 17 },     // Akari Greenpoint
  { place_id: 'ChIJC_avtUFbwokRubpUaSNaD0c', rating: 5, rating_count: 159 },     // beem Light Sauna
  { place_id: 'ChIJqR_jAeRZwokRpmZBdYTeb9A', rating: 4.6, rating_count: 818 },  // VITAL Climbing Gym Brooklyn
  { place_id: 'ChIJvQzkNABbwokRthaomAVMEnM', rating: 4.2, rating_count: 140 },  // Life Time Atlantic
];

// ─── Geocode missing lat/lng via Google Places ───────────────────────────────
const API_KEY = process.env.GOOGLE_PLACES_API_KEY;

async function getPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'location,regularOpeningHours',
    },
  });
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  console.log('=== NYC Update — June 2026 ===\n');

  // ── Part 1: Insert new saunas ──────────────────────────────────────────────
  console.log(`Inserting ${NEW_SAUNAS.length} new saunas...\n`);

  for (const sauna of NEW_SAUNAS) {
    // Fetch lat/lng and hours from Google Places
    if (!sauna.lat) {
      const details = await getPlaceDetails(sauna.place_id);
      if (details?.location) {
        sauna.lat = details.location.latitude;
        sauna.lng = details.location.longitude;
      }
      if (details?.regularOpeningHours?.weekdayDescriptions) {
        sauna.hours = details.regularOpeningHours.weekdayDescriptions.join(', ');
      }
    }

    const { data, error } = await supabase
      .from('saunas')
      .insert(sauna)
      .select('id, name');

    if (error) {
      console.log(`  ✗ ${sauna.name}: ${error.message}`);
    } else {
      console.log(`  ✓ ${data[0].name} (ID ${data[0].id})`);
    }
  }

  // ── Part 2: Update ratings for existing saunas ─────────────────────────────
  console.log(`\nUpdating ratings for ${RATINGS_UPDATES.length} existing saunas...\n`);

  let updated = 0;
  for (const entry of RATINGS_UPDATES) {
    const { data, error } = await supabase
      .from('saunas')
      .update({ rating: entry.rating, rating_count: entry.rating_count })
      .eq('place_id', entry.place_id)
      .eq('city_slug', 'nyc')
      .select('id, name, rating, rating_count');

    if (error) {
      console.log(`  ✗ place_id ${entry.place_id}: ${error.message}`);
    } else if (data.length === 0) {
      console.log(`  - place_id ${entry.place_id}: no matching row found`);
    } else {
      console.log(`  ✓ ${data[0].name}: ${data[0].rating}★ (${data[0].rating_count} reviews)`);
      updated++;
    }
  }

  console.log(`\nDone! Updated ${updated}/${RATINGS_UPDATES.length} existing saunas.`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
