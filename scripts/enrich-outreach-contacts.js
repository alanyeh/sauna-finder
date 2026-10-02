// Enrich the outreach list with contact info:
//   - phone via Google Places Details (place_id, new Places API)
//   - email via a best-effort scrape of the sauna's website homepage
//
// Only enriches saunas with ≥1 order within 25mi to keep API usage focused.
//
// Input:  data/outreach-list.csv  (from scripts/outreach-match.js)
// Output: data/outreach-list-enriched.csv
//
// Usage: node scripts/enrich-outreach-contacts.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const IN_CSV = path.join(ROOT, 'data/outreach-list.csv')
const OUT_CSV = path.join(ROOT, 'data/outreach-list-enriched.csv')
const API_KEY = process.env.GOOGLE_PLACES_API_KEY

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

function toCsv(rows) {
  return rows
    .map((r) => r.map((v) => {
      const s = v == null ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(','))
    .join('\n') + '\n'
}

async function fetchPhone(placeId) {
  if (!placeId || !API_KEY) return ''
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'nationalPhoneNumber,internationalPhoneNumber',
      },
    })
    if (!res.ok) return ''
    const json = await res.json()
    return json.nationalPhoneNumber || json.internationalPhoneNumber || ''
  } catch {
    return ''
  }
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const EMAIL_BLOCKLIST = /(sentry|wixpress|example|placeholder|\.png|\.jpg|\.gif|\.webp|\.svg|godaddy|domain\.com)/i

async function scrapeEmail(websiteUrl) {
  if (!websiteUrl) return ''
  const base = websiteUrl.split('?')[0]
  const candidates = [base, new URL('/contact', base).href]
  for (const url of candidates) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 8000)
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; outreach-research)' },
        redirect: 'follow',
      })
      clearTimeout(timer)
      if (!res.ok) continue
      const html = await res.text()
      const emails = [...new Set(html.match(EMAIL_RE) || [])]
        .filter((e) => !EMAIL_BLOCKLIST.test(e))
      if (emails.length) {
        // Prefer info@/hello@/contact@ style addresses
        const preferred = emails.find((e) => /^(info|hello|contact|hi|reservations|frontdesk)@/i.test(e))
        return preferred || emails[0]
      }
    } catch {
      // unreachable site or timeout — move on
    }
  }
  return ''
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function main() {
  if (!API_KEY) console.warn('⚠ GOOGLE_PLACES_API_KEY not set — phone lookup will be skipped')

  const rows = parseCsv(fs.readFileSync(IN_CSV, 'utf8'))
  const header = rows[0]
  const col = (name) => header.indexOf(name)
  const cWithin25 = col('orders_within_25mi')
  const cWebsite = col('website')
  const cPlaceId = col('place_id')

  const targets = rows.slice(1).filter((r) => parseInt(r[cWithin25], 10) >= 1)
  console.log(`Enriching ${targets.length} saunas (≥1 order within 25mi)…`)

  let done = 0
  const enriched = await mapWithConcurrency(targets, 5, async (r) => {
    const [phone, email] = await Promise.all([
      fetchPhone(r[cPlaceId]),
      scrapeEmail(r[cWebsite]),
    ])
    done++
    if (done % 20 === 0) console.log(`  ${done}/${targets.length}`)
    return [...r, phone, email]
  })

  const outHeader = [...header, 'phone', 'email']
  fs.writeFileSync(OUT_CSV, toCsv([outHeader, ...enriched]))

  const withPhone = enriched.filter((r) => r[outHeader.indexOf('phone')]).length
  const withEmail = enriched.filter((r) => r[outHeader.indexOf('email')]).length
  console.log(`\nWrote ${enriched.length} rows → ${OUT_CSV}`)
  console.log(`  phone found: ${withPhone}/${enriched.length}`)
  console.log(`  email found: ${withEmail}/${enriched.length}`)
}

main().catch((err) => { console.error(err); process.exit(1) })
