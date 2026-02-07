import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'favorites_';

export function useFavorites(uid) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    if (!uid) {
      setFavorites([]);
      return;
    }
    const stored = localStorage.getItem(STORAGE_PREFIX + uid);
    if (stored) {
      try {
        setFavorites(JSON.parse(stored));
      } catch {
        setFavorites([]);
      }
    } else {
      setFavorites([]);
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    localStorage.setItem(STORAGE_PREFIX + uid, JSON.stringify(favorites));
  }, [uid, favorites]);

  const toggleFavorite = useCallback((saunaId) => {
    setFavorites((prev) =>
      prev.includes(saunaId)
        ? prev.filter((id) => id !== saunaId)
        : [...prev, saunaId]
    );
  }, []);

  const isFavorite = useCallback(
    (saunaId) => favorites.includes(saunaId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
