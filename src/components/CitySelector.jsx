import { useEffect, useId, useRef, useState } from 'react';
import { CITY_CONFIG } from '../lib/cities';

const cities = [CITY_CONFIG.all, ...Object.values(CITY_CONFIG)
  .filter(city => city.slug !== 'all').sort((a, b) => a.fullName.localeCompare(b.fullName))];

export default function CitySelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const root = useRef(null);
  const trigger = useRef(null);
  const search = useRef(null);
  const listId = useId();
  const matches = cities.filter(city => `${city.fullName} ${city.label}`.toLowerCase().includes(query.trim().toLowerCase()));
  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  };
  const select = city => {
    close(true);
    onChange(city.slug);
  };
  useEffect(() => {
    if (!open) return;
    search.current?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, listId]);

  return <div ref={root} className="min-w-0" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) close();
  }}>
    <button ref={trigger} type="button" aria-label={`Choose a city, currently ${CITY_CONFIG[value]?.fullName || 'All Cities'}`}
      aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined}
      onClick={() => { setQuery(''); setActive(0); setOpen(!open); }}
      className="ui-button flex items-center gap-2 min-w-0 max-w-[145px] sm:max-w-[280px] text-xs">
      <span className="truncate">{CITY_CONFIG[value]?.fullName || 'All Cities'}</span>
      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
        <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
    {open && <div className="absolute top-full left-4 right-4 sm:left-auto sm:right-auto sm:w-80 mt-2 bg-cream border border-light-border rounded-sm shadow-lg overflow-hidden">
      <div className="p-3 border-b border-light-border">
        <input ref={search} type="search" role="combobox" aria-label="Search cities" aria-expanded="true"
          aria-controls={listId} aria-autocomplete="list" aria-activedescendant={matches[active] ? `${listId}-${active}` : undefined}
          value={query} placeholder="Search cities…" autoComplete="off"
          onChange={event => { setQuery(event.target.value); setActive(0); }}
          onKeyDown={event => {
            if (event.key === 'Escape') { event.preventDefault(); close(true); }
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              setActive(index => Math.max(0, Math.min(matches.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))));
            }
            if (event.key === 'Enter' && matches[active]) { event.preventDefault(); select(matches[active]); }
          }} className="ui-field w-full text-base sm:text-sm" />
      </div>
      <ul id={listId} role="listbox" aria-label="Cities" className="max-h-[min(360px,50dvh)] overflow-y-auto overscroll-contain p-1">
        {matches.map((city, index) => <li key={city.slug} id={`${listId}-${index}`} role="option"
          aria-selected={city.slug === value} onMouseDown={event => event.preventDefault()}
          onClick={() => select(city)} onMouseMove={() => setActive(index)}
          className={`flex items-center justify-between gap-3 px-3 py-3 text-sm cursor-pointer rounded-sm ${active === index ? 'bg-charcoal text-white' : 'text-charcoal'}`}>
          <span>{city.fullName}</span><span aria-hidden="true" className="shrink-0">{city.slug === value ? '✓' : ''}</span>
        </li>)}
      </ul>
      {!matches.length && <p role="status" className="px-4 pb-4 text-sm text-warm-gray">No cities found.</p>}
    </div>}
  </div>;
}
