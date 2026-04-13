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

const { data, error } = await supabase
  .from('saunas')
  .select('*')
  .order('id', { ascending: true })

if (error) {
  console.error('[prefetch-saunas] Supabase error:', error)
  process.exit(1)
}

const outPath = resolve(__dirname, '..', 'src', 'data', 'saunas-prebuilt.json')
await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, JSON.stringify(data, null, 2), 'utf8')

console.log(`[prefetch-saunas] Wrote ${data.length} saunas → src/data/saunas-prebuilt.json`)
