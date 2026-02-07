import { amenityLabels } from '../data/saunas';

export default function SaunaCard({ sauna, isSelected, onClick, user, isFavorite, onToggleFavorite }) {
  return (
    <div
      onClick={onClick}
      className={`px-7 py-5 border-b border-light-border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-cream border-l-[3px] border-l-accent-red'
          : 'bg-white hover:bg-hover-bg'
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-base font-medium mb-1.5 text-charcoal">
          {sauna.name}
        </h3>
        {user && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className={`flex-shrink-0 ml-2 text-lg leading-none transition-colors ${
              isFavorite ? 'text-accent-red' : 'text-light-border hover:text-accent-red'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorite ? '♥' : '♡'}
          </button>
        )}
      </div>

      <p className="text-xs text-warm-gray mb-2 capitalize">
        {sauna.types.join(', ')}
      </p>

      <div className="flex items-center gap-4 mb-2.5">
        <div className="flex items-center gap-1 text-[13px]">
          <span className="text-accent-red">★</span>
          <span className="font-medium">{sauna.rating}</span>
          <span className="text-warm-gray text-xs">
            ({sauna.ratingCount.toLocaleString()})
          </span>
        </div>
        <div className="text-[13px] font-medium text-charcoal">
          {sauna.price}
        </div>
      </div>

      <p className="text-[13px] text-warm-gray mb-2">
        {sauna.address}
      </p>

      <div className="flex flex-wrap gap-1.5">
        {sauna.amenities.map(amenity => (
          <span
            key={amenity}
            className="text-[11px] px-2 py-1 bg-cream rounded text-charcoal"
          >
            {amenityLabels[amenity]}
          </span>
        ))}
      </div>
    </div>
  );
}
