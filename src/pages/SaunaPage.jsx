import ShopLink from '../components/ShopLink';
import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useSaunaData } from '../contexts/SaunaDataContext';
import { getCityFullName } from '../lib/cities';
import { saunaIdFromSlug, saunaPath } from '../lib/saunaRoutes';
import { validSource } from '../lib/saunaQuality';
import { amenityLabels } from '../lib/amenities';
import AccessDetails from '../components/AccessDetails';
import SEO from '../components/SEO';

const SITE = 'https://sauna-finder.koriboshi.com';

function Gallery({ photos, name }) {
  const [index, setIndex] = useState(0);
  if (!photos.length) return null;
  return <section aria-label={`Photos of ${name}`} className="mb-8">
    <img src={photos[index]} alt={`${name} — photo ${index + 1}`} className="w-full h-64 sm:h-96 object-cover rounded-sm bg-light-border" fetchPriority="high" />
    {photos.length > 1 && <div className="flex gap-2 overflow-x-auto py-3">
      {photos.map((photo, i) => <button key={`${photo}-${i}`} onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={index === i}
        className={`shrink-0 border-2 p-1 ${index === i ? 'border-charcoal' : 'border-transparent'}`}>
        <img src={photo} alt="" className="w-20 h-14 object-cover" loading="lazy" />
      </button>)}
    </div>}
  </section>;
}

