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
            className={`p-1 transition-colors ${mobileView === 'list' ? 'text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
            title="List view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setMobileView('map')}
            className={`p-1 transition-colors ${mobileView === 'map' ? 'text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
            title="Map view"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
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
