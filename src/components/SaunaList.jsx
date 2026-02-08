import SaunaCard from './SaunaCard';

export default function SaunaList({ saunas, selectedSauna, onSaunaSelect, user, toggleFavorite, isFavorite, mobileView, setMobileView }) {
  return (
    <div className="flex flex-col flex-1 bg-white overflow-hidden">
      <div className="px-7 py-4 border-b border-light-border text-[13px] text-warm-gray bg-white flex items-center justify-between">
        <span>{saunas.length} sauna{saunas.length !== 1 ? 's' : ''} found</span>
        {setMobileView && (
          <div className="md:hidden flex gap-2">
            <button
              onClick={() => setMobileView('list')}
              className={`p-1 transition-colors ${mobileView === 'list' ? 'text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 4h18v2H3V4zm0 7h18v2H3v-2zm0 7h18v2H3v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`p-1 transition-colors ${mobileView === 'map' ? 'text-charcoal' : 'text-warm-gray hover:text-charcoal'}`}
              title="Map view"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
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
