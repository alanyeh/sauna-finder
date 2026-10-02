import { Link } from 'react-router-dom';
import { isAdmin } from '../lib/admin';
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
  { slug: 'park-city', short: 'PC', label: 'Park City' },
  { slug: 'houston', short: 'HOU', label: 'Houston' },
  { slug: 'vancouver', short: 'VAN', label: 'Vancouver' },
  { slug: 'toronto', short: 'TOR', label: 'Toronto' },
];

export default function Header({ citySlug, setCitySlug, onSignIn }) {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-50 px-4 md:px-7 py-2.5 md:py-3 border-b border-light-border bg-cream">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Link to="/" className="font-serif text-[14px] md:text-[18px] leading-tight tracking-tight shrink-0 whitespace-nowrap">
            Sauna Finder
          </Link>
          {/* Mobile: dropdown */}
          <select
            aria-label="Choose a city"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
            className="ui-field md:hidden w-auto flex-1 max-w-[145px] min-w-0 text-xs"
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
                aria-pressed={citySlug === slug}
                onClick={() => setCitySlug(slug)}
                className={`min-h-11 px-3 py-2 rounded-sm text-xs font-medium transition-colors whitespace-nowrap ${
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

        <div className="flex-shrink-0 flex items-center gap-2 md:gap-3">
          {isAdmin(user) && <Link className="ui-button" to="/admin/review">Review</Link>}
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
              className="ui-button shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
