// Build-time sauna data snapshot.
//
// Runs before `vite build` (via prebuild npm script). Fetches all saunas from
// Supabase and writes them to src/data/saunas-prebuilt.json. That file is
// imported by SaunaDataContext so the initial React render — both during
// prerendering and during client hydration — starts from the same data.
//
// This fixes hydration mismatches: without it, prerender has real saunas
// baked in while the client's first render has an empty array (Supabase
// hasn't responded yet), causing every city page's sauna count, list items,
// and JSON-LD to differ.
//
// After hydration, SaunaDataContext still refetches from live Supabase, so
// newly-added saunas show up for real users between deploys.
//
// The snapshot is validated before writing: a broken dataset here would be
// baked into the prerendered HTML that crawlers index, so fail the build
// loudly instead of shipping it.

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as loadDotenv } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: resolve(__dirname, '..', '.env.local') })

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('[prefetch-saunas] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY missing — cannot prebuild sauna data.')
  process.exit(1)
}

const supabase = createClient(url, key)

// Supabase caps a single select at 1,000 rows and truncates silently beyond
// that, so page through with .range() instead of one select.
const PAGE_SIZE = 1000
const saunas = []
for (let from = 0; ; from += PAGE_SIZE) {
  const { data, error } = await supabase
    .from('saunas')
    .select('*')
    .order('id', { ascending: true })
    .range(from, from + PAGE_SIZE - 1)

  if (error) {
    console.error('[prefetch-saunas] Supabase error:', error)
    process.exit(1)
  }
  saunas.push(...data)
  if (data.length < PAGE_SIZE) break
}

// ─── Validation gate ────────────────────────────────────────────────────────
const MIN_TOTAL_ROWS = 100 // catastrophic-loss floor; well below the ~374 live rows
const errors = []
const warnings = []

if (saunas.length < MIN_TOTAL_ROWS) {
  errors.push(`only ${saunas.length} rows fetched (expected at least ${MIN_TOTAL_ROWS}) — refusing to bake a gutted dataset into the site`)
}

const seenPlaceIds = new Map()
for (const s of saunas) {
  if (!s.name) errors.push(`row id=${s.id} has no name`)
  if (!s.city_slug) warnings.push(`"${s.name}" (id=${s.id}) has no city_slug — it will not appear on any city page`)
  if (s.lat == null || s.lng == null) warnings.push(`"${s.name}" (id=${s.id}) is missing lat/lng — it will not appear on the map`)
  if (s.place_id) {
    const prior = seenPlaceIds.get(s.place_id)
    if (prior) errors.push(`duplicate place_id ${s.place_id}: "${prior.name}" (id=${prior.id}) and "${s.name}" (id=${s.id})`)
    seenPlaceIds.set(s.place_id, s)
  }
}

for (const w of warnings) console.warn(`[prefetch-saunas] WARN: ${w}`)
if (errors.length > 0) {
  for (const e of errors) console.error(`[prefetch-saunas] ERROR: ${e}`)
  console.error(`[prefetch-saunas] Validation failed (${errors.length} error${errors.length === 1 ? '' : 's'}) — build aborted.`)
  process.exit(1)
}

// Strip fields the UI never reads so they don't ride in the client bundle.
// (The live client refetch still returns full rows, so admin editing keeps
// access to every column.)
const slimmed = saunas.map(({ created_at, updated_at, ...rest }) => rest)

const outPath = resolve(__dirname, '..', 'src', 'data', 'saunas-prebuilt.json')
await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, JSON.stringify(slimmed, null, 2), 'utf8')

const cityCount = new Set(slimmed.map((s) => s.city_slug)).size
console.log(`[prefetch-saunas] Wrote ${slimmed.length} saunas across ${cityCount} cities → src/data/saunas-prebuilt.json${warnings.length ? ` (${warnings.length} warnings)` : ''}`)
