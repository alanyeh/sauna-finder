import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';
import { isAdmin } from '../lib/admin';
import { normalizeCategories } from '../lib/saunaQuality';

import { isDiscoverableSauna } from '../lib/publicSaunas';

const SaunaDataContext = createContext(null);

function transform(rows) {
  return (rows || [])
    .filter(isDiscoverableSauna)
    .map(sauna => ({
      ...sauna,
      types: normalizeCategories(sauna.types),
      ratingCount: sauna.rating_count,
      placeId: sauna.place_id,
    }));
}

// Bootstrap loads the static JSON separately from executable JavaScript.
export function SaunaDataProvider({ children, initialSaunas }) {
  const { user } = useAuth();
  const [rows, setRows] = useState(initialSaunas || []);
  const saunas = useMemo(() => transform(rows), [rows]);
  const allSaunas = isAdmin(user) ? rows : saunas;
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(!initialSaunas);

  const fetchSaunas = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      // Supabase caps a single select at 1,000 rows and truncates silently,
      // so page through with .range().
      const PAGE_SIZE = 1000;
      const rows = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const { data, error } = await supabase
          .from('saunas')
          .select('*')
          .order('id', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) throw error;
        rows.push(...data);
        if (data.length < PAGE_SIZE) break;
      }

      if (version === requestVersion.current) setRows(rows);
    } catch (error) {
      console.error('Error fetching saunas:', error);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (window.__PRERENDER__) return;
    fetchSaunas();
    const versionRef = requestVersion;
    return () => { versionRef.current++; };
  }, [fetchSaunas, user?.id]);

  return (
    <SaunaDataContext.Provider value={{ saunas, allSaunas, loading, refetchSaunas: fetchSaunas }}>
      {children}
    </SaunaDataContext.Provider>
  );
}

export function useSaunaData() {
  const ctx = useContext(SaunaDataContext);
  if (!ctx) throw new Error('useSaunaData must be used within SaunaDataProvider');
  return ctx;
}
