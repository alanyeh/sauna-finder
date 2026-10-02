import { useState, useMemo, useEffect, useRef } from 'react';

const PRICE_ORDER = { '$': 1, '$$': 2, '$$$': 3 };

// Shared category names are also used by cards, admin forms and scrapers.
export { normalizeCategory as getCategory } from '../lib/saunaQuality';
import { normalizeCategory as getCategory } from '../lib/saunaQuality';

export const useFilters = (saunas, citySlug, initialTypes = []) => {
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState(initialTypes);
  const [sortBy, setSortBy] = useState('default');

  // Track previous city to only reset when city actually changes (not on StrictMode double-invoke)
  const prevCitySlugRef = useRef(null);

  // Reset sub-filters when city changes
  useEffect(() => {
    const prevCitySlug = prevCitySlugRef.current;
    prevCitySlugRef.current = citySlug;

    // Only reset if city actually changed (not null → null on mount or same city twice)
    if (prevCitySlug !== null && prevCitySlug !== citySlug) {
      setNeighborhood('');
      setPrice('');
      setSelectedAmenities([]);
      setSelectedTypes([]);
      setSortBy('default');
    }
  }, [citySlug]);

  const citySaunas = useMemo(() => {
    if (citySlug === 'all') return saunas;
    return saunas.filter(s => (s.city_slug || 'nyc') === citySlug);
  }, [saunas, citySlug]);

  const neighborhoods = useMemo(() => {
    return [...new Set(citySaunas.map(s => s.neighborhood))].sort();
  }, [citySaunas]);

  const saunaTypes = useMemo(() => {
    return [...new Set(citySaunas.flatMap(s => (s.types || []).map(getCategory)))].sort();
  }, [citySaunas]);

  const filteredSaunas = useMemo(() => {
    const filtered = citySaunas.filter(sauna => {
      if (neighborhood && sauna.neighborhood !== neighborhood) return false;
      if (price && sauna.price !== price) return false;
      if (selectedTypes.length > 0 &&
          !selectedTypes.some(cat => (sauna.types || []).some(t => getCategory(t) === cat))) {
        return false;
      }
      if (selectedAmenities.length > 0 &&
          !selectedAmenities.every(a => (sauna.amenities || []).includes(a))) {
        return false;
      }
      return true;
    });

    // filter() already produces a new array; sorting it cannot mutate the source.
    const sorted = filtered;
    switch (sortBy) {
      case 'rating':
        sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'reviews':
        sorted.sort((a, b) => (b.rating_count || 0) - (a.rating_count || 0));
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price_asc':
        sorted.sort((a, b) => (PRICE_ORDER[a.price] || 0) - (PRICE_ORDER[b.price] || 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => (PRICE_ORDER[b.price] || 0) - (PRICE_ORDER[a.price] || 0));
        break;
      default:
        break;
    }
    return sorted;
  }, [citySaunas, neighborhood, price, selectedTypes, selectedAmenities, sortBy]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const clearFilters = () => {
    setNeighborhood('');
    setPrice('');
    setSelectedAmenities([]);
    setSelectedTypes([]);
  };

  return {
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
    clearFilters,
    sortBy,
    setSortBy,
  };
};
