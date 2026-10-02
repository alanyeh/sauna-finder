import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSaunaData } from '../contexts/SaunaDataContext';
import { isAdmin } from '../lib/admin';
import { isPublicSauna, isHotelSauna, ACCESS_LABELS } from '../lib/saunaQuality';
import AdminEditModal from '../components/AdminEditModal';
import { Helmet } from 'react-helmet-async';

export default function ReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const { allSaunas, loading, refetchSaunas } = useSaunaData();
  const [filter, setFilter] = useState('review');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const rows = useMemo(() => allSaunas.filter(row => {
    if (filter === 'review' && isPublicSauna(row) && row.sauna_source_url) return false;
    if (filter === 'hotels' && !isHotelSauna(row)) return false;
    if (filter === 'published' && !isPublicSauna(row)) return false;
    return `${row.name} ${row.city_slug} ${row.review_notes || ''}`.toLowerCase().includes(query.toLowerCase());
  }), [allSaunas,filter,query]);
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Helmet><title>Listing review | Sauna Finder</title><meta name="robots" content="noindex,nofollow" /></Helmet>
      <Link to="/" className="text-sm">← Sauna Finder</Link>
      <h1 className="text-3xl mt-6 mb-3">Listing review</h1>
      {authLoading || loading ? <p role="status">Loading listings…</p> : !isAdmin(user) ? (
        <p>Sign in with the admin account on the home page to review listings.</p>
      ) : <>
        <p className="text-sm text-warm-gray mb-6">Hidden listings remain saved. Review evidence and access conditions before publishing.</p>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input className="ui-field" aria-label="Search review listings" placeholder="Search name, city or review notes" value={query} onChange={e=>setQuery(e.target.value)} />
          <select className="ui-field sm:max-w-xs" aria-label="Review queue" value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="review">Needs review</option><option value="hotels">Hotel access</option>
            <option value="published">Published</option><option value="all">All records</option>
          </select>
        </div>
        <p className="text-xs text-warm-gray mb-4">{rows.length} listings</p>
        <div className="space-y-3">
          {rows.map(row=><article key={row.id} className="border border-light-border bg-white p-5">
            <div className="flex justify-between items-start gap-4">
              <div><h2 className="text-lg">{row.name}</h2><p className="text-xs text-warm-gray mt-2">#{row.id} · {row.city_slug} · {row.listing_status || 'active'}</p></div>
              <button className="ui-button" onClick={()=>setEditing(row)}>Review</button>
            </div>
            <p className="text-xs mt-3">{(row.types || []).join(', ') || 'No category'} · {ACCESS_LABELS[row.access_policy] || 'Access not confirmed'}</p>
            {row.review_notes && <p className="text-xs text-warm-gray mt-3">{row.review_notes}</p>}
            {row.duplicate_of && <p className="text-xs mt-2">Canonical listing: #{row.duplicate_of}</p>}
          </article>)}
        </div>
        {editing && <AdminEditModal sauna={editing} onClose={()=>setEditing(null)} onSaunaUpdated={refetchSaunas} />}
      </>}
    </main>
  );
}
