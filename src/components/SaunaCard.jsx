import { amenityLabels } from '../data/saunas';
import PhotoCarousel from './PhotoCarousel';

export default function SaunaCard({ sauna, isSelected, onClick, user, isFavorite, onToggleFavorite, isAdmin, onEdit }) {
  return (
    <div
      onClick={onClick}
      className={`border-b border-light-border cursor-pointer transition-colors overflow-hidden ${
        isSelected
          ? 'bg-cream border-l-[3px] border-l-accent-red'
          : 'bg-white hover:bg-hover-bg'
      }`}
    >
      {(sauna.photos || sauna.photo_url) && (
        <PhotoCarousel
          photos={sauna.photos || (sauna.photo_url ? [sauna.photo_url] : [])}
          alt={sauna.name}
        />
      )}

      <div className="px-7 py-5">
        <div className="flex items-start justify-between">
        <h3 className="text-base font-medium mb-1.5 text-charcoal">
          {sauna.name}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-warm-gray hover:text-charcoal text-sm leading-none transition-colors"
              aria-label="Edit sauna"
              title="Edit sauna"
            >
              &#9998;
            </button>
          )}
          {user && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`text-lg leading-none transition-colors ${
                isFavorite ? 'text-accent-red' : 'text-light-border hover:text-accent-red'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>
      </div>

      <p className="text-xs text-warm-gray mb-2 capitalize">
        {sauna.types.join(', ')}
      </p>

      <div className="flex items-center gap-4 mb-2.5">
        {sauna.rating != null && (
          <div className="flex items-center gap-1 text-[13px]">
            <span className="text-accent-red">★</span>
            <span className="font-medium">{sauna.rating}</span>
            {sauna.ratingCount != null && (
              <span className="text-warm-gray text-xs">
                ({sauna.ratingCount.toLocaleString()})
              </span>
            )}
          </div>
        )}
        <div className="text-[13px] font-medium text-charcoal">
          {sauna.price}
        </div>
      </div>

      {sauna.placeId ? (
        <a
          href={`https://www.google.com/maps/place/?q=place_id:${sauna.placeId}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[13px] text-warm-gray hover:text-charcoal transition-colors underline mb-2 block"
        >
          {sauna.address}
        </a>
      ) : (
        <p className="text-[13px] text-warm-gray mb-2">
          {sauna.address}
        </p>
      )}

      {sauna.description && (
        <p className="text-[12px] text-warm-gray mb-2.5 leading-relaxed">
          {sauna.description}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {sauna.amenities.filter(a => amenityLabels[a]).map(amenity => (
          <span
            key={amenity}
            className="text-[11px] px-2 py-1 bg-cream rounded text-charcoal"
          >
            {amenityLabels[amenity]}
          </span>
        ))}
      </div>

      {sauna.website_url && (
        <a
          href={sauna.website_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[12px] text-warm-gray hover:text-charcoal transition-colors underline"
        >
          Visit website →
        </a>
      )}
      </div>
    </div>
  );
}
