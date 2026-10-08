import AccessDetails from './AccessDetails';
import { Link, useNavigate } from 'react-router-dom';
import { saunaPath } from '../lib/saunaRoutes';
import { amenityLabels } from '../lib/amenities';
import PhotoCarousel from './PhotoCarousel';

export default function SaunaCard({ sauna, isSelected, user, isFavorite, onToggleFavorite, isAdmin, onEdit }) {
  const navigate = useNavigate();
  const path = saunaPath(sauna);
  const openDetails = event => {
    if (event.defaultPrevented || event.target.closest('a, button, input, select, textarea') || window.getSelection()?.toString()) return;
    if (event.metaKey || event.ctrlKey || event.button === 1) {
      window.open(path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(path);
    }
  };
  return (
    <div
      data-sauna-id={sauna.id}
      role="link"
      tabIndex={0}
      aria-label={`View ${sauna.name}`}
      onClick={openDetails}
      onAuxClick={event => { if (event.button === 1) openDetails(event); }}
      onKeyDown={event => {
        if (event.target === event.currentTarget && event.key === 'Enter') {
          event.preventDefault();
          navigate(path);
        }
      }}
      className={`rounded-sm border-l-[3px] border-light-border cursor-pointer transition-colors overflow-hidden ${
        isSelected
          ? 'bg-white border-l-accent-red'
          : 'bg-cream border-l-transparent hover:bg-white'
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
        <h2 className="text-base font-normal leading-snug mb-1.5 text-charcoal">
          <Link to={saunaPath(sauna)} onClick={event => event.stopPropagation()}>{sauna.name}</Link>
        </h2>
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
        {(sauna.types || []).join(', ')}
      </p>

      <AccessDetails sauna={sauna} />
      {/* Rating */}
      <div className="flex items-center gap-4 mb-1.5">
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

      {/* Pricing */}
      <div className="mb-2.5 text-[13px]">
        {sauna.pricing_options?.length > 0 ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-warm-gray">
            {sauna.pricing_options.map((opt, i) => (
              <span key={i}>
                {opt.price && `$${opt.price}`}
                {opt.duration && ` / ${opt.duration}`}
                {opt.description && ` (${opt.description})`}
              </span>
            ))}
          </div>
        ) : sauna.website_url ? (
          <a
            href={sauna.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-warm-gray hover:text-charcoal transition-colors"
          >
            See site for pricing
          </a>
        ) : null}
      </div>

      {/* Amenities */}
      {sauna.amenities?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {sauna.amenities.filter(a => amenityLabels[a]).map(amenity => (
            <span
              key={amenity}
              className="amenity-badge"
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

      {/* Listing actions */}
      <div className="grid grid-flow-col auto-cols-fr gap-2 mt-4">
        <Link
          to={saunaPath(sauna)}
          onClick={event => event.stopPropagation()}
          className="sauna-card-action sauna-card-action-primary"
          aria-label={`View details for ${sauna.name}`}
        >
          Details
          <svg aria-hidden="true" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-5-5 5 5-5 5" />
          </svg>
        </Link>
        {sauna.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(sauna.name + ', ' + sauna.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="sauna-card-action"
            aria-label={`Directions to ${sauna.name} on Google Maps (opens in a new tab)`}
          >
            Directions
          </a>
        )}
        {sauna.website_url && (
          <a
            href={sauna.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="sauna-card-action"
            aria-label={`Visit ${sauna.name}'s website (opens in a new tab)`}
          >
            Website
            <svg aria-hidden="true" className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17 17 7M7 7h10v10" />
            </svg>
          </a>
        )}
      </div>
      </div>
    </div>
  );
}
