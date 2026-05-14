# Koriboshi Sauna Finder

A curated sauna and bathhouse discovery app for major US and Canadian cities.
Powers [sauna-finder.koriboshi.com](https://sauna-finder.koriboshi.com) — a free
tool and SEO surface for the Koriboshi sauna-hat brand.

Built as a React single-page app with **build-time prerendering**, so every city
page ships as fully-rendered static HTML that search engines and AI crawlers can
index — while staying a fast SPA for real users.

## Tech stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Framework | React 18 (functional components, hooks)                 |
| Routing   | React Router 7 — `/` and `/city/:citySlug`              |
| Build     | Vite 5; Puppeteer prerender as a postbuild step         |
| Styling   | Tailwind CSS 3 + PostCSS                                |
| Maps      | Google Maps via `@vis.gl/react-google-maps`             |
| Data      | Supabase (Postgres `saunas` table), snapshotted at build |
| Auth      | Supabase Auth (email/password + Google OAuth)           |
| Hosting   | Vercel                                                  |

Cities are defined in `src/lib/cities.js` (`CITY_CONFIG`) — currently 11: NYC, SF,
Chicago, Seattle, LA, Minneapolis, Portland, Denver, Houston, Vancouver, Toronto.

## Quick start

```bash
npm install
# create .env.local (see below)
npm run dev          # http://localhost:3000
```

`.env.local` (gitignored) — copy `.env.example` and fill in the client vars:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public anon key>
VITE_GOOGLE_MAPS_API_KEY=<browser key, referrer-restricted in Google Cloud>
```

The Google **Places** API key is not a frontend variable — it lives only as the
`GOOGLE_PLACES_API_KEY` secret on the `places-proxy` Supabase Edge Function
(`supabase/functions/places-proxy/`), which the admin "Add Sauna" flow calls.

## Build pipeline

`npm run build` runs three stages — the `pre`/`post` hooks fire automatically:

1. **`prebuild`** → `scripts/prefetch-saunas.js` — snapshots the Supabase `saunas`
   table to `src/data/saunas-prebuilt.json` so prerender and the client's first
   render start from identical data (no hydration mismatch).
2. **`build`** → `vite build` — bundles the SPA into `dist/`.
3. **`postbuild`** → `scripts/prerender.js` — launches Puppeteer against a static
   server, renders every `/city/*` route + `/` to `dist/{route}/index.html`, then
   calls `scripts/generate-sitemap.js` to emit `dist/sitemap.xml` from
   `CITY_CONFIG`.

`npm run dev` runs `prefetch-saunas.js` first (via `predev`) for the same reason.

## Project structure

```
src/
├── App.jsx                      # Router + layout shell
├── main.jsx                     # React entry point
├── supabase.js                  # Supabase client init
├── pages/
│   ├── HomePage.jsx             # "/" — geolocated city carousels + category grid
│   └── CityPage.jsx             # "/city/:citySlug" — list + map + SEO content
├── components/                  # SaunaCard, Map, Filters, SEO, CitySEOContent, …
├── contexts/
│   ├── AuthContext.jsx          # Supabase auth state
│   └── SaunaDataContext.jsx     # Sauna data: prebuilt snapshot → live refetch
├── hooks/                       # useFilters, useFavorites, useGeolocation
├── lib/
│   ├── cities.js                # CITY_CONFIG — single source of truth for cities
│   ├── cityContent.js           # Per-city SEO prose + FAQs
│   ├── amenities.js             # Amenity display labels
│   └── admin.js                 # Admin email allowlist
└── data/
    └── saunas-prebuilt.json     # Build-time Supabase snapshot (gitignored)

scripts/
├── prefetch-saunas.js           # Supabase → saunas-prebuilt.json (pre dev/build)
├── prerender.js                 # Puppeteer prerender (postbuild)
├── generate-sitemap.js          # dist/sitemap.xml from CITY_CONFIG
├── scrape-saunas.js             # Google Places scraper for new cities
├── scrape-photos.js             # Fetch + upload sauna photos to Supabase Storage
├── enrich-saunas.js             # Backfill/enrich existing records
├── populate-pricing.js          # Populate day-pass pricing_options
└── archive/                     # One-off per-city insert/lookup scripts
```

## Scripts

| Command            | What it does                                  |
| ------------------ | --------------------------------------------- |
| `npm run dev`      | Prefetch data, then Vite dev server on :3000   |
| `npm run build`    | Prefetch → Vite build → prerender + sitemap    |
| `npm run preview`  | Serve the production `dist/` build locally     |
| `npm run lint`     | ESLint over `src/` and `scripts/`              |

## Deployment

Deploys to **Vercel**. Set the `VITE_` env vars in the Vercel project dashboard.
`vercel.json` rewrites unknown routes to `index.html` for client-side routing;
prerendered `dist/city/*/index.html` files are served directly by the filesystem.

See `CLAUDE.md` for deeper architecture notes and the data model.
