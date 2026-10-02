// Cross-reference Shopify order locations with sauna locations to build a
// B2B outreach list.
//
// Inputs:
//   data/shopify-orders.csv        Shopify order export (shipping columns)
//   src/data/saunas-prebuilt.json  Sauna snapshot (run prefetch-saunas.js to refresh)
//
// Outputs:
//   data/outreach-list.csv   Saunas ranked by nearby customer order density
//   data/coverage-gaps.csv   Order clusters with no sauna within 50 miles
//   data/zip-centroids.json  Zip → lat/lng cache (safe to delete; refetches)
//
// Usage: node scripts/outreach-match.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const ORDERS_CSV = path.join(ROOT, 'data/shopify-orders.csv')
const SAUNAS_JSON = path.join(ROOT, 'src/data/saunas-prebuilt.json')
const ZIP_CACHE = path.join(ROOT, 'data/zip-centroids.json')
const OUT_LIST = path.join(ROOT, 'data/outreach-list.csv')
const OUT_GAPS = path.join(ROOT, 'data/coverage-gaps.csv')

const RADII_MI = [10, 25, 50]

// --- CSV helpers -----------------------------------------------------------

function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (c === '"') inQuotes = false
      else field += c
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((f) => f !== '')) rows.push(row)
      row = []
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows
}

function toCsv(rows) {
  return rows
    .map((r) => r.map((v) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','))
    .join('\n') + '\n'
}

// --- Geo helpers -----------------------------------------------------------

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

const COUNTRY_CODES = { 'United States': 'us', Canada: 'ca' }

async function geocodeZip(zip, countryCode, cache) {
  const key = `${countryCode}:${zip}`
  if (cache[key] !== undefined) return cache[key]
  const url = `https://api.zippopotam.us/${countryCode}/${encodeURIComponent(zip)}`
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    const place = json.places?.[0]
    cache[key] = place
      ? { lat: parseFloat(place.latitude), lng: parseFloat(place.longitude) }
      : null
  } catch (err) {
    console.warn(`  ⚠ geocode failed for ${key}: ${err.message}`)
    cache[key] = null
  }
  return cache[key]
}

// --- Main ------------------------------------------------------------------

