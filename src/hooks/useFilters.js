import { useState, useMemo, useEffect } from 'react';

const PRICE_ORDER = { '$': 1, '$$': 2, '$$$': 3 };

// Maps granular type strings → consolidated filter categories
const TYPE_TO_CATEGORY = {
  'Russian Banya': 'Russian Banya',
  'Russian Bathhouse': 'Russian Banya',
  'Traditional Banya': 'Russian Banya',
  'Traditional Russian Banya': 'Russian Banya',
  'Korean Spa': 'Korean Spa',
  'Korean Day Spa': 'Korean Spa',
  'Korean Fitness & Spa': 'Korean Spa',
  'Boutique Sauna': 'Modern Bathhouse',
  'Private Sauna Studio': 'Modern Bathhouse',
  'Infrared Sauna': 'Infrared Sauna',
  'Day Spa': 'Modern Bathhouse',
  'Hotel Spa': 'Hotel Spa',
  'Luxury Spa': 'Modern Bathhouse',
  'Wellness Spa': 'Modern Bathhouse',
  'Italian Spa': 'Modern Bathhouse',
  'Resort': 'Modern Bathhouse',
  'Modern Bathhouse': 'Modern Bathhouse',
  'World Spa': 'Modern Bathhouse',
  'Gym Sauna': 'Gym Sauna',
  'Day Spa & Sauna Resort': 'Modern Bathhouse',
  'Japanese Neighborhood Sauna': 'Japanese Sauna',
};

function getCategory(rawType) {
  return TYPE_TO_CATEGORY[rawType] || rawType;
}

export const useFilters = (saunas, citySlug) => {
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState('default');

  // Reset sub-filters when city changes
  useEffect(() => {
    setNeighborhood('');
    setPrice('');
    setSelectedAmenities([]);
    setSelectedTypes([]);
    setSortBy('default');
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
          !selectedAmenities.every(a => sauna.amenities.includes(a))) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered];
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