export default function SaunaPage() {
  const { citySlug, saunaSlug } = useParams();
  const location = useLocation();
  const { saunas, loading } = useSaunaData();
  const [shareStatus, setShareStatus] = useState('');
  const sauna = saunas.find(row => String(row.id) === saunaIdFromSlug(saunaSlug));
  useEffect(() => { window.scrollTo(0, 0); setShareStatus(''); }, [saunaSlug]);
  if (loading) return <p className="p-8" role="status">Loading saunas…</p>;
  if (!sauna) return <main className="max-w-3xl mx-auto px-5 py-16">
    <SEO title="Sauna not found" description="This listing is unavailable. Browse available saunas and bathhouses." path={location.pathname} noindex />
    <h1 className="text-3xl mb-4">This sauna listing is unavailable</h1>
    <p className="text-warm-gray mb-6">It may have moved or is being reviewed.</p>
    <Link to="/" className="ui-button">Browse saunas</Link>
  </main>;

  const path = saunaPath(sauna);
  if (location.pathname.replace(/\/$/, '') !== path) return <Navigate to={path} replace />;
  const cityName = getCityFullName(citySlug);
  const photos = (sauna.photos?.length ? sauna.photos : [sauna.photo_url]).filter(validSource);
  const website = validSource(sauna.website_url) ? sauna.website_url : null;
  const description = sauna.description || `Explore ${sauna.name} in ${cityName}. View available amenities, admission information, and directions.`;
  const reviewCount = Number(sauna.rating_count ?? sauna.ratingCount);
  const rating = Number(sauna.rating);
  const hasRating = rating > 0 && rating <= 5 && reviewCount > 0;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${sauna.name} ${sauna.address || ''}`)}${sauna.place_id ? `&query_place_id=${encodeURIComponent(sauna.place_id)}` : ''}`;
  const hours = (sauna.hours || '').split(/,\s*(?=(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday):)|\n/).filter(Boolean);
  const checked = sauna.sauna_checked_at && Number.isFinite(Date.parse(sauna.sauna_checked_at))
    ? new Date(sauna.sauna_checked_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;
  const jsonLd = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'LocalBusiness', '@id': `${SITE}${path}#business`, name: sauna.name, url: `${SITE}${path}`, description,
        ...(sauna.address ? { address: sauna.address } : {}),
        ...(photos.length ? { image: photos } : {}),
        ...(website ? { sameAs: website } : {}),
        ...(hasRating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, ratingCount: reviewCount } } : {}),
        geo: { '@type': 'GeoCoordinates', latitude: sauna.lat, longitude: sauna.lng } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Sauna Finder', item: SITE },
        { '@type': 'ListItem', position: 2, name: cityName, item: `${SITE}/city/${citySlug}` },
        { '@type': 'ListItem', position: 3, name: sauna.name, item: `${SITE}${path}` },
      ] },
    ],
  };
  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: sauna.name, url: `${SITE}${path}` });
      else { await navigator.clipboard.writeText(`${SITE}${path}`); setShareStatus('Link copied'); }
    } catch (error) { if (error.name !== 'AbortError') setShareStatus('Copy the page address to share this listing.'); }
  }

  return <div className="min-h-screen bg-cream">
    <SEO title={`${sauna.name} — Sauna in ${cityName}`} description={description.slice(0, 160)} path={path} image={photos[0]} jsonLd={jsonLd} />
    <header className="border-b border-light-border px-5 sm:px-8 py-5 flex justify-between gap-4">
      <Link to="/" className="font-serif text-lg shrink-0 self-center">Sauna Finder</Link>
      <div className="flex items-center gap-6">
        <Link to={`/city/${citySlug}`} className="text-xs sm:text-sm text-right">Browse {cityName} →</Link>
      </div>
    </header>
    <main className="max-w-6xl mx-auto px-5 sm:px-8 py-8 sm:py-12" data-sauna-detail={sauna.id}>
      <nav aria-label="Breadcrumb" className="text-xs text-warm-gray flex flex-wrap gap-2 mb-7">
        <Link to="/">Home</Link><span aria-hidden="true">/</span><Link to={`/city/${citySlug}`}>{cityName}</Link><span aria-hidden="true">/</span><span aria-current="page">{sauna.name}</span>
      </nav>
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div><p className="text-xs uppercase tracking-widest text-warm-gray mb-3">{sauna.neighborhood || cityName}</p>
          <h1 className="font-serif text-3xl sm:text-5xl leading-tight mb-3">{sauna.name}</h1>
          <p className="text-sm text-warm-gray">{(sauna.types || []).join(' · ')}</p>
          {hasRating && <p className="text-sm mt-3"><span className="text-accent-red">★</span> {rating} <span className="text-warm-gray">({reviewCount.toLocaleString('en-US')} Google reviews)</span></p>}
        </div>
        <div className="self-start"><button onClick={share} className="ui-button">Share listing</button><p role="status" className="text-xs mt-2">{shareStatus}</p></div>
      </div>
      <Gallery key={sauna.id} photos={photos} name={sauna.name} />
      <div className="grid md:grid-cols-[minmax(0,1fr)_320px] gap-8 md:gap-12">
        <div className="space-y-8">
          <section><h2 className="font-serif text-2xl mb-3">About {sauna.name}</h2><p className="text-sm leading-7 text-warm-gray">{description}</p></section>
          <section><h2 className="font-serif text-2xl mb-3">Amenities</h2>
            {sauna.amenities?.some(a => amenityLabels[a]) ? <ul className="flex flex-wrap gap-2">{sauna.amenities.filter(a => amenityLabels[a]).map(a => <li key={a} className="amenity-badge">{amenityLabels[a]}</li>)}</ul> : <p className="text-sm text-warm-gray">Amenities have not been confirmed yet.</p>}
          </section>
          <section><h2 className="font-serif text-2xl mb-3">Admission & access</h2>
            <AccessDetails sauna={sauna} />
            {(!sauna.access_policy || sauna.access_policy === 'unknown') && <p className="text-sm text-warm-gray mb-3">Check with the venue for booking and access requirements.</p>}
            {sauna.gender_policy && <p className="text-sm mb-3">{sauna.gender_policy}</p>}
            {sauna.pricing_options?.length ? <ul className="divide-y divide-light-border">{sauna.pricing_options.map((option, i) => <li key={i} className="py-3 text-sm flex justify-between gap-4">
              <span>{option.duration || 'Admission'}{option.description && <span className="block text-xs text-warm-gray mt-1">{option.description}</span>}</span>
              <span className="shrink-0">{option.currency || (['toronto', 'vancouver'].includes(citySlug) ? 'CAD' : 'USD')} ${option.price}</span>
            </li>)}</ul> : <p className="text-sm text-warm-gray">Admission prices are not listed yet.</p>}
            <p className="text-xs text-warm-gray mt-3">Confirm current pricing and what’s included with the venue before visiting.</p>
          </section>
          {checked && <p className="text-xs text-warm-gray border-t border-light-border pt-5">Sauna information checked {checked}.{validSource(sauna.sauna_source_url) && <> <a href={sauna.sauna_source_url} target="_blank" rel="noopener noreferrer" className="underline">View source ↗</a></>}</p>}
        </div>
        <aside className="border border-light-border bg-white p-6 self-start space-y-6">
          <section><h2 className="font-serif text-xl mb-3">Plan your visit</h2>{sauna.address && <p className="text-sm leading-6 text-warm-gray">{sauna.address}</p>}</section>
          <div className="flex flex-col gap-3">
            {website && <a href={website} target="_blank" rel="noopener noreferrer" className="ui-button bg-charcoal text-white text-center">Visit official website ↗</a>}
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="ui-button text-center">Get directions ↗</a>
            <Link to={`/city/${citySlug}`} state={{ selectedSaunaId: sauna.id }} className="text-xs underline text-center">Show on city map</Link>
          </div>
          <section><h2 className="font-serif text-xl mb-3">Hours</h2>{hours.length ? <ul className="text-xs text-warm-gray leading-6">{hours.map((line, i) => <li key={i}>{line}</li>)}</ul> : <p className="text-sm text-warm-gray">Check the official website for hours.</p>}</section>
        </aside>
      </div>
      <footer className="mt-12 pt-6 border-t border-light-border space-y-5">
        <Link to={`/city/${citySlug}`} className="text-sm underline">Explore more saunas in {cityName} →</Link>
        <div className="text-center pt-4">
          <p className="text-xs text-warm-gray mb-2">Sauna Finder by Koriboshi</p>
          <ShopLink />
        </div>
      </footer>
    </main>
  </div>;
}
