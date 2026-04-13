import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import prebuiltSaunas from '../data/saunas-prebuilt.json';

const SaunaDataContext = createContext(null);

// Generic chains to hide from results (records stay in DB but are filtered out)
const HIDDEN_CHAINS = [
  // Gym chains
  'LA Fitness', 'Anytime Fitness', 'Crunch Fitness', 'YMCA', 'Life Time',
  // Budget/generic hotel chains
  'Holiday Inn', 'Comfort Suites', 'Comfort Inn', 'La Quinta',
  'Quality Inn', 'Best Western', 'Crowne Plaza', 'Courtyard by Marriott',
  'Delta Hotels', 'Sheraton', 'Hilton Americas', 'The Chatwal',
];

function isHiddenChain(sauna) {
  return HIDDEN_CHAINS.some(chain => sauna.name?.includes(chain));
}

function transform(rows) {
  return (rows || [])
    .filter(sauna => !isHiddenChain(sauna))
    .map(sauna => ({
      ...sauna,
      ratingCount: sauna.rating_count,
      placeId: sauna.place_id,
    }));
}

// Seeded from the build-time Supabase snapshot so the first render (both
// during prerender and during client hydration) has identical data. Without
// this, the client's first render would show 0 saunas while the prerendered
// HTML has the real list — causing hydration mismatches.
const INITIAL_SAUNAS = transform(prebuiltSaunas);

export function SaunaDataProvider({ children }) {
  const [saunas, setSaunas] = useState(INITIAL_SAUNAS);
  const [loading, setLoading] = useState(false);

  const fetchSaunas = async () => {
    try {
      const { data, error } = await supabase
        .from('saunas')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      setSaunas(transform(data));
    } catch (error) {
      console.error('Error fetching saunas:', error);
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
