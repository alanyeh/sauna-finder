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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Mobile toggle bar */}
      <div className="md:hidden flex border-b border-light-border shrink-0">
        <button
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mobileView === 'list' ? 'bg-charcoal text-white' : 'bg-white text-charcoal hover:bg-gray-50'}`}
        >
          List
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${mobileView === 'map' ? 'bg-charcoal text-white' : 'bg-white text-charcoal hover:bg-gray-50'}`}
        >
          Map
        </button>
      </div>

      <div className="flex flex-1 md:flex-row overflow-hidden">
        {/* Sidebar - hidden on mobile when map view */}
        <div className={`${mobileView === 'map' ? 'hidden' : 'flex-1'} md:flex md:w-[420px] md:flex-none`}>
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
        </div>

        {/* Map - hidden on mobile when list view */}
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex-1'} md:flex md:flex-1`}>
          <Map
            saunas={displayedSaunas}
            selectedSauna={selectedSauna}
            onSaunaSelect={handleSaunaSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
