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
  return (
    <div className="w-full md:w-[420px] bg-white border-r border-light-border flex flex-col h-full overflow-hidden z-10">
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
      />
      {/* Sauna count and view toggle - always visible */}
      <div className="px-7 py-4 border-b border-light-border text-[13px] text-warm-gray bg-white flex items-center justify-between md:hidden">
        <span>{filteredSaunas.length} sauna{filteredSaunas.length !== 1 ? 's' : ''} found</span>
        <div className="flex gap-2">
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
