import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Map from '../components/Map';
import AuthModal from '../components/AuthModal';
import SubmitSaunaModal from '../components/SubmitSaunaModal';
import AdminEditModal from '../components/AdminEditModal';
import AdminAddSaunaModal from '../components/AdminAddSaunaModal';
import { useSaunaData } from '../contexts/SaunaDataContext';
import { useFilters } from '../hooks/useFilters';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { isAdmin } from '../lib/admin';

export default function CityPage() {
  const { citySlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { saunas, refetchSaunas } = useSaunaData();
  const { user } = useAuth();
  const userIsAdmin = isAdmin(user);
  const { favorites, toggleFavorite, isFavorite } = useFavorites(user?.id);

  const [selectedSauna, setSelectedSauna] = useState(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingSauna, setEditingSauna] = useState(null);
  const [showAddSaunaModal, setShowAddSaunaModal] = useState(false);

  // Validate citySlug — redirect to home if invalid (after data loads)
  useEffect(() => {
    if (saunas.length === 0) return;
    if (citySlug === 'all') return;
    const validSlugs = [...new Set(saunas.map(s => s.city_slug))];
    if (!validSlugs.includes(citySlug)) {
      navigate('/', { replace: true });
    }
  }, [citySlug, saunas, navigate]);

  // Auto-select sauna from homepage navigation
  useEffect(() => {
    const selectedSaunaId = location.state?.selectedSaunaId;
    if (selectedSaunaId && saunas.length > 0) {
      const sauna = saunas.find(s => s.id === selectedSaunaId);
      if (sauna) {
        setSelectedSauna(sauna);
      }
      // Clear the state so refreshing doesn't re-select
      window.history.replaceState({}, '');
    }
  }, [location.state?.selectedSaunaId, saunas]);

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

  const handleSaunaSelect = (sauna) => {
    setSelectedSauna(sauna);
  };

  const handleCityChange = (newSlug) => {
    navigate(`/city/${newSlug}`);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden">
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
          setCitySlug={handleCityChange}
          onSubmitSauna={handleSubmitSauna}
          onSignIn={() => setShowAuthModal(true)}
          isAdmin={userIsAdmin}
          onEditSauna={setEditingSauna}
          onAddSauna={handleAddSauna}
        />
      </div>

      <div className="hidden md:flex flex-1 h-screen">
        <Map
          saunas={displayedSaunas}
          selectedSauna={selectedSauna}
          onSaunaSelect={handleSaunaSelect}
          citySlug={citySlug}
          onCityClick={handleCityChange}
        />
      </div>

      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}

      {showSubmitModal && (
        <SubmitSaunaModal
          onClose={() => setShowSubmitModal(false)}
          citySlug={citySlug}
          onSaunaAdded={refetchSaunas}
        />
      )}

      {editingSauna && (
        <AdminEditModal
          sauna={editingSauna}
          onClose={() => setEditingSauna(null)}
          onSaunaUpdated={refetchSaunas}
        />
      )}

      {showAddSaunaModal && (
        <AdminAddSaunaModal
          onClose={() => setShowAddSaunaModal(false)}
          onSaunaAdded={refetchSaunas}
        />
      )}
    </div>
  );
}
