import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CITIES = [
  { slug: 'all', short: 'All', label: 'All Cities' },
  { slug: 'nyc', short: 'NYC', label: 'New York' },
  { slug: 'sf', short: 'SF', label: 'San Francisco' },
  { slug: 'chicago', short: 'CHI', label: 'Chicago' },
  { slug: 'seattle', short: 'SEA', label: 'Seattle' },
  { slug: 'la', short: 'LA', label: 'Los Angeles' },
  { slug: 'minneapolis', short: 'MSP', label: 'Minneapolis' },
  { slug: 'portland', short: 'PDX', label: 'Portland' },
  { slug: 'denver', short: 'DEN', label: 'Denver' },
];

export default function Header({ citySlug, setCitySlug, onSignIn }) {
  const { user, logout } = useAuth();

  return (
    <div className="px-4 md:px-7 py-2.5 md:py-3 border-b border-light-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Link to="/">
            <h1 className="font-serif text-[22px] md:text-[26px] leading-tight tracking-tight hover:text-accent-red transition-colors cursor-pointer whitespace-nowrap">
              Sauna Finder
            </h1>
          </Link>
          {/* Mobile: dropdown */}
          <select
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="md:hidden px-2 py-1 rounded text-[12px] font-medium bg-cream border border-light-border text-charcoal"
          >
            {CITIES.map(({ slug, label }) => (
              <option key={slug} value={slug}>{label}</option>
            ))}
          </select>

          {/* Desktop: button row */}
          <div className="hidden md:flex gap-1 flex-wrap">
            {CITIES.map(({ slug, short }) => (
              <button
                key={slug}
                onClick={() => setCitySlug(slug)}
                className={`px-3 py-1 rounded text-[12px] font-medium transition-colors whitespace-nowrap ${
                  citySlug === slug
                    ? 'bg-charcoal text-white'
                    : 'text-warm-gray hover:text-charcoal'
                }`}
              >
                {short}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0">
          {user ? (
            <div className="flex items-center gap-1 md:gap-2">
    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-accent-red text-white flex items-center justify-center text-xs md:text-sm font-medium flex-shrink-0">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-[11px] md:text-[12px] text-warm-gray hover:text-charcoal transition-colors hidden sm:block"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="px-2.5 md:px-3 py-1 md:py-1.5 rounded text-[11px] md:text-[13px] font-medium transition-colors bg-white text-charcoal border border-charcoal hover:bg-charcoal hover:text-white"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
