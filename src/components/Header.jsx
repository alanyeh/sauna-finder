import CitySelector from './CitySelector';
import { Link } from 'react-router-dom';
import { isAdmin } from '../lib/admin';
import { useAuth } from '../contexts/AuthContext';

export default function Header({ citySlug, setCitySlug, onSignIn }) {
  const { user, logout } = useAuth();

  return (
    <div className="sticky top-0 z-50 px-4 md:px-7 py-2.5 md:py-3 border-b border-light-border bg-cream">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          <Link to="/" className="font-serif text-[14px] md:text-[18px] leading-tight tracking-tight shrink-0 whitespace-nowrap">
            Sauna Finder
          </Link>
          <CitySelector value={citySlug} onChange={setCitySlug} />
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
