// One-off: insert Park City saunas from a scrape-saunas.js dry-run CSV report.
//
// Needed because the Google Places daily quota (100 req/day on this project)
// was exhausted before the insert run — the dry-run report already has all
// fields except lat/lng (geocoded here via OSM Nominatim), hours, price, and
// photos. Backfill photos with scripts/scrape-photos.js after quota reset.
//
// Usage: node scripts/insert-park-city-from-report.js <report.csv> [--dry-run]

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config({ path: '.env.local' })

const CITY_SLUG = 'park-city'
// Huntsville Sauna — real place, but ~55mi north near Ogden, outside the area
const EXCLUDE_PLACE_IDS = new Set(['ChIJ84WMDYKnU4cRcpqForCWprA'])

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function geocodeOnce(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'User-Agent': 'sauna-finder-data-pipeline (contact: admin@koriboshi.com)' } })
  if (!res.ok) return null
  const json = await res.json()
  if (!json[0]) return null
  return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) }
}

async function geocode(address, name) {
  // Nominatim fails on suite/unit designators and some abbreviations —
  // try progressively simplified variants. 1 req/sec fair-use between tries.
  const noSuite = address
    .replace(/\b(Ste\.?|Suite|Unit|Bldg\.?)\s*[\w-]+,?/gi, '')
    .replace(/#\s*[\w-]+,?/g, '')
    .replace(/\s+,/g, ',').replace(/\s{2,}/g, ' ').trim()
  const cityStateZip = address.split(',').slice(-3).join(',').trim()
  const variants = [...new Set([address, noSuite, `${name}, ${cityStateZip}`])]
  for (const q of variants) {
    const coords = await geocodeOnce(q)
    await sleep(1100)
    if (coords) return coords
  }
  return null
}

async function main() {
  const [reportPath] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
  const dryRun = process.argv.includes('--dry-run')
  if (!reportPath) {
    console.error('Usage: node scripts/insert-park-city-from-report.js <report.csv> [--dry-run]')
    process.exit(1)
  }

  const rows = parseCsv(readFileSync(reportPath, 'utf8'))
  const header = rows[0]
  const col = (n) => header.indexOf(n)
  const newRows = rows.slice(1).filter((r) => r[col('status')] === 'NEW' && !EXCLUDE_PLACE_IDS.has(r[col('place_id')]))
  console.log(`${newRows.length} NEW rows to insert (excluded ${rows.slice(1).filter((r) => EXCLUDE_PLACE_IDS.has(r[col('place_id')])).length})`)

  const records = []
  for (const r of newRows) {
    const name = r[col('name')]
    const address = r[col('address')]
    process.stdout.write(`  geocoding: ${name}…`)
    const coords = await geocode(address, name)
    if (!coords) {
      // fall back to zip-level geocode
      const zip = (address.match(/\b(\d{5})\b/) || [])[1]
      if (zip) {
        const res = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (res.ok) {
          const j = await res.json()
          const p = j.places?.[0]
          if (p) {
            records.push(makeRecord(r, col, { lat: parseFloat(p.latitude), lng: parseFloat(p.longitude) }))
            console.log(` zip-level fallback (${zip})`)
            continue
          }
        }
      }
      console.log(' FAILED — skipping')
      continue
    }
    console.log(` ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`)
    records.push(makeRecord(r, col, coords))
  }

  console.log(`\n${records.length}/${newRows.length} records ready`)
  if (dryRun) {
    console.log('[DRY RUN] skipping insert')
    console.log(JSON.stringify(records[0], null, 2))
    return
  }

  const { data, error } = await supabase.from('saunas').insert(records).select('id, name')
  if (error) {
    console.error('Insert error:', error.message)
    process.exit(1)
  }
  for (const d of data) console.log(`  Inserted ID ${d.id}: ${d.name}`)
  console.log(`\nInserted ${data.length} saunas with city_slug="${CITY_SLUG}"`)
  console.log('Next (after Places quota resets): node scripts/scrape-photos.js to backfill photos/hours')
}

function makeRecord(r, col, coords) {
  const split = (s) => (s ? s.split(';').map((x) => x.trim()).filter(Boolean) : [])
  return {
    name: r[col('name')],
    address: r[col('address')],
    neighborhood: r[col('neighborhood')] || '',
    lat: coords.lat,
    lng: coords.lng,
    rating: parseFloat(r[col('rating')]) || null,
    rating_count: parseInt(r[col('reviews')], 10) || null,
    price: null,
    types: split(r[col('types')]),
    amenities: split(r[col('amenities')]),
    hours: '',
    place_id: r[col('place_id')],
    description: r[col('description')] || '',
    city_slug: CITY_SLUG,
    photos: null,
    website_url: r[col('website')] || null,
    gender_policy: null,
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
