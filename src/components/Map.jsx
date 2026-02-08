import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import PhotoCarousel from './PhotoCarousel';

const MAP_ID = 'sauna_finder_map';

// Add your Google Maps API key here
const GOOGLE_MAPS_API_KEY = 'AIzaSyCh0m5quuG6m_KSicoisiGDAV7K1Rql8gI';

function MapController({ selectedSauna, cityCenter }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(cityCenter);
    map.setZoom(12);
  }, [cityCenter, map]);

  useEffect(() => {
    if (!map || !selectedSauna) return;
    if (selectedSauna.lat != null && selectedSauna.lng != null) {
      map.panTo({ lat: selectedSauna.lat, lng: selectedSauna.lng });
      map.setZoom(15);
    }
  }, [selectedSauna, map]);

  return null;
}

function SaunaMarker({ sauna, isSelected, onClick }) {
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

      {isSelected && (
        <InfoWindow
          position={{ lat: sauna.lat, lng: sauna.lng }}
          onCloseClick={() => onClick(null)}
        >
          <div className="min-w-[280px] overflow-hidden">
            {(sauna.photos || sauna.photo_url) && (
              <PhotoCarousel
                photos={sauna.photos || (sauna.photo_url ? [sauna.photo_url] : [])}
                alt={sauna.name}
              />
            )}
            <div className="p-4">
              <h3 className="text-base font-medium mb-2 text-charcoal">
                {sauna.name}
              </h3>
              {sauna.rating != null && (
                <div className="flex items-center gap-1.5 mb-2 text-[13px]">
                  <span className="text-accent-red">★</span>
                  <span className="font-medium">{sauna.rating}</span>
                  {sauna.ratingCount != null && (
                    <span className="text-warm-gray text-xs">
                      ({sauna.ratingCount.toLocaleString()})
                    </span>
                  )}
                </div>
              )}
              <p className="text-[13px] text-warm-gray mb-3">
                {sauna.address}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sauna.name + ' ' + sauna.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-charcoal text-white text-[13px] rounded transition-colors hover:bg-accent-red"
              >
                View on Google Maps
              </a>
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
};

export default function SaunaMap({ saunas, selectedSauna, onSaunaSelect, citySlug }) {
  const center = CITY_CENTERS[citySlug] || CITY_CENTERS.nyc;
  const [defaultZoom] = useState(12);

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
      >
        <MapController selectedSauna={selectedSauna} cityCenter={center} />
        {saunas.map(sauna => (
          <SaunaMarker
            key={sauna.id}
            sauna={sauna}
            isSelected={selectedSauna?.id === sauna.id}
            onClick={onSaunaSelect}
          />
        ))}
      </Map>
    </APIProvider>
  );
}
