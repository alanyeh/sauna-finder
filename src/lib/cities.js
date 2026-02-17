export const CITY_CONFIG = {
  nyc: { slug: 'nyc', label: 'NYC', fullName: 'New York City', center: { lat: 40.68, lng: -73.97 } },
  sf: { slug: 'sf', label: 'SF', fullName: 'San Francisco', center: { lat: 37.77, lng: -122.42 } },
  chicago: { slug: 'chicago', label: 'CHI', fullName: 'Chicago', center: { lat: 41.88, lng: -87.63 } },
  seattle: { slug: 'seattle', label: 'SEA', fullName: 'Seattle', center: { lat: 47.61, lng: -122.33 } },
  la: { slug: 'la', label: 'LA', fullName: 'Los Angeles', center: { lat: 34.052, lng: -118.291 } },
  minneapolis: { slug: 'minneapolis', label: 'MSP', fullName: 'Minneapolis', center: { lat: 44.963, lng: -93.272 } },
  portland: { slug: 'portland', label: 'PDX', fullName: 'Portland', center: { lat: 45.523, lng: -122.676 } },
  denver: { slug: 'denver', label: 'DEN', fullName: 'Denver', center: { lat: 39.7392, lng: -104.9903 } },
  houston: { slug: 'houston', label: 'HOU', fullName: 'Houston', center: { lat: 29.7604, lng: -95.3698 } },
  vancouver: { slug: 'vancouver', label: 'VAN', fullName: 'Vancouver', center: { lat: 49.2827, lng: -123.1207 } },
  toronto: { slug: 'toronto', label: 'TOR', fullName: 'Toronto', center: { lat: 43.6532, lng: -79.3832 } },
};

export function getCityFullName(slug) {
  return CITY_CONFIG[slug]?.fullName || slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getCityCenter(slug) {
  if (slug === 'all') return { lat: 39.5, lng: -98.35 };
  return CITY_CONFIG[slug]?.center || { lat: 39.5, lng: -98.35 };
}
