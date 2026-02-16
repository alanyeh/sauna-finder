import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Map from './components/Map';
import AuthModal from './components/AuthModal';
import SubmitSaunaModal from './components/SubmitSaunaModal';
import AdminEditModal from './components/AdminEditModal';
import AdminAddSaunaModal from './components/AdminAddSaunaModal';
import { supabase } from './supabase';
import { useFilters } from './hooks/useFilters';
import { useAuth } from './contexts/AuthContext';
import { useFavorites } from './hooks/useFavorites';
import { isAdmin } from './lib/admin';

function App() {
  const [saunas, setSaunas] = useState([]);
  const [selectedSauna, setSelectedSauna] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [citySlug, setCitySlug] = useState('nyc');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingSauna, setEditingSauna] = useState(null);
  const [showAddSaunaModal, setShowAddSaunaModal] = useState(false);
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const { favorites, toggleFavorite, isFavorite } = useFavorites(user?.id);

  const fetchSaunas = async () => {
    try {
      const { data, error } = await supabase
        .from('saunas')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

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

  useEffect(() => {
    fetchSaunas();
  }, []);

  const handleSubmitSauna = () => {
    if (user) {
      setShowSubmitModal(true);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleAddSauna = () => {
    setShowAddSaunaModal(true);
  };

  const {
    neighborhood,
    setNeighborhood,
    price,
    setPrice,
    selectedAmenities,
    toggleAmenity,
    selectedTypes,
    toggleType,
    saunaTypes,
    neighborhoods,
    filteredSaunas,
    sortBy,
    setSortBy,
  } = useFilters(saunas, citySlug);

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
      <div className="flex flex-col flex-1 h-full md:flex-none md:w-[420px] md:h-auto">
        <Sidebar
          neighborhoods={neighborhoods}
          neighborhood={neighborhood}
          setNeighborhood={setNeighborhood}
          price={price}
          setPrice={setPrice}
          selectedAmenities={selectedAmenities}
          toggleAmenity={toggleAmenity}
          saunaTypes={saunaTypes}
          selectedTypes={selectedTypes}
          toggleType={toggleType}
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
          sortBy={sortBy}
          setSortBy={setSortBy}
          citySlug={citySlug}
          setCitySlug={setCitySlug}
          onSubmitSauna={handleSubmitSauna}
          onSignIn={() => setShowAuthModal(true)}
          isAdmin={userIsAdmin}
          onEditSauna={setEditingSauna}
          onAddSauna={handleAddSauna}
        />
      </div>

      {/* Map on desktop - hidden on mobile */}
      <div className="hidden md:flex flex-1 h-screen">
        <Map
          saunas={displayedSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={handleSaunaSelect}
          citySlug={citySlug}
        />
      </div>
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showSubmitModal && (
        <SubmitSaunaModal
          onClose={() => setShowSubmitModal(false)}
          citySlug={citySlug}
          onSaunaAdded={fetchSaunas}
        />
      )}

      {editingSauna && (
        <AdminEditModal
          sauna={editingSauna}
          onClose={() => setEditingSauna(null)}
          onSaunaUpdated={fetchSaunas}
        />
      )}

      {showAddSaunaModal && (
        <AdminAddSaunaModal
          onClose={() => setShowAddSaunaModal(false)}
          onSaunaAdded={fetchSaunas}
        />
      )}
    </div>
  );
}

export default App;
