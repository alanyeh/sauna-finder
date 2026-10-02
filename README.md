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
   table to `src/data/saunas-prebuilt.json`. Vite emits it as a hashed JSON asset,
   separately from JavaScript. Bootstrap loads this snapshot before mounting React,
   retaining existing prerendered content while it downloads. If it fails, the
   data provider falls back to Supabase. Live refetches still refresh listings.
2. **`build`** → `vite build` — bundles the SPA into `dist/`.
3. **`postbuild`** → `scripts/prerender.js` — launches Puppeteer against a static
   server, renders every `/city/*` route + `/` to `dist/{route}/index.html`, then
   calls `scripts/generate-sitemap.js` to emit `dist/sitemap.xml` from
   `CITY_CONFIG`.

`npm run dev` runs `prefetch-saunas.js` first (via `predev`) for the same reason.

Home and city routes, maps, and dialogs use dynamic imports. Home visitors do not
download city-page or admin-dialog code. The snapshot still contains all listings;
moving it outside the bundle reduces JavaScript parsing, not the dataset size.

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

## Scraper validation

Run the offline regression suite with `node --test scripts/tests/*.test.js`.
It covers amenity evidence, Places pagination, bounded retries, and quota errors.

Preview enrichment with
`node scripts/enrich-saunas.js --dry-run --city=nyc --limit=20`.
Add `--refetch` to use fresh Google reviews (this consumes API quota even in
dry-run mode). The CSV includes supporting sentences for suggested amenities.
Automated enrichment does not mark records as verified or remove existing
amenities. Detection is deliberately conservative: contradictory, negative, or
future-tense mentions are withheld, and suggestions still need review.

To gather amenity evidence from official websites, run
`node scripts/enrich-saunas.js --dry-run --website --city=nyc --limit=10`.
This reads the saved website and up to two relevant linked pages, recording the
source URL with each suggested amenity. Requests have time and response-size
limits. On chain websites, links stay under the supplied location path.
If combined with `--refetch`, Google review details are fetched only when no
usable website page was returned. Static HTML extraction does not execute
JavaScript, read PDFs, or bypass access challenges; failures appear in the CSV.

`scripts/scrape-websites.js` now checks actual links and page headings instead
of guessing `/spa` URLs. Generic hotels, gyms, and spas need explicit sauna
text evidence to pass discovery; known sauna brands and sauna-named businesses
retain their existing discovery rules. Filtered candidates remain in the
discovery CSV for manual review.

Discovery now requests pagination tokens, so a search can make more requests
and return more results than before. Discovery and enrichment stop on quota
errors; transient server failures are retried at most twice.

Website crawling prioritizes sauna and facilities pages over pricing links and
follows relevant links discovered on subsequent pages within the same three-request
budget. File entry URLs (such as `/locations/nyc/index.html`) use their parent
directory as the location scope. Redirect destinations already fetched are skipped
without consuming another request; redirects outside the location are reported.

## Pricing research

Run `node scripts/scrape-pricing.js --city=nyc --limit=10` to research admission
prices from the websites in the local snapshot. This command never writes to
Supabase and does not use the Google Places API. Optional `--input=records.json`
and `--output=report.json` control the source records and report destination.

The crawler prioritizes pricing/admission links within a three-page limit per
listing. It extracts exact USD/CAD prices from visible text and JSON-LD offers,
preserving source URLs, evidence, stated duration, conditions, currency inference,
and check date. Every candidate is marked `needs_review`. Ranges, starting prices,
memberships, packages, and expired offers are not treated as exact admission
prices. Unresolved pricing text is retained in `review_snippets`, including
multi-column tables whose labels cannot be safely associated with amounts.

Check the source page, location, eligibility, taxes, and included facilities
before copying a candidate into a listing's pricing options. Sites that only
publish prices in booking widgets, JavaScript, or PDFs may return no candidates;
an empty result does not mean free admission or that existing prices are current.

## Listing quality and review

`/admin/review` is available to the admin account. It includes unpublished
records, source evidence, sauna access conditions, and duplicate references.
Public discovery excludes review, hidden, duplicate and seasonally closed rows.
Hotels require confirmed non-guest sauna access with both sauna and access
source URLs and checked dates. Day passes for pools or other amenities do not
qualify. Existing source-uncertain listings remain in a reversible review queue.

Apply `supabase/migrations/202610020001_listing_quality.sql` before using the
review controls on a new database. It adds quality fields, starts new imports
in review, and restricts publication changes to the existing admin account.
It preserves records and the existing public submission flow. The SQL admin
email and `src/lib/admin.js` allowlist must stay in sync.

Category aliases, publication validation and metro-distance checks live in
`src/lib/saunaQuality.js`. Discovery and the admin Places importer share their
classification rules. Discovery enforces its configured radius even with
`--no-filter`, because Google's location bias is not a geographic restriction.

Audit commands (read-only, with local evidence under gitignored `reports/`):

```bash
node scripts/audit-sauna-quality.js --out=reports/my-audit
node scripts/recheck-sauna-quality.js reports/my-audit
node scripts/summarize-sauna-quality.js reports/my-audit
node --test scripts/tests/*.test.js
```

The browser recheck retries inconclusive records with bounded static crawling
and ordinary rendering, without bypassing access challenges. Automated matches
remain review leads; a generic brand page or missing keyword does not establish
location-specific availability.

The October 2 cleanup decisions are in
`scripts/quality-decisions-2026-10-02.json`. The one-off
`node scripts/apply-sauna-quality.js` previews changes; `--apply` writes the
changed fields with concurrency checks and journals before/after values. Review
that plan before running it again, as it applies the dated audit decisions.
