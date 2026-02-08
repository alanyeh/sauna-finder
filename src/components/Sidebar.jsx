import { useState } from 'react';
import Header from './Header';
import Filters from './Filters';
import SaunaList from './SaunaList';
import Map from './Map';

export default function Sidebar({
  neighborhoods,
  neighborhood,
  setNeighborhood,
  price,
  setPrice,
  selectedAmenities,
  toggleAmenity,
  filteredSaunas,
  selectedSauna,
  onSaunaSelect,
  user,
  toggleFavorite,
  isFavorite,
  showFavoritesOnly,
  setShowFavoritesOnly,
  mobileView,
  setMobileView,
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="w-full md:w-[420px] bg-white border-r border-light-border flex flex-col h-full overflow-hidden z-10 relative">
      <Header />
      <Filters
        neighborhoods={neighborhoods}
        neighborhood={neighborhood}
        setNeighborhood={setNeighborhood}
        price={price}
        setPrice={setPrice}
        selectedAmenities={selectedAmenities}
        toggleAmenity={toggleAmenity}
        user={user}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
      {/* Sauna count and controls - Mobile */}
      <div className="px-7 py-4 border-b border-light-border bg-white flex items-center justify-between md:hidden">
        <span className="text-[13px] text-warm-gray">{filteredSaunas.length} sauna{filteredSaunas.length !== 1 ? 's' : ''} found</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
              showFilters
                ? 'bg-charcoal text-white'
                : 'bg-white text-charcoal border border-charcoal hover:bg-charcoal hover:text-white'
            }`}
            title="Toggle filters"
          >
            Filter
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`p-1.5 rounded transition-colors ${
              mobileView === 'list'
                ? 'bg-charcoal text-white'
                : 'text-charcoal hover:bg-charcoal hover:text-white'
            }`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`p-1.5 rounded transition-colors ${
              mobileView === 'map'
                ? 'bg-charcoal text-white'
                : 'text-charcoal hover:bg-charcoal hover:text-white'
            }`}
            title="Map view"
          >
            <svg className="w-4 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 9 10 20 10 20s10-11 10-20c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sauna count and filters - Desktop */}
      <div className="hidden md:flex px-7 py-4 border-b border-light-border bg-white items-center justify-between">
        <span className="text-[13px] text-warm-gray">{filteredSaunas.length} sauna{filteredSaunas.length !== 1 ? 's' : ''} found</span>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 rounded text-[13px] font-medium transition-colors ${
            showFilters
              ? 'bg-charcoal text-white'
              : 'bg-white text-charcoal border border-charcoal hover:bg-charcoal hover:text-white'
          }`}
          title="Toggle filters"
        >
          Filter
        </button>
      </div>

      {/* Map or List content */}
      {mobileView === 'map' ? (
        <Map
          saunas={filteredSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={onSaunaSelect}
        />
      ) : (
        <SaunaList
          saunas={filteredSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={onSaunaSelect}
          user={user}
          toggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
        />
      )}
    </div>
  );
}
