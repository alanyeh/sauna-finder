import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps';

const MAP_ID = 'sauna_finder_map';

// Add your Google Maps API key here
const GOOGLE_MAPS_API_KEY = 'AIzaSyCh0m5quuG6m_KSicoisiGDAV7K1Rql8gI';

function MapController({ saunas, selectedSauna }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (selectedSauna) {
      map.panTo({ lat: selectedSauna.lat, lng: selectedSauna.lng });
      map.setZoom(15);
    } else if (saunas.length > 0) {
      // Calculate bounds to fit all saunas
      let minLat = saunas[0].lat;
      let maxLat = saunas[0].lat;
      let minLng = saunas[0].lng;
      let maxLng = saunas[0].lng;

      saunas.forEach(sauna => {
        minLat = Math.min(minLat, sauna.lat);
        maxLat = Math.max(maxLat, sauna.lat);
        minLng = Math.min(minLng, sauna.lng);
        maxLng = Math.max(maxLng, sauna.lng);
      });

      const center = {
        lat: (minLat + maxLat) / 2,
        lng: (minLng + maxLng) / 2
      };
      map.panTo(center);
      map.setZoom(12);
    }
  }, [selectedSauna, saunas, map]);

  return null;
}

function SaunaMarker({ sauna, isSelected, onClick }) {
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (isSelected) {
      setShowInfo(true);
    }
  }, [isSelected]);

  const handleClick = useCallback(() => {
    onClick(sauna);
    setShowInfo(true);
  }, [onClick, sauna]);

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

      {showInfo && (
        <InfoWindow
          position={{ lat: sauna.lat, lng: sauna.lng }}
          onCloseClick={() => setShowInfo(false)}
        >
          <div className="p-4 min-w-[280px]">
            <h3 className="text-base font-medium mb-2 text-charcoal">
              {sauna.name}
            </h3>
            <div className="flex items-center gap-1.5 mb-2 text-[13px]">
              <span className="text-accent-red">★</span>
              <span className="font-medium">{sauna.rating}</span>
              <span className="text-warm-gray text-xs">
                ({sauna.ratingCount.toLocaleString()})
              </span>
            </div>
            <p className="text-[13px] text-warm-gray mb-3">
              {sauna.address}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sauna.name + ' ' + sauna.address)}&query_place_id=${sauna.placeId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-charcoal text-white text-[13px] rounded transition-colors hover:bg-accent-red"
            >
              View on Google Maps
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function SaunaMap({ saunas, selectedSauna, onSaunaSelect }) {
  const [defaultCenter] = useState({ lat: 40.7128, lng: -74.0060 });
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
        defaultCenter={defaultCenter}
        defaultZoom={defaultZoom}
        disableDefaultUI={false}
        zoomControl={true}
        mapTypeControl={false}
        streetViewControl={false}
        fullscreenControl={true}
        gestureHandling="auto"
      >
        <MapController saunas={saunas} selectedSauna={selectedSauna} />
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
