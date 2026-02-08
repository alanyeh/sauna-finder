import { useRef } from 'react';
import SaunaCard from './SaunaCard';

export default function SaunaList({ saunas, selectedSauna, onSaunaSelect, user, toggleFavorite, isFavorite, onScroll }) {
  const scrollContainerRef = useRef(null);

  const handleScroll = (e) => {
    if (onScroll) {
      onScroll(e.target.scrollTop);
    }
  };

  return (
    <div className="flex flex-col flex-1 bg-white overflow-hidden">
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
            />
          ))
        )}
      </div>
    </div>
  );
}
