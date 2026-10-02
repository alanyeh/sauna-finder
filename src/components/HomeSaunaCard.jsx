import { Link } from 'react-router-dom';

export default function HomeSaunaCard({ sauna }) {
  const photos = sauna.photos || [];
  const primaryPhoto = photos[0];

  return (
    <Link
      to={`/city/${sauna.city_slug}`}
      state={{ selectedSaunaId: sauna.id }}
      className="flex-shrink-0 w-[72vw] sm:w-[44vw] md:w-[280px] lg:w-[280px] snap-start group hover:no-underline"
    >
      <div className="relative w-full aspect-[3/2] rounded-sm overflow-hidden bg-light-border mb-3">
        {primaryPhoto ? (
          <img
            src={primaryPhoto}
            alt={sauna.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-gray text-sm">
            No photo
          </div>
        )}
      </div>

      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-normal text-charcoal leading-snug line-clamp-2">
            {sauna.name}
          </h3>
          {sauna.rating != null && (
            <div className="flex items-center gap-0.5 flex-shrink-0 text-[12px] md:text-[13px]">
              <span className="text-accent-red">★</span>
              <span className="font-medium">{sauna.rating}</span>
            </div>
          )}
        </div>

        {sauna.types?.length > 0 && (
          <p className="text-xs text-warm-gray truncate mt-1.5">
            {sauna.types[0]}
          </p>
        )}

      </div>
    </Link>
  );
}
