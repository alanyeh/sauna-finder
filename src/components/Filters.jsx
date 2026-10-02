import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

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
  sortBy,
  setSortBy,
  isOpen,
  onClose,
}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Temporary state for pending changes
  const [tempNeighborhood, setTempNeighborhood] = useState(neighborhood);
  const [tempPrice, setTempPrice] = useState(price);
  const [tempAmenities, setTempAmenities] = useState(selectedAmenities);
  const [tempTypes, setTempTypes] = useState(selectedTypes);
  const [tempShowFavorites, setTempShowFavorites] = useState(showFavoritesOnly);
  const [tempSortBy, setTempSortBy] = useState(sortBy);

  // Update temp state when actual filters change (on apply)
  useEffect(() => {
    setTempNeighborhood(neighborhood);
    setTempPrice(price);
    setTempAmenities(selectedAmenities);
    setTempTypes(selectedTypes);
    setTempShowFavorites(showFavoritesOnly);
    setTempSortBy(sortBy);
  }, [neighborhood, price, selectedAmenities, selectedTypes, showFavoritesOnly, sortBy]);

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
    setSortBy(tempSortBy);

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
    setTempSortBy(sortBy);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby="filters-title"
      onCancel={(event) => { event.preventDefault(); handleCancel(); }}
      onClick={(event) => { if (event.target === event.currentTarget) handleCancel(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[85dvh] overflow-y-auto rounded-sm border border-light-border bg-cream p-0 text-charcoal shadow-menu backdrop:bg-charcoal/40"
    >
      <div className="px-5 py-5 sm:px-7" onClick={(event) => event.stopPropagation()}>
        <div className="mb-6 flex items-start justify-between gap-4 border-b border-light-border pb-4">
          <div>
            <h2 id="filters-title" className="text-xl">Refine your search</h2>
            <p className="mt-2 text-xs text-warm-gray">Find a sauna that suits your routine.</p>
          </div>
          <button onClick={handleCancel} className="ui-button min-w-11 px-2" aria-label="Close filters">✕</button>
        </div>
        {/* Sort */}
        <div className="mb-6">
          <label htmlFor="filter-sort" className="ui-label">
            Sort By
          </label>
          <select
            id="filter-sort" value={tempSortBy}
            onChange={(e) => setTempSortBy(e.target.value)}
            className="ui-field"
          >
            <option value="default">Default</option>
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="name">Name (A–Z)</option>
            <option value="price_asc">Price (Low to High)</option>
            <option value="price_desc">Price (High to Low)</option>
          </select>
        </div>

        {/* Neighborhood & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="flex-1">
            <label htmlFor="filter-neighborhood" className="ui-label">
              Neighborhood
            </label>
            <select
              id="filter-neighborhood" value={tempNeighborhood}
              onChange={(e) => setTempNeighborhood(e.target.value)}
              className="ui-field"
            >
              <option value="">All Neighborhoods</option>
              {neighborhoods.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="filter-price" className="ui-label">
              Price Range
            </label>
            <select
              id="filter-price" value={tempPrice}
              onChange={(e) => setTempPrice(e.target.value)}
              className="ui-field"
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
          <div className="mb-6">
            <label className="ui-label">
              Type
            </label>
            <div className="flex flex-wrap gap-2">
              {saunaTypes.map(type => (
                <button
                  key={type}
                  aria-pressed={tempTypes.includes(type)}
                  onClick={() => handleToggleTempType(type)}
                  className={`filter-chip ${
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
          <label className="ui-label">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {amenities.map(amenity => (
              <button
                key={amenity.value}
                aria-pressed={tempAmenities.includes(amenity.value)}
                onClick={() => handleToggleTempAmenity(amenity.value)}
                className={`filter-chip justify-start ${
                  tempAmenities.includes(amenity.value)
                    ? 'bg-charcoal text-white border-charcoal'
                    : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
                }`}
              >
                <span aria-hidden="true" className="inline-flex h-4 w-4 items-center justify-center border border-current rounded-sm text-[10px]">
                  {tempAmenities.includes(amenity.value) ? '✓' : ''}
                </span>
                <span>{amenity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Apply & Cancel Buttons */}
        <div className="sticky bottom-0 flex gap-3 border-t border-light-border bg-cream py-4 -mb-5 mt-6">
          <button
            onClick={handleCancel}
            className="ui-button flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="ui-button ui-button-primary flex-1"
          >
            Apply filters
          </button>
        </div>
      </div>
    </dialog>,
    document.body
  );
}
