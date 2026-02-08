import { useState, useMemo, useEffect } from 'react';

export const useFilters = (saunas, citySlug) => {
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  // Reset sub-filters when city changes
  useEffect(() => {
    setNeighborhood('');
    setPrice('');
    setSelectedAmenities([]);
  }, [citySlug]);

  const citySaunas = useMemo(() => {
    return saunas.filter(s => (s.city_slug || 'nyc') === citySlug);
  }, [saunas, citySlug]);

  const neighborhoods = useMemo(() => {
    return [...new Set(citySaunas.map(s => s.neighborhood))].sort();
  }, [citySaunas]);

  const filteredSaunas = useMemo(() => {
    return citySaunas.filter(sauna => {
      if (neighborhood && sauna.neighborhood !== neighborhood) return false;
      if (price && sauna.price !== price) return false;
      if (selectedAmenities.length > 0 &&
          !selectedAmenities.every(a => sauna.amenities.includes(a))) {
        return false;
      }
      return true;
    });
  }, [citySaunas, neighborhood, price, selectedAmenities]);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setNeighborhood('');
    setPrice('');
    setSelectedAmenities([]);
  };

  return {
    neighborhood,
    setNeighborhood,
    price,
    setPrice,
    selectedAmenities,
    toggleAmenity,
    neighborhoods,
    filteredSaunas,
    clearFilters
  };
};
