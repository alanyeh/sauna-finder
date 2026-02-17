import { useRef, useEffect } from 'react';
import SaunaCard from './SaunaCard';

export default function SaunaList({ saunas, selectedSauna, onSaunaSelect, user, toggleFavorite, isFavorite, onScroll, isAdmin, onEditSauna }) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!selectedSauna || !scrollContainerRef.current) return;
    const el = scrollContainerRef.current.querySelector(`[data-sauna-id="${selectedSauna.id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedSauna]);

  const handleScroll = (e) => {
    if (onScroll) {
      onScroll(e.target.scrollTop);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-cream overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar" ref={scrollContainerRef} onScroll={handleScroll}>
        {saunas.length === 0 ? (
          <div className="px-7 py-10 text-center text-warm-gray">
            No saunas match your filters. Try adjusting your search.
          </div>
        ) : (
          saunas.map((sauna) => (
            <SaunaCard
              key={sauna.id}
              sauna={sauna}
              isSelected={selectedSauna?.id === sauna.id}
              onClick={() => onSaunaSelect(sauna)}
              user={user}
              isFavorite={isFavorite?.(sauna.id)}
              onToggleFavorite={() => toggleFavorite?.(sauna.id)}
              isAdmin={isAdmin}
              onEdit={() => onEditSauna?.(sauna)}
            />
          ))
        )}
      </div>
    </div>
  );
}
