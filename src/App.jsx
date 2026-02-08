import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import { supabase } from './supabase';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './contexts/AuthContext';
import { useFavorites } from './hooks/useFavorites';

function App() {
  const [saunas, setSaunas] = useState([]);
  const [selectedSauna, setSelectedSauna] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const { user } = useAuth();
  const { favorites, toggleFavorite, isFavorite } = useFavorites(user?.id);

  // Fetch saunas from Supabase
  useEffect(() => {
    const fetchSaunas = async () => {
      try {
        const { data, error } = await supabase
          .from('saunas')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        // Convert snake_case to camelCase
        const transformedData = (data || []).map(sauna => ({
          ...sauna,
          ratingCount: sauna.rating_count,
          placeId: sauna.place_id,
        }));

        setSaunas(transformedData);
      } catch (error) {
        console.error('Error fetching saunas:', error);
        setSaunas([]);
      }
    };

    fetchSaunas();
  }, []);

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
      {/* Sidebar - shown on all views, contains Header, Filters, and either SaunaList or Map on mobile */}
      <div className="md:flex md:w-[420px] md:flex-none">
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
          mobileView={mobileView}
          setMobileView={setMobileView}
        />
      </div>

      {/* Map on desktop - hidden on mobile */}
      <div className="hidden md:flex flex-1 h-screen">
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
