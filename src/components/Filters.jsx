import { useState, useEffect } from 'react';
import { amenityLabels } from '../data/saunas';

const amenities = [
  { value: 'cold_plunge', label: 'Cold Plunge' },
  { value: 'steam_room', label: 'Steam' },
  { value: 'pool', label: 'Pool' },
  { value: 'coed', label: 'Co-ed' },
  { value: 'private', label: 'Private' },
];

export default function Filters({
  neighborhoods,
  neighborhood,
  setNeighborhood,
  price,
  setPrice,
  selectedAmenities,
  toggleAmenity,
  saunaTypes,
  selectedTypes,
  toggleType,
  user,
  showFavoritesOnly,
  setShowFavoritesOnly,
  isOpen,
  onClose,
}) {
  // Temporary state for pending changes
  const [tempNeighborhood, setTempNeighborhood] = useState(neighborhood);
  const [tempPrice, setTempPrice] = useState(price);
  const [tempAmenities, setTempAmenities] = useState(selectedAmenities);
  const [tempTypes, setTempTypes] = useState(selectedTypes);
  const [tempShowFavorites, setTempShowFavorites] = useState(showFavoritesOnly);

  // Update temp state when actual filters change (on apply)
  useEffect(() => {
    setTempNeighborhood(neighborhood);
    setTempPrice(price);
    setTempAmenities(selectedAmenities);
    setTempTypes(selectedTypes);
    setTempShowFavorites(showFavoritesOnly);
  }, [neighborhood, price, selectedAmenities, selectedTypes, showFavoritesOnly]);

  const handleToggleTempAmenity = (amenity) => {
    setTempAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleToggleTempType = (type) => {
    setTempTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleApply = () => {
    setNeighborhood(tempNeighborhood);
    setPrice(tempPrice);
    setShowFavoritesOnly(tempShowFavorites);

    // Update amenities
    tempAmenities.forEach(amenity => {
      if (!selectedAmenities.includes(amenity)) {
        toggleAmenity(amenity);
      }
    });
    selectedAmenities.forEach(amenity => {
      if (!tempAmenities.includes(amenity)) {
        toggleAmenity(amenity);
      }
    });

    // Update types
    tempTypes.forEach(type => {
      if (!selectedTypes.includes(type)) {
        toggleType(type);
      }
    });
    selectedTypes.forEach(type => {
      if (!tempTypes.includes(type)) {
        toggleType(type);
      }
    });

    onClose();
  };

  const handleCancel = () => {
    // Reset temp state to current filters
    setTempNeighborhood(neighborhood);
    setTempPrice(price);
    setTempAmenities(selectedAmenities);
    setTempTypes(selectedTypes);
    setTempShowFavorites(showFavoritesOnly);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={handleCancel}
      />
      {/* Bottom Sheet Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
        <div className="px-7 py-5">
        {/* Neighborhood & Price */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
              Neighborhood
            </label>
            <select
              value={tempNeighborhood}
              onChange={(e) => setTempNeighborhood(e.target.value)}
              className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded transition-colors hover:border-warm-gray focus:border-charcoal focus:outline-none"
            >
              <option value="">All Neighborhoods</option>
              {neighborhoods.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
              Price Range
            </label>
            <select
              value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded transition-colors hover:border-warm-gray focus:border-charcoal focus:outline-none"
            >
              <option value="">All Prices</option>
              <option value="$">$ - Budget</option>
              <option value="$$">$$ - Moderate</option>
              <option value="$$$">$$$ - Upscale</option>
            </select>
          </div>
        </div>


        {/* Type */}
        {saunaTypes && saunaTypes.length > 0 && (
          <div className="mb-4">
            <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {saunaTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleToggleTempType(type)}
                  className={`px-3 py-1.5 border rounded-full text-[12px] transition-all ${
                    tempTypes.includes(type)
                      ? 'bg-charcoal text-white border-charcoal'
                      : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        <div className="mb-5">
          <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {amenities.map(amenity => (
              <button
                key={amenity.value}
                onClick={() => handleToggleTempAmenity(amenity.value)}
                className={`flex items-center gap-2 px-2.5 py-2 border rounded text-[13px] transition-all ${
                  tempAmenities.includes(amenity.value)
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
                }`}
              >
                <input
                  type="checkbox"
                  checked={tempAmenities.includes(amenity.value)}
                  onChange={() => {}}
                  className="w-4 h-4 cursor-pointer"
                />
                <span>{amenity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Apply & Cancel Buttons */}
        <div className="flex gap-2 border-t border-light-border pt-4">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 border border-light-border bg-white text-charcoal rounded transition-colors hover:bg-hover-bg text-[13px] font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2.5 bg-charcoal text-white rounded transition-colors hover:bg-accent-red text-[13px] font-medium"
          >
            Apply
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
