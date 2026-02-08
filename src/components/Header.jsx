import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <div className="px-7 py-8 pb-6 border-b border-light-border">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[28px] leading-tight tracking-tight mb-2">
            NYC Sauna Finder
          </h1>
          <p className="text-[13px] text-warm-gray font-light tracking-wide">
            Discover the city's finest saunas & bathhouses
          </p>
        </div>

        <div className="flex-shrink-0 mt-1">
          {user && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent-red text-white flex items-center justify-center text-sm font-medium">
                {(user.user_metadata?.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="text-[12px] text-warm-gray hover:text-charcoal transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
