// Build a privacy-conscious, ChatGPT-ready campaign tracker from the enriched
// sauna outreach list. Customer-level Shopify data is never included.
//
// Input:  data/outreach-list-enriched.csv
// Output: data/chatgpt-sauna-outreach.csv
// Usage:  npm run outreach:chatgpt

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const inputPath = path.join(root, 'data', 'outreach-list-enriched.csv')
const outputPath = path.join(root, 'data', 'chatgpt-sauna-outreach.csv')

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') { row.push(field); field = '' }
    else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some(Boolean)) rows.push(row)
      row = []
    } else field += char
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  return rows
}

function encodeCsv(rows) {
  return rows.map((row) => row.map((value) => {
    const text = String(value ?? '')
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }).join(',')).join('\n') + '\n'
}

if (!fs.existsSync(inputPath)) {
  throw new Error('Missing data/outreach-list-enriched.csv. Run the outreach matching and enrichment scripts first.')
}

const [sourceHeader, ...sourceRows] = parseCsv(fs.readFileSync(inputPath, 'utf8'))
const index = Object.fromEntries(sourceHeader.map((name, i) => [name, i]))
const get = (row, name) => row[index[name]] ?? ''

const outputHeader = [
  'priority', 'outreach_status', 'sauna', 'city', 'neighborhood',
  'website', 'phone', 'email', 'instagram', 'contact_name',
  'rating', 'rating_count', 'orders_within_10mi', 'orders_within_25mi',
  'orders_within_50mi', 'sales_within_25mi', 'nearest_customer_mi',
  'fit_rationale', 'personalized_angle', 'last_contacted', 'follow_up_date',
  'hats_offered', 'shipping_status', 'response', 'notes',
]

const outputRows = sourceRows.map((row) => [
  '', 'not contacted', get(row, 'sauna'), get(row, 'city_slug'),
  get(row, 'neighborhood'), get(row, 'website'), get(row, 'phone'),
  get(row, 'email'), '', '', get(row, 'rating'), get(row, 'rating_count'),
  get(row, 'orders_within_10mi'), get(row, 'orders_within_25mi'),
  get(row, 'orders_within_50mi'), get(row, 'sales_within_25mi'),
  get(row, 'nearest_customer_mi'), '', '', '', '', '', '', '', '',
])

fs.writeFileSync(outputPath, encodeCsv([outputHeader, ...outputRows]))
console.log(`Wrote ${outputRows.length} prospects to ${path.relative(root, outputPath)}`)
console.log('No customer names, addresses, postal codes, order IDs, or Google place IDs were included.')
