// Build-time prerendering for sauna-finder.
//
// Runs after `vite build`. Spawns `vite preview`, launches a headless Chrome
// via puppeteer, navigates to each route, waits for content + Helmet to settle,
// then writes the rendered HTML to dist/{route}/index.html so crawlers see real
// content instead of an empty SPA shell.

import { spawn } from 'node:child_process'
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

import { CITY_CONFIG } from '../src/lib/cities.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')
const PORT = 4319
const ORIGIN = `http://localhost:${PORT}`

// Prerender city pages first, home LAST. Reason: writing dist/index.html
// causes vite preview's SPA fallback to serve the prerendered home page
// for every unknown route, which then tries to hydrate against a different
// page and throws hydration errors. Keeping / for last means all city routes
// fall back to the original empty shell.
const routes = [
  ...Object.keys(CITY_CONFIG)
    .filter((slug) => slug !== 'all')
    .map((slug) => `/city/${slug}`),
  '/',
]

function startPreview() {
  return new Promise((resolvePreview, reject) => {
    const proc = spawn(
      'npx',
      ['vite', 'preview', '--port', String(PORT), '--strictPort'],
      { cwd: resolve(__dirname, '..'), stdio: ['ignore', 'pipe', 'pipe'] }
    )
    let ready = false
    proc.stdout.on('data', (chunk) => {
      const out = chunk.toString()
      if (!ready && out.includes('Local:')) {
        ready = true
        resolvePreview(proc)
      }
    })
    proc.stderr.on('data', (chunk) => {
      process.stderr.write(`[vite preview] ${chunk}`)
    })
    proc.on('exit', (code) => {
      if (!ready) reject(new Error(`vite preview exited early with code ${code}`))
    })
    setTimeout(() => {
      if (!ready) reject(new Error('vite preview did not start within 10s'))
    }, 10_000)
  })
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage()
  // Block geolocation prompts to keep the rendered output deterministic
  const context = browser.defaultBrowserContext()
  await context.overridePermissions(ORIGIN, [])

  // Flag tells React components (via ClientOnly) not to render DOM-mutating
  // libraries like Google Maps during prerender.
  await page.evaluateOnNewDocument(() => {
    window.__PRERENDER__ = true
  })

  page.on('pageerror', (err) => {
    console.error(`[${route}] page error:`, err.message)
  })

  await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })

  // Wait until the SaunaDataContext has populated and Helmet has updated <title>.
  // The "Loading saunas..." text disappears once data is in.
  await page.waitForFunction(
    () => !document.body.innerText.includes('Loading saunas'),
    { timeout: 15_000 }
  )

  // Give Helmet one more tick to flush meta tags
  await new Promise((r) => setTimeout(r, 250))

  const html = await page.content()
  await page.close()

  // Write to dist/{route}/index.html (or dist/index.html for /)
  const outPath =
    route === '/'
      ? resolve(distDir, 'index.html')
      : resolve(distDir, route.replace(/^\//, ''), 'index.html')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, html, 'utf8')

  // Sanity check
  const titleMatch = html.match(/<title>([^<]+)<\/title>/)
  const hasJsonLd = html.includes('application/ld+json')
  console.log(
    `  ${route.padEnd(22)} → ${outPath.replace(distDir, 'dist')}  (title: ${titleMatch?.[1]?.slice(0, 60) || '?'}${hasJsonLd ? ', schema ✓' : ', schema ✗'})`
  )
}

async function main() {
  console.log(`Prerendering ${routes.length} routes...`)
  const preview = await startPreview()
  let browser
  try {
    browser = await puppeteer.launch({ headless: 'new' })
    for (const route of routes) {
      await prerenderRoute(browser, route)
    }
  } finally {
    if (browser) await browser.close()
    preview.kill('SIGTERM')
  }
  console.log('Prerender complete.')
}

main().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
