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
  user,
  showFavoritesOnly,
  setShowFavoritesOnly,
}) {
  return (
    <div className="px-7 py-5 border-b border-light-border bg-cream">
      {/* Neighborhood & Price */}
      <div className="flex gap-3 mb-3">
        <div className="flex-1">
          <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
            Neighborhood
          </label>
          <select
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
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
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2.5 border border-light-border bg-white text-charcoal text-sm rounded transition-colors hover:border-warm-gray focus:border-charcoal focus:outline-none"
          >
            <option value="">All Prices</option>
            <option value="$">$ - Budget</option>
            <option value="$$">$$ - Moderate</option>
            <option value="$$$">$$$ - Upscale</option>
          </select>
        </div>
      </div>

      {/* Favorites Toggle */}
      {user && (
        <div className="mb-3">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-3 py-2 border rounded text-[13px] transition-all w-full justify-center ${
              showFavoritesOnly
                ? 'bg-accent-red text-white border-accent-red'
                : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
            }`}
          >
            <span>{showFavoritesOnly ? '♥' : '♡'}</span>
            <span>Show Favorites</span>
          </button>
        </div>
      )}

      {/* Amenities */}
      <div>
        <label className="block text-[11px] uppercase tracking-wider text-warm-gray font-medium mb-2">
          Amenities
        </label>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map(amenity => (
            <button
              key={amenity.value}
              onClick={() => toggleAmenity(amenity.value)}
              className={`flex items-center gap-2 px-2.5 py-2 border rounded text-[13px] transition-all ${
                selectedAmenities.includes(amenity.value)
                  ? 'bg-charcoal text-white border-charcoal'
                  : 'bg-white text-charcoal border-light-border hover:bg-hover-bg hover:border-charcoal'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity.value)}
                onChange={() => {}}
                className="w-4 h-4 cursor-pointer"
              />
              <span>{amenity.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
