import { useState, useEffect, useCallback, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import PhotoCarousel from './PhotoCarousel';
import { amenityLabels } from '../data/saunas';

const MAP_ID = 'sauna_finder_map';

// Add your Google Maps API key here
const GOOGLE_MAPS_API_KEY = 'AIzaSyCh0m5quuG6m_KSicoisiGDAV7K1Rql8gI';

function MapController({ selectedSauna, cityCenter, citySlug }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(cityCenter);
    map.setZoom(citySlug === 'all' ? 4 : 12);
  }, [cityCenter, citySlug, map]);

  useEffect(() => {
    if (!map) return;
    if (selectedSauna && selectedSauna.lat != null && selectedSauna.lng != null) {
      map.panTo({ lat: selectedSauna.lat, lng: selectedSauna.lng });
      // Only zoom in if not already zoomed (avoids jarring snap when swiping between saunas)
      if (map.getZoom() < 14) {
        map.setZoom(15);
      }
    } else if (citySlug === 'all') {
      map.panTo(cityCenter);
      map.setZoom(4);
    }
  }, [selectedSauna, map, citySlug, cityCenter]);

  return null;
}

function SaunaMarker({ sauna, isSelected, onClick, disableInfoWindow }) {
  const handleClick = useCallback(() => {
    onClick(sauna);
  }, [onClick, sauna]);

  if (sauna.lat == null || sauna.lng == null) return null;

  return (
    <>
      <AdvancedMarker
        position={{ lat: sauna.lat, lng: sauna.lng }}
        onClick={handleClick}
      >
        <div className={`w-4 h-4 rounded-full border-2 border-white transition-all ${
          isSelected ? 'bg-accent-red scale-125' : 'bg-accent-red hover:scale-110'
        }`} />
      </AdvancedMarker>

      {isSelected && !disableInfoWindow && (
        <InfoWindow
          position={{ lat: sauna.lat, lng: sauna.lng }}
          onCloseClick={() => onClick(null)}
          headerDisabled
        >
          <div className="min-w-[280px] overflow-hidden">
            {(sauna.photos || sauna.photo_url) && (
              <div className="relative">
                <PhotoCarousel
                  photos={sauna.photos || (sauna.photo_url ? [sauna.photo_url] : [])}
                  alt={sauna.name}
                  hideCounter
                />
                <button
                  onClick={() => onClick(null)}
                  className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white text-sm hover:bg-black/60 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            )}
            <div className="px-0 py-4 font-sans">
              <h3 className="text-base font-medium mb-1.5 text-charcoal">
                {sauna.name}
              </h3>
              {sauna.types && sauna.types.length > 0 && (
                <p className="text-xs text-warm-gray mb-2 capitalize font-sans">
                  {sauna.types.join(', ')}
                </p>
              )}
              {sauna.rating != null && (
                <div className="flex items-center gap-1.5 mb-2 text-[13px] font-sans">
                  <span className="text-accent-red">★</span>
                  <span className="font-medium">{sauna.rating}</span>
                  {sauna.ratingCount != null && (
                    <span className="text-warm-gray text-xs">
                      ({sauna.ratingCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              {sauna.amenities && sauna.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {sauna.amenities.filter(a => amenityLabels[a]).map(amenity => (
                    <span
                      key={amenity}
                      className="text-[11px] px-2 py-1 bg-cream rounded text-charcoal"
                    >
                      {amenityLabels[amenity]}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 font-sans">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sauna.name + ' ' + sauna.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-4 py-2 bg-charcoal text-white text-[13px] rounded transition-colors hover:bg-accent-red font-medium"
                >
                  View on Maps
                </a>
                {sauna.website_url && (
                  <a
                    href={sauna.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center px-4 py-2 bg-white border border-light-border text-charcoal text-[13px] rounded transition-colors hover:bg-hover-bg font-medium"
                  >
                    View Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

const CITY_CENTERS = {
  nyc: { lat: 40.68, lng: -73.97 },
  sf: { lat: 37.77, lng: -122.42 },
  chicago: { lat: 41.88, lng: -87.63 },
  seattle: { lat: 47.61, lng: -122.33 },
  la: { lat: 34.052, lng: -118.291 },
  minneapolis: { lat: 44.963, lng: -93.272 },
  portland: { lat: 45.523, lng: -122.676 },
  denver: { lat: 39.7392, lng: -104.9903 },
  houston: { lat: 29.7604, lng: -95.3698 },
  all: { lat: 39.5, lng: -98.35 },
};

const CITY_LABELS = {
  nyc: 'NYC',
  sf: 'SF',
  chicago: 'Chicago',
  seattle: 'Seattle',
  la: 'LA',
  minneapolis: 'Minneapolis',
  portland: 'Portland',
  denver: 'Denver',
  houston: 'Houston',
};

function CityMarker({ citySlug, center, count, label, onClick }) {
  return (
    <AdvancedMarker
      position={center}
      onClick={() => onClick(citySlug)}
    >
      <div className="flex flex-col items-center cursor-pointer group">
        <div className="w-10 h-10 rounded-full bg-accent-red text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-lg group-hover:scale-110 transition-transform">
          {count}
        </div>
        <span className="mt-1 text-xs font-medium text-charcoal bg-white/90 px-2 py-0.5 rounded shadow-sm">
          {label}
        </span>
      </div>
    </AdvancedMarker>
  );
}

export default function SaunaMap({ saunas, selectedSauna, onSaunaSelect, citySlug, disableInfoWindow = false, onCityClick }) {
  const center = CITY_CENTERS[citySlug] || CITY_CENTERS.nyc;
  const [defaultZoom] = useState(citySlug === 'all' ? 4 : 12);

  const cityCounts = useMemo(() => {
    if (citySlug !== 'all') return null;
    const counts = {};
    saunas.forEach(s => {
      const slug = s.city_slug;
      if (slug && slug !== 'all') {
        counts[slug] = (counts[slug] || 0) + 1;
      }
    });
    return counts;
  }, [saunas, citySlug]);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="w-full h-full flex items-center justify-center bg-cream">
        <div className="text-center max-w-md px-8">
          <h3 className="text-xl font-serif mb-3">Google Maps API Key Required</h3>
          <p className="text-sm text-warm-gray mb-4">
            To display the map, add your Google Maps API key to:
          </p>
          <code className="block bg-white px-4 py-2 rounded text-xs text-left border border-light-border mb-4">
            src/components/Map.jsx
          </code>
          <p className="text-xs text-warm-gray">
            Get your API key at <a href="https://console.cloud.google.com/google/maps-apis" className="text-accent-red hover:underline" target="_blank" rel="noopener noreferrer">Google Cloud Console</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        mapId={MAP_ID}
        defaultCenter={center}
        defaultZoom={defaultZoom}
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        gestureHandling="greedy"
        onClick={() => onSaunaSelect(null)}
      >
        <MapController selectedSauna={selectedSauna} cityCenter={center} citySlug={citySlug} />
        {citySlug === 'all' && cityCounts && !selectedSauna ? (
          Object.entries(cityCounts).map(([slug, count]) => (
            CITY_CENTERS[slug] && (
              <CityMarker
                key={slug}
                citySlug={slug}
                center={CITY_CENTERS[slug]}
                count={count}
                label={CITY_LABELS[slug] || slug}
                onClick={onCityClick || (() => {})}
              />
            )
          ))
        ) : (
          saunas.map(sauna => (
            <SaunaMarker
              key={sauna.id}
              sauna={sauna}
              isSelected={selectedSauna?.id === sauna.id}
              onClick={onSaunaSelect}
              disableInfoWindow={disableInfoWindow}
            />
          ))
        )}
      </Map>
    </APIProvider>
  );
}
