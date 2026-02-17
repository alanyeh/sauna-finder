import { amenityLabels } from '../data/saunas';
import PhotoCarousel from './PhotoCarousel';

export default function SaunaCard({ sauna, isSelected, onClick, user, isFavorite, onToggleFavorite, isAdmin, onEdit }) {
  return (
    <div
      data-sauna-id={sauna.id}
      onClick={onClick}
      className={`border-b border-light-border cursor-pointer transition-colors overflow-hidden ${
        isSelected
          ? 'bg-white border-l-[3px] border-l-accent-red'
          : 'bg-cream hover:bg-white'
      }`}
    >
      {(sauna.photos || sauna.photo_url) && (
        <PhotoCarousel
          photos={sauna.photos || (sauna.photo_url ? [sauna.photo_url] : [])}
          alt={sauna.name}
        />
      )}

      <div className="px-5 py-5">
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

      {/* Type */}
      <p className="text-xs text-warm-gray mb-2 capitalize">
        {sauna.types.join(', ')}
      </p>

      {/* Rating / Price */}
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
          {/* TODO: uncomment when pricing data is verified
          {sauna.pricing_options?.length > 0 && (
            <span className="text-warm-gray font-normal">
              {' · '}
              {sauna.pricing_options[0].price && `$${sauna.pricing_options[0].price}`}
              {sauna.pricing_options[0].duration && ` / ${sauna.pricing_options[0].duration}`}
            </span>
          )}
          */}
        </div>
      </div>

      {/* TODO: uncomment when pricing data is verified
      {sauna.pricing_options?.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2.5 text-[12px] text-warm-gray">
          {sauna.pricing_options.slice(1).map((opt, i) => (
            <span key={i}>
              {opt.price && `$${opt.price}`}
              {opt.duration && ` / ${opt.duration}`}
              {opt.description && ` (${opt.description})`}
            </span>
          ))}
        </div>
      )}
      */}

      {/* Amenities */}
      {sauna.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
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

      {/* Description */}
      {sauna.description && (
        <p className="text-[12px] text-warm-gray mb-2.5 leading-relaxed">
          {sauna.description}
        </p>
      )}

      {/* Address + Visit Website */}
      <div className="flex items-center justify-between gap-2">
        {sauna.address ? (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(sauna.name + ', ' + sauna.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[12px] text-warm-gray hover:text-charcoal transition-colors underline truncate"
          >
            {sauna.address}
          </a>
        ) : <span />}
        {sauna.website_url && (
          <a
            href={sauna.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[12px] text-warm-gray hover:text-charcoal transition-colors underline flex-shrink-0"
          >
            Visit Website →
          </a>
        )}
      </div>
      </div>
    </div>
  );
}
