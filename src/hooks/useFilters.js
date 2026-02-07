import { useState, useMemo } from 'react';

export const useFilters = (saunas) => {
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState([]);

  const neighborhoods = useMemo(() => {
    return [...new Set(saunas.map(s => s.neighborhood))].sort();
  }, [saunas]);

  const filteredSaunas = useMemo(() => {
    return saunas.filter(sauna => {
      if (neighborhood && sauna.neighborhood !== neighborhood) return false;
      if (price && sauna.price !== price) return false;
      if (selectedAmenities.length > 0 && 
          !selectedAmenities.every(a => sauna.amenities.includes(a))) {
        return false;
      }
      return true;
    });
  }, [saunas, neighborhood, price, selectedAmenities]);

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
