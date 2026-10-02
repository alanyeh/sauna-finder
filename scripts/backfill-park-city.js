// Backfill Park City saunas inserted from the dry-run report (see
// insert-park-city-from-report.js): exact lat/lng, hours, price, and photos
// from Google Place Details.
//
// Run after the Places API daily quota resets (midnight Pacific).
// Budget: ~23 Place Details calls + up to 4 photo downloads per sauna,
// which fits inside this project's 100/day per-endpoint quota.
//
// Usage: node scripts/backfill-park-city.js [--skip-photos]

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const API_KEY = process.env.GOOGLE_PLACES_API_KEY
const PHOTOS_PER_SAUNA = 4

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function mapPriceLevel(priceLevel) {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return '$'
    case 'PRICE_LEVEL_MODERATE':
      return '$$'
    case 'PRICE_LEVEL_EXPENSIVE':
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return '$$$'
    default:
      return null
  }
}

async function fetchDetails(placeId) {
  const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': 'location,regularOpeningHours,priceLevel,photos',
    },
  })
  if (!res.ok) throw new Error(`Place Details ${res.status}: ${await res.text()}`)
  return res.json()
}

async function uploadPhotos(saunaId, photoRefs) {
  const urls = []
  const timestamp = Date.now()
  for (let i = 0; i < Math.min(photoRefs.length, PHOTOS_PER_SAUNA); i++) {
    try {
      const mediaUrl = `https://places.googleapis.com/v1/${photoRefs[i].name}/media?maxHeightPx=600&key=${API_KEY}`
      const res = await fetch(mediaUrl)
      if (!res.ok) { console.log(`    photo ${i + 1}: HTTP ${res.status}`); continue }
      const buffer = Buffer.from(await res.arrayBuffer())
      const fileName = `${saunaId}-${i}-${timestamp}.jpg`
      const { error } = await supabase.storage
        .from('sauna-photos')
        .upload(`public/${fileName}`, buffer, { contentType: 'image/jpeg' })
      if (error) { console.log(`    photo ${i + 1}: ${error.message}`); continue }
      const { data: { publicUrl } } = supabase.storage
        .from('sauna-photos')
        .getPublicUrl(`public/${fileName}`)
      urls.push(publicUrl)
      await sleep(200)
    } catch (err) {
      console.log(`    photo ${i + 1}: ${err.message}`)
    }
  }
  return urls
}

async function main() {
  const skipPhotos = process.argv.includes('--skip-photos')

  const { data: saunas, error } = await supabase
    .from('saunas')
    .select('id, name, place_id, photos')
    .eq('city_slug', 'park-city')
    .order('id')
  if (error) { console.error(error.message); process.exit(1) }
  console.log(`Backfilling ${saunas.length} park-city saunas…\n`)

  let ok = 0
  for (const s of saunas) {
    process.stdout.write(`  ${s.name}…`)
    let details
    try {
      details = await fetchDetails(s.place_id)
    } catch (err) {
      console.log(` DETAILS FAILED: ${err.message}`)
      continue
    }

    const update = {}
    if (details.location) {
      update.lat = details.location.latitude
      update.lng = details.location.longitude
    }
    if (details.regularOpeningHours?.weekdayDescriptions) {
      update.hours = details.regularOpeningHours.weekdayDescriptions.join(', ')
    }
    const price = mapPriceLevel(details.priceLevel)
    if (price) update.price = price

    // Google photos lead; website-scraped photos (from fetch-website-photos.js,
    // filenames contain "-web-") are kept as extras behind them.
    const hasGooglePhotos = (s.photos || []).some((u) => !u.includes('-web-'))
    if (!skipPhotos && !hasGooglePhotos && details.photos?.length) {
      const urls = await uploadPhotos(s.id, details.photos)
      if (urls.length) update.photos = [...urls, ...(s.photos || [])]
    }

    const { error: upErr } = await supabase.from('saunas').update(update).eq('id', s.id)
    if (upErr) { console.log(` UPDATE FAILED: ${upErr.message}`); continue }
    console.log(` ✓ coords${update.hours ? ' hours' : ''}${update.price ? ' price' : ''}${update.photos ? ` ${update.photos.length} photos` : ''}`)
    ok++
    await sleep(300)
  }

  console.log(`\n${ok}/${saunas.length} backfilled`)
  console.log('Then refresh the local snapshot: node scripts/prefetch-saunas.js')
}

main().catch((err) => { console.error(err); process.exit(1) })
