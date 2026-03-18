import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const SaunaDataContext = createContext(null);

// Generic chains to hide from results (records stay in DB but are filtered out)
const HIDDEN_CHAINS = [
  // Gym chains
  'LA Fitness', 'Anytime Fitness', 'Crunch Fitness', 'YMCA',
  // Budget/generic hotel chains
  'Holiday Inn', 'Comfort Suites', 'Comfort Inn', 'La Quinta',
  'Quality Inn', 'Best Western', 'Crowne Plaza', 'Courtyard by Marriott',
  'Delta Hotels', 'Sheraton', 'Hilton Americas',
];

function isHiddenChain(sauna) {
  return HIDDEN_CHAINS.some(chain => sauna.name?.includes(chain));
}

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

      const transformedData = (data || [])
        .filter(sauna => !isHiddenChain(sauna))
        .map(sauna => ({
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
