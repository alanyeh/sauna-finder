# Sauna Finder — Project Overview

A curated sauna and bathhouse discovery app for major US cities, built as a modern single-page React application with a Japanese-inspired minimal aesthetic.

**Live data is stored in Supabase. At build time `scripts/prefetch-saunas.js` snapshots it to `src/data/saunas-prebuilt.json` so prerender and the client's first render share identical data (no hydration mismatch).**

---

## Tech Stack

| Layer        | Technology                                      |
| ------------ | ----------------------------------------------- |
| Framework    | React 18 (functional components, hooks)         |
| Build        | Vite 5 (dev server on port 3000)                |
| Styling      | Tailwind CSS 3 + PostCSS                        |
| Maps         | Google Maps via `@vis.gl/react-google-maps`      |
| Database     | Supabase (Postgres) — table: `saunas`           |
| Auth         | Supabase Auth (email/password + Google OAuth)    |
| Storage      | Supabase Storage (sauna photo uploads)           |
| Fonts        | Libre Baskerville (serif headings), IBM Plex Mono (body) |

---

## Project Structure

```
src/
├── App.jsx                 # Router (/ and /city/:citySlug) + layout shell
├── main.jsx                # React entry point
├── index.css               # Tailwind directives + custom styles
├── supabase.js             # Supabase client init
│
├── pages/
│   ├── HomePage.jsx        # "/" — geolocated city carousels + category grid
│   └── CityPage.jsx        # "/city/:citySlug" — list + map + SEO content
│
├── components/             # Header, Sidebar, SaunaList, SaunaCard, HomeSaunaCard,
│                           # Filters, Map, BottomSheet, PhotoCarousel, AuthModal,
│                           # SEO, CitySEOContent, ClientOnly, Submit/Admin modals
│
├── hooks/
│   ├── useFilters.js       # Filter logic: neighborhood, price, type, amenities
│   ├── useFavorites.js     # Favorites: localStorage + Supabase, requires auth
│   └── useGeolocation.js   # Closest-city detection for the homepage
│
├── contexts/
│   ├── AuthContext.jsx     # Global auth state via React Context
│   └── SaunaDataContext.jsx# Sauna data: prebuilt snapshot → live Supabase refetch
│
├── lib/
│   ├── cities.js           # CITY_CONFIG — single source of truth for cities
│   ├── cityContent.js      # Per-city SEO prose + FAQs
│   ├── amenities.js        # Amenity display labels
│   └── admin.js            # Admin email allowlist
│
└── data/
    └── saunas-prebuilt.json# Build-time Supabase snapshot (gitignored)

scripts/
├── prefetch-saunas.js      # Supabase → saunas-prebuilt.json (runs pre dev/build)
├── prerender.js            # Puppeteer prerender of every route (postbuild)
├── generate-sitemap.js     # dist/sitemap.xml from CITY_CONFIG
├── scrape-saunas.js        # Google Places scraper for new cities
├── scrape-photos.js        # Fetch + upload sauna photos to Supabase Storage
├── enrich-saunas.js        # Backfill/enrich existing records
├── populate-pricing.js     # Populate day-pass pricing_options
└── archive/                # One-off per-city insert/lookup scripts
```

---

## Data Model

Each sauna record in the `saunas` Supabase table:

```
id              integer        Auto-generated PK
name            text           Business name
address         text           Full street address
neighborhood    text           City neighborhood
lat / lng       decimal        Coordinates for map pin
rating          decimal(0-5)   Google rating
rating_count    integer        Number of Google reviews
price           text           "$" | "$$" | "$$$"
types           json[]         e.g. ["Modern Bathhouse", "Korean Spa", "Gym Sauna"]
amenities       json[]         e.g. ["cold_plunge", "steam_room", "massage", "pool", "coed", "private"]
hours           text           Operating hours
place_id        text           Google Place ID (for photo scraping)
description     text           One-sentence summary
city_slug       text           City key, e.g. "nyc" — see CITY_CONFIG in src/lib/cities.js
photos          json[]         Array of Supabase Storage URLs
website_url     text           Business website (optional)
gender_policy   text           Gender restrictions (optional)
created_at      timestamp      Auto-generated
updated_at      timestamp      Auto-generated
```

---

## Key Features

- **Multi-city support** — 11 cities defined in `src/lib/cities.js` (`CITY_CONFIG`), each served at `/city/:citySlug`; filters reset on city change
- **Filtering** — by neighborhood, price tier, sauna type, and amenities (all must match)
- **Favorites** — heart toggle per card, persisted to localStorage keyed by user ID, requires auth
- **Interactive map** — Google Maps with red marker pins; clicking a pin highlights the card
- **Photo carousel** — per-card image slider with prev/next, dot indicators, counter
- **Responsive layout** — desktop: sidebar + map side-by-side; mobile: toggle between list/map views
- **Authentication** — Supabase Auth with Google OAuth; profile avatar in header

---

## Environment Variables

Stored in `.env.local` (not committed):

```
VITE_SUPABASE_URL=https://oqwwxfecnrspcjjwrylx.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
GOOGLE_PLACES_API_KEY=<for photo scraping script>
SUPABASE_SERVICE_KEY=<for admin writes>
```

`VITE_`-prefixed vars are exposed to the client bundle by Vite.

---

## Scripts

| Command           | What it does                                |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Prefetch Supabase data, then Vite dev server on `localhost:3000` |
| `npm run build`   | `prebuild` prefetch → `vite build` → `postbuild` prerender + sitemap → `dist/` |
| `npm run preview` | Preview production build locally            |
| `npm run lint`    | ESLint over `src/` and `scripts/`           |
| `node scripts/prefetch-saunas.js` | Snapshot Supabase `saunas` → `src/data/saunas-prebuilt.json` |
| `node scripts/scrape-photos.js` | Scrape Google Places photos → Supabase Storage |

---

## Design System

- **Palette:** cream background, charcoal text, warm-gray accents, accent-red for highlights
- **Typography:** Libre Baskerville for headings (serif), IBM Plex Mono for body (mono)
- **Aesthetic:** Minimal, Japanese-inspired, warm neutrals
- **Tailwind custom tokens** defined in `tailwind.config.js`: `cream`, `charcoal`, `warm-gray`, `accent-red`, `light-border`, `hover-bg`

---

## Architecture Notes

- **No custom backend server** — Supabase handles DB, auth, and file storage
- **State management** — React Context for auth; hooks (`useFilters`, `useFavorites`) for feature logic; component-level state for UI
- **Map** uses `AdvancedMarker` with uncontrolled center/zoom to avoid re-render panning issues
- **Mobile map** uses greedy gesture handling so touch panning works without two-finger requirement
- **Adding a new city** — add a `CITY_CONFIG` entry in `src/lib/cities.js`, insert Supabase rows with that `city_slug`, and write a `cityContent.js` prose+FAQ block; prerender and the sitemap pick it up automatically

---

## Data Pipeline

1. Research saunas via Yelp/Google for a city
2. Find each location's Google Place ID and coordinates
3. Insert records into Supabase via REST API (see `SCRAPING_GUIDE.md`)
4. Run `scripts/scrape-photos.js` to auto-fetch and upload photos
5. Photos are stored in Supabase Storage bucket `sauna-photos/public/`

---

## Deployment

Recommended: **Vercel** (`npm run build` then `vercel --prod`). Alternatives: Netlify (drag `dist/`), GitHub Pages. Set all `VITE_` env vars in the hosting platform's dashboard.
