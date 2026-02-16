import { useAuth } from '../contexts/AuthContext';

export default function Header({ citySlug, setCitySlug, onSignIn }) {
  const { user, logout } = useAuth();

  return (
    <div className="px-4 md:px-7 py-6 md:py-8 md:pb-6 border-b border-light-border">
      <div className="flex items-start justify-between gap-3 md:gap-0">
        <div className="flex-1">
          <h1 className="font-serif text-[24px] md:text-[28px] leading-tight tracking-tight mb-1 md:mb-2">
            Sauna Finder
          </h1>
          <p className="text-[11px] md:text-[13px] text-warm-gray font-light tracking-wide hidden md:block">
            Find your perfect sauna
          </p>
          <div className="flex gap-1 mt-2 md:mt-3 flex-wrap">
            <button
              onClick={() => setCitySlug('all')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'all'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setCitySlug('nyc')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'nyc'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              NYC
            </button>
            <button
              onClick={() => setCitySlug('sf')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'sf'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              SF
            </button>
            <button
              onClick={() => setCitySlug('chicago')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'chicago'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              CHI
            </button>
            <button
              onClick={() => setCitySlug('seattle')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'seattle'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              SEA
            </button>
            <button
              onClick={() => setCitySlug('la')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'la'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              LA
            </button>
            <button
              onClick={() => setCitySlug('minneapolis')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'minneapolis'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              MSP
            </button>
            <button
              onClick={() => setCitySlug('portland')}
              className={`px-2.5 md:px-3 py-1 rounded text-[11px] md:text-[12px] font-medium transition-colors whitespace-nowrap ${
                citySlug === 'portland'
                  ? 'bg-charcoal text-white'
                  : 'text-warm-gray hover:text-charcoal'
              }`}
            >
              PDX
            </button>
          </div>
        </div>

        <div className="flex-shrink-0 mt-0.5 md:mt-1">
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
