import { useState, useRef } from 'react';
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
  const [headerOffset, setHeaderOffset] = useState(0);
  const headerHeightRef = useRef(0);
  const lastScrollRef = useRef(0);

  const handleListScroll = (scrollTop) => {
    // Calculate scroll direction (positive = scrolling up, negative = scrolling down)
    const scrollDelta = lastScrollRef.current - scrollTop;
    lastScrollRef.current = scrollTop;

    // Update header offset based on scroll direction
    // Scrolling up collapses header, scrolling down expands it
    const newOffset = Math.max(0, Math.min(headerOffset + scrollDelta, headerHeightRef.current || 120));
    setHeaderOffset(newOffset);
  };

  return (
    <div className="w-full md:w-[420px] bg-white border-r border-light-border flex flex-col h-full overflow-hidden z-10 relative">
      {/* Header - Scrolls away on mobile, always shown on desktop */}
      <div
        ref={(el) => {
          if (el && headerHeightRef.current === 0) {
            headerHeightRef.current = el.offsetHeight;
          }
        }}
        className="md:block transition-transform duration-100 ease-out overflow-hidden"
        style={{
          transform: `translateY(-${headerOffset}px)`,
        }}
      >
        <Header />
      </div>
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
      {/* Sauna count and controls - Mobile - Sticky */}
      <div className="sticky top-0 z-20 px-7 py-4 border-b border-light-border bg-white flex items-center justify-between md:hidden">
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
            <svg className="w-4 h-6" fill="currentColor" viewBox="0 0 24 24">
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
          onScroll={handleListScroll}
        />
      )}
    </div>
  );
}
