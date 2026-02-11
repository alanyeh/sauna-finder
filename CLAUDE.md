# Sauna Finder — Project Overview

A curated sauna and bathhouse discovery app for major US cities, built as a modern single-page React application with a Japanese-inspired minimal aesthetic.

**Live data is stored in Supabase. Hardcoded data in `src/data/saunas.js` exists only as a fallback/reference.**

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
├── App.jsx                 # Root component — layout, city/view state
├── main.jsx                # React entry point
├── index.css               # Tailwind directives + custom styles
├── supabase.js             # Supabase client init
│
├── components/
│   ├── Header.jsx          # Title bar, city toggle (NYC/SF), user avatar
│   ├── Sidebar.jsx         # Left panel container (420px desktop)
│   ├── SaunaList.jsx       # Scrollable list with collapsing header on scroll
│   ├── SaunaCard.jsx       # Card: photo carousel, name, rating, price, address, amenities
│   ├── Filters.jsx         # Filter modal (bottom sheet on mobile)
│   ├── Map.jsx             # Google Maps with AdvancedMarker pins
│   ├── PhotoCarousel.jsx   # Multi-image carousel with dots/arrows
│   └── AuthModal.jsx       # Sign-in / sign-up modal
│
├── hooks/
│   ├── useFilters.js       # Filter logic: neighborhood, price, type, amenities
│   └── useFavorites.js     # Favorites: localStorage + Supabase, requires auth
│
├── contexts/
│   └── AuthContext.jsx     # Global auth state via React Context
│
└── data/
    └── saunas.js           # 51 hardcoded entries (fallback/reference only)

scripts/
└── scrape-photos.js        # Fetches photos from Google Places API → Supabase Storage
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
city_slug       text           "nyc" | "sf" (multi-city key)
photos          json[]         Array of Supabase Storage URLs
website_url     text           Business website (optional)
gender_policy   text           Gender restrictions (optional)
created_at      timestamp      Auto-generated
updated_at      timestamp      Auto-generated
```

---

## Key Features

- **Multi-city support** — toggle between NYC and SF via `city_slug`; filters reset on city change
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
| `npm run dev`     | Start Vite dev server on `localhost:3000`    |
| `npm run build`   | Production build → `dist/`                  |
| `npm run preview` | Preview production build locally            |
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
- **Adding a new city** — insert rows with a new `city_slug` value; the UI city toggle in `Header.jsx` needs a new button

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
