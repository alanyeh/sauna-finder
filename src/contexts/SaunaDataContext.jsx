import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const SaunaDataContext = createContext(null);

export function SaunaDataProvider({ children }) {
  const [saunas, setSaunas] = useState([]);
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaunas();
  }, []);

  return (
    <SaunaDataContext.Provider value={{ saunas, loading, refetchSaunas: fetchSaunas }}>
      {children}
    </SaunaDataContext.Provider>
  );
}

export function useSaunaData() {
  const ctx = useContext(SaunaDataContext);
  if (!ctx) throw new Error('useSaunaData must be used within SaunaDataProvider');
  return ctx;
}