async function main() {
  // 1. Parse and dedupe orders. Shopify exports one row per adjustment
  //    (refunds show as extra rows with negative sales), so collapse by
  //    Order ID and net the sales.
  const rows = parseCsv(fs.readFileSync(ORDERS_CSV, 'utf8'))
  const header = rows[0]
  const col = (name) => {
    const i = header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase())
    if (i === -1) throw new Error(`Column "${name}" not found in ${ORDERS_CSV}`)
    return i
  }
  const cId = col('Order ID')
  const cCity = col('Shipping city')
  const cRegion = col('Shipping region')
  const cCountry = col('Shipping country')
  const cZip = col('Shipping postal code')
  const cSales = col('Total sales')

  const orders = new Map()
  for (const r of rows.slice(1)) {
    const id = r[cId]
    const existing = orders.get(id)
    if (existing) {
      existing.sales += parseFloat(r[cSales]) || 0
    } else {
      orders.set(id, {
        id,
        city: r[cCity],
        region: r[cRegion],
        country: r[cCountry],
        // US: strip zip+4 suffix. Canada: Zippopotam only resolves the
        // 3-char FSA prefix, not the full postal code.
        zip: r[cCountry] === 'Canada'
          ? (r[cZip] || '').trim().slice(0, 3).toUpperCase()
          : (r[cZip] || '').split('-')[0].trim(),
        sales: parseFloat(r[cSales]) || 0,
      })
    }
  }
  console.log(`Parsed ${rows.length - 1} rows → ${orders.size} unique orders`)

  // 2. Group orders by zip and geocode each zip to a centroid.
  const zipGroups = new Map()
  for (const o of orders.values()) {
    const cc = COUNTRY_CODES[o.country]
    if (!cc || !o.zip) {
      console.warn(`  ⚠ skipping order ${o.id}: unsupported country/zip (${o.country} ${o.zip})`)
      continue
    }
    const key = `${cc}:${o.zip}`
    const g = zipGroups.get(key) || {
      zip: o.zip, cc, city: o.city, region: o.region, orders: 0, sales: 0,
    }
    g.orders += 1
    g.sales += o.sales
    zipGroups.set(key, g)
  }

  const cache = fs.existsSync(ZIP_CACHE) ? JSON.parse(fs.readFileSync(ZIP_CACHE, 'utf8')) : {}
  console.log(`Geocoding ${zipGroups.size} unique zips…`)
  for (const g of zipGroups.values()) {
    g.coords = await geocodeZip(g.zip, g.cc, cache)
  }
  fs.writeFileSync(ZIP_CACHE, JSON.stringify(cache, null, 2))
  const located = [...zipGroups.values()].filter((g) => g.coords)
  console.log(`  ${located.length}/${zipGroups.size} zips geocoded`)

  // 3. Score each sauna by nearby order density.
  const saunas = JSON.parse(fs.readFileSync(SAUNAS_JSON, 'utf8'))
  const saunaList = Array.isArray(saunas) ? saunas : saunas.saunas
  const scored = saunaList
    .filter((s) => s.lat != null && s.lng != null)
    .map((s) => {
      const counts = Object.fromEntries(RADII_MI.map((r) => [r, { orders: 0, sales: 0 }]))
      let nearest = Infinity
      for (const g of located) {
        const d = haversineMiles(s.lat, s.lng, g.coords.lat, g.coords.lng)
        nearest = Math.min(nearest, d)
        for (const r of RADII_MI) {
          if (d <= r) { counts[r].orders += g.orders; counts[r].sales += g.sales }
        }
      }
      return { sauna: s, counts, nearest }
    })
    .filter((x) => x.counts[50].orders > 0)
    .sort((a, b) =>
      b.counts[25].orders - a.counts[25].orders ||
      b.counts[50].orders - a.counts[50].orders ||
      a.nearest - b.nearest
    )

  const listRows = [[
    'sauna', 'city_slug', 'neighborhood', 'rating', 'rating_count', 'website',
    'orders_within_10mi', 'orders_within_25mi', 'orders_within_50mi',
    'sales_within_25mi', 'nearest_customer_mi', 'place_id',
  ]]
  for (const { sauna: s, counts, nearest } of scored) {
    listRows.push([
      s.name, s.city_slug, s.neighborhood, s.rating, s.rating_count, s.website_url || '',
      counts[10].orders, counts[25].orders, counts[50].orders,
      counts[25].sales.toFixed(2), nearest.toFixed(1), s.place_id || '',
    ])
  }
  fs.writeFileSync(OUT_LIST, toCsv(listRows))
  console.log(`\nWrote ${scored.length} saunas with ≥1 order within 50mi → ${OUT_LIST}`)

  // 4. Coverage gaps: order zips with no sauna in the database within 50mi.
  const gaps = located
    .map((g) => {
      let nearest = Infinity, nearestName = ''
      for (const s of saunaList) {
        if (s.lat == null) continue
        const d = haversineMiles(s.lat, s.lng, g.coords.lat, g.coords.lng)
        if (d < nearest) { nearest = d; nearestName = `${s.name} (${s.city_slug})` }
      }
      return { ...g, nearest, nearestName }
    })
    .filter((g) => g.nearest > 50)
    .sort((a, b) => b.orders - a.orders || b.sales - a.sales)

  const gapRows = [['city', 'region', 'zip', 'orders', 'net_sales', 'nearest_sauna_mi', 'nearest_sauna']]
  for (const g of gaps) {
    gapRows.push([g.city, g.region, g.zip, g.orders, g.sales.toFixed(2), g.nearest.toFixed(0), g.nearestName])
  }
  fs.writeFileSync(OUT_GAPS, toCsv(gapRows))
  console.log(`Wrote ${gaps.length} uncovered order zips → ${OUT_GAPS}`)

  // Console summary
  console.log('\nTop outreach candidates (orders within 25mi):')
  for (const { sauna: s, counts } of scored.slice(0, 15)) {
    console.log(`  ${String(counts[25].orders).padStart(3)}  ${s.name} — ${s.city_slug}`)
  }
  if (gaps.length) {
    console.log('\nDemand with no sauna coverage (top gaps):')
    for (const g of gaps.slice(0, 10)) {
      console.log(`  ${String(g.orders).padStart(3)} orders  ${g.city}, ${g.region} ${g.zip} (nearest sauna ${g.nearest.toFixed(0)}mi)`)
    }
  }
}

main().catch((err) => { console.error(err); process.exit(1) })
