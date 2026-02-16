import { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSaunaData } from '../contexts/SaunaDataContext';
import { useAuth } from '../contexts/AuthContext';
import { getCityFullName } from '../lib/cities';
import HomeSaunaCard from '../components/HomeSaunaCard';

function CityCarousel({ saunas, citySlug }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    updateArrows();
  }, [saunas, updateArrows]);

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 296; // 280px card + 16px gap
    el.scrollBy({ left: direction * cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <div className="relative group/carousel">
      {/* Arrows — hidden on touch devices via hidden md:flex */}
      {canScrollLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-2 top-[30%] -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-charcoal hover:bg-white transition-all"
          aria-label="Scroll left"
        >
          ‹
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={updateArrows}
        className="flex gap-3 md:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide"
      >
        {saunas.map(sauna => (
          <HomeSaunaCard key={sauna.id} sauna={sauna} citySlug={citySlug} />
        ))}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-2 top-[30%] -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-charcoal hover:bg-white transition-all"
          aria-label="Scroll right"
        >
          ›
        </button>
      )}
    </div>
  );
}

export default function HomePage() {
  const { saunas, loading } = useSaunaData();
  const { user, logout } = useAuth();
  const [headerPinned, setHeaderPinned] = useState(false);

  useEffect(() => {
    const onScroll = () => setHeaderPinned(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const citySections = useMemo(() => {
    const grouped = {};
    saunas.forEach(s => {
      const slug = s.city_slug || 'nyc';
      if (!grouped[slug]) grouped[slug] = [];
      grouped[slug].push(s);
    });

    return Object.entries(grouped)
      .map(([slug, items]) => ({
        slug,
        fullName: getCityFullName(slug),
        saunas: items.sort((a, b) => (b.rating || 0) - (a.rating || 0)),
        totalCount: items.length,
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  }, [saunas]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-warm-gray text-sm">Loading saunas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Sticky header */}
      <header
        className={`sticky top-0 z-30 bg-cream px-4 md:px-8 lg:px-16 py-4 md:py-6 border-b border-light-border transition-shadow ${
          headerPinned ? 'shadow-sm' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="font-serif text-[22px] md:text-[32px] leading-tight tracking-tight">
              Sauna Finder
            </h1>
            <p className="text-[11px] md:text-[13px] text-warm-gray font-light tracking-wide mt-0.5 hidden sm:block">
              Discover the best saunas and bathhouses across the US
            </p>
          </div>
          <div className="flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent-red text-white flex items-center justify-center text-xs md:text-sm font-medium">
                  {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  className="text-[12px] text-warm-gray hover:text-charcoal transition-colors hidden sm:block"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/city/nyc"
                className="px-2.5 md:px-3 py-1 md:py-1.5 rounded text-[12px] md:text-[13px] font-medium transition-colors bg-white text-charcoal border border-charcoal hover:bg-charcoal hover:text-white"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* City sections */}
      {citySections.map(city => (
        <section key={city.slug} className="px-4 md:px-8 lg:px-16 py-6 md:py-10 border-b border-light-border last:border-b-0">
          <div className="flex items-baseline justify-between mb-3 md:mb-5">
            <Link
              to={`/city/${city.slug}`}
              className="group flex items-baseline gap-1.5 md:gap-2 min-w-0"
            >
              <h2 className="font-serif text-lg md:text-2xl text-charcoal truncate">
                Popular saunas in {city.fullName}
              </h2>
              <span className="text-warm-gray group-hover:text-charcoal transition-colors text-base md:text-lg flex-shrink-0">
                ›
              </span>
            </Link>
            <span className="text-[11px] md:text-xs text-warm-gray hidden sm:block flex-shrink-0 ml-3">
              {city.totalCount} sauna{city.totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          <CityCarousel saunas={city.saunas} citySlug={city.slug} />
        </section>
      ))}

      {/* Footer */}
      <footer className="px-4 md:px-8 lg:px-16 py-6 md:py-8 text-center">
        <p className="text-[11px] md:text-xs text-warm-gray">
          Sauna Finder — Find your perfect sauna
        </p>
      </footer>
    </div>
  );
}
