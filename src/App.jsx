import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { saunas } from './data/saunas';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './contexts/AuthContext';
import { useFavorites } from './hooks/useFavorites';

function App() {
  const [selectedSauna, setSelectedSauna] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const { user } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites(user?.id);

  const {
    neighborhood,
    setNeighborhood,
    price,
    setPrice,
    selectedAmenities,
    toggleAmenity,
    neighborhoods,
    filteredSaunas,
  } = useFilters(saunas);

  // Reset favorites filter on sign-out
  useEffect(() => {
    if (!user) setShowFavoritesOnly(false);
  }, [user]);

  const displayedSaunas = useMemo(() => {
    if (!showFavoritesOnly) return filteredSaunas;
    return filteredSaunas.filter((s) => favorites.includes(s.id));
  }, [filteredSaunas, showFavoritesOnly, favorites]);

  const handleSaunaSelect = (sauna) => {
    setSelectedSauna(sauna);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
      <Sidebar
        neighborhoods={neighborhoods}
        neighborhood={neighborhood}
        setNeighborhood={setNeighborhood}
        price={price}
        setPrice={setPrice}
        selectedAmenities={selectedAmenities}
        toggleAmenity={toggleAmenity}
        filteredSaunas={displayedSaunas}
        selectedSauna={selectedSauna}
        onSaunaSelect={handleSaunaSelect}
        user={user}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />
      <div className="flex-1 h-full md:h-screen">
        <Map
          saunas={displayedSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={handleSaunaSelect}
        />
      </div>
    </div>
  );
}

export default App;
