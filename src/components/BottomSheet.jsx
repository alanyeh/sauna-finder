import PhotoCarousel from './PhotoCarousel';
import { amenityLabels } from '../data/saunas';

export default function BottomSheet({
  selectedSauna,
  onClose,
  user,
  isFavorite,
  onToggleFavorite,
}) {
  if (!selectedSauna) return null;

  const sauna = selectedSauna;
  const photos = sauna.photos || (sauna.photo_url ? [sauna.photo_url] : []);

  return (
    <div
      className="absolute bottom-3 left-3 right-3 z-40 bg-white rounded-xl bottom-sheet-shadow overflow-hidden animate-slide-up"
      role="dialog"
      aria-label={`Details for ${sauna.name}`}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-black/40 text-white text-sm hover:bg-black/60 transition-colors"
        aria-label="Close"
      >
        ✕
      </button>

      <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '60vh' }}>
        {/* Photo carousel */}
        {photos.length > 0 && (
          <PhotoCarousel photos={photos} alt={sauna.name} />
        )}

        <div className="px-3 py-3">
          {/* Name + favorite */}
          <div className="flex items-start justify-between">
            <h3 className="text-base font-medium text-charcoal">
              {sauna.name}
            </h3>
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className={`text-lg leading-none transition-colors flex-shrink-0 ml-2 ${
                  isFavorite ? 'text-accent-red' : 'text-light-border hover:text-accent-red'
                }`}
                aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            )}
          </div>

          {/* Types */}
          {sauna.types?.length > 0 && (
            <p className="text-xs text-warm-gray capitalize mt-0.5">
              {sauna.types.join(', ')}
            </p>
          )}

          {/* Rating + price */}
          <div className="flex items-center gap-2 mt-1.5">
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
            {sauna.price && (
              <span className="text-[13px] font-medium text-charcoal">
                {sauna.price}
              </span>
            )}
          </div>

          {/* Amenities */}
          {sauna.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {sauna.amenities.filter(a => amenityLabels[a]).map(amenity => (
                <span
                  key={amenity}
                  className="text-[11px] px-2 py-1 bg-cream rounded text-charcoal"
                >
                  {amenityLabels[amenity]}
                </span>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div className="flex gap-2 mt-3">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sauna.name + ' ' + sauna.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-4 py-2.5 bg-charcoal text-white text-[13px] rounded transition-colors hover:bg-accent-red font-medium"
            >
              View on Maps
            </a>
            {sauna.website_url && (
              <a
                href={sauna.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2.5 bg-white border border-light-border text-charcoal text-[13px] rounded transition-colors hover:bg-hover-bg font-medium"
              >
                Visit Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
