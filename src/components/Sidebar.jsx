import Header from './Header';
import Filters from './Filters';
import SaunaList from './SaunaList';

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
      <SaunaList
        saunas={filteredSaunas}
        selectedSauna={selectedSauna}
        onSaunaSelect={onSaunaSelect}
        user={user}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        mobileView={mobileView}
        setMobileView={setMobileView}
        mapProps={{
          saunas: filteredSaunas,
          selectedSauna: selectedSauna,
          onSaunaSelect: onSaunaSelect,
        }}
      />
    </div>
  );
}
