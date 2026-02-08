import { useState, useRef, useEffect } from 'react';
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
  citySlug,
  setCitySlug,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(0);
  const headerHeightRef = useRef(0);

  // Reset header offset when switching to map view so city buttons aren't hidden
  useEffect(() => {
    if (mobileView === 'map') {
      setHeaderOffset(0);
    }
  }, [mobileView]);

  const handleListScroll = (scrollTop) => {
    // When scrolling, calculate how much of the header to hide
    // Header collapses more as you scroll down through the list
    const maxHeaderHeight = headerHeightRef.current || 120;
    // Cap the offset at the header's full height
    const offset = Math.min(scrollTop, maxHeaderHeight);
    setHeaderOffset(offset);
  };

  return (
    <div className="w-full md:w-[420px] border-r border-light-border flex flex-col h-full overflow-hidden z-10 relative">
      {/* Header */}
      <div className="overflow-hidden bg-white">
        <div
          ref={(el) => {
            if (el && headerHeightRef.current === 0) {
              headerHeightRef.current = el.offsetHeight;
            }
          }}
          className="md:block"
          style={{ marginTop: `-${headerOffset}px` }}
        >
          <Header citySlug={citySlug} setCitySlug={setCitySlug} />
        </div>
      </div>

      {/* Sauna count and controls */}
      <div className="sticky top-0 z-20 px-7 py-4 border-b border-light-border bg-white flex items-center justify-between">
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
            className={`p-1.5 rounded transition-colors md:hidden ${
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
            className={`p-1.5 rounded transition-colors md:hidden ${
              mobileView === 'map'
                ? 'bg-charcoal text-white'
                : 'text-charcoal hover:bg-charcoal hover:text-white'
            }`}
            title="Map view"
          >
            <svg className="w-4 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 9 10 20 10 20s10-11 10-20c0-5.52-4.48-10-10-10zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Map or List content */}
      {mobileView === 'map' ? (
        <div className="flex-1 min-h-0 relative" style={{ touchAction: 'none' }}>
          <Map
            saunas={filteredSaunas}
            selectedSauna={selectedSauna}
            onSaunaSelect={onSaunaSelect}
            citySlug={citySlug}
          />
        </div>
      ) : (
        <SaunaList
          saunas={filteredSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={onSaunaSelect}
          user={user}
          toggleFavorite={toggleFavorite}
          isFavorite={isFavorite}
          onScroll={handleListScroll}
        />
      )}

      {/* Filters Panel */}
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
    </div>
  );
}
