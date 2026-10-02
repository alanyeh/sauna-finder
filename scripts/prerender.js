// Build-time prerendering for sauna-finder.
//
// Runs after `vite build`. Starts a minimal in-process static file server
// over `dist/`, launches puppeteer, navigates to each route, waits for
// content + Helmet to settle, then writes the rendered HTML to
// dist/{route}/index.html so crawlers see real content instead of an empty
// SPA shell.
//
// Uses a plain Node http server (not `vite preview`) so this works in CI
// environments like Vercel's build containers, which don't have xdg-open
// and trip over vite preview's browser-open behavior.

import { createReadStream } from 'node:fs'
import { writeFile, mkdir, stat, readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CITY_CONFIG } from '../src/lib/cities.js'
import { generateSitemap } from './generate-sitemap.js'
import { saunaRoutes } from '../src/lib/saunaRoutes.js'

// Use full puppeteer locally (it bundles its own Chromium with all shared
// libs), but on CI use puppeteer-core + @sparticuz/chromium, which ships
// a Linux Chromium build bundled with its own shared libs. Vercel's build
// container doesn't have libnspr4.so etc, so the standard puppeteer
// download fails to launch.
const IS_CI = !!(process.env.VERCEL || process.env.CI)

let puppeteer
let launchOptions
if (IS_CI) {
  const chromiumModule = await import('@sparticuz/chromium')
  const chromium = chromiumModule.default
  puppeteer = (await import('puppeteer-core')).default
  launchOptions = {
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  }
} else {
  puppeteer = (await import('puppeteer')).default
  launchOptions = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')
const PORT = 4319
const ORIGIN = `http://localhost:${PORT}`

// Prerender city pages first, home LAST. Reason: writing dist/index.html
// causes the static server's SPA fallback to serve the prerendered home
// page for every unknown route, which then tries to hydrate against a
// different page. Keeping / for last means all city routes fall back to
// the original empty shell written by `vite build`.
const snapshot = JSON.parse(await readFile(new URL('../src/data/saunas-prebuilt.json', import.meta.url), 'utf8'))
const routes = [
  ...saunaRoutes(snapshot),
  ...Object.keys(CITY_CONFIG)
    .filter((slug) => slug !== 'all')
    .map((slug) => `/city/${slug}`),
  '/',
]

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

async function tryFile(path) {
  try {
    const s = await stat(path)
    return s.isFile() ? path : null
  } catch {
    return null
  }
}

function startStaticServer() {
  return new Promise((resolvePromise, rejectPromise) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, ORIGIN)
        let relPath = decodeURIComponent(url.pathname)
        if (relPath.endsWith('/')) relPath += 'index.html'

        // Try direct file, then directory index, then SPA fallback
        let filePath = await tryFile(join(distDir, relPath))
        if (!filePath) filePath = await tryFile(join(distDir, relPath, 'index.html'))
        if (!filePath) filePath = join(distDir, 'index.html') // SPA fallback

        const ext = extname(filePath).toLowerCase()
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
        createReadStream(filePath).pipe(res)
      } catch (err) {
        res.writeHead(500)
        res.end(String(err))
      }
    })
    server.on('error', rejectPromise)
    server.listen(PORT, '127.0.0.1', () => resolvePromise(server))
  })
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage()

  // Flag tells React components (via ClientOnly) not to render DOM-mutating
  // libraries like Google Maps during the prerender pass.
  await page.evaluateOnNewDocument(() => {
    window.__PRERENDER__ = true
  })

  const errors = []
  page.on('pageerror', err => errors.push(err.message))
  // SEO output comes from the build snapshot; third-party assets and images
  // are unnecessary during rendering and would multiply network work.
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (!request.url().startsWith(ORIGIN + '/') || ['image', 'font'].includes(request.resourceType())) request.abort()
    else request.continue()
  })

  await page.goto(`${ORIGIN}${route}`, { waitUntil: 'domcontentloaded', timeout: 30_000 })

  // Wait for this route, not an empty Suspense fallback or a stale page title.
  try {
    await page.waitForFunction(
      expected => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === expected
        && document.querySelector('#root h1')
        && document.querySelector('script[type="application/ld+json"]')
        && !document.body.innerText.includes('Loading saunas'),
      { timeout: 15_000, polling: 100 }, `https://sauna-finder.koriboshi.com${route}`
    )
  } catch (error) {
    const state = await page.evaluate(() => ({ title: document.title, canonical: document.querySelector('link[rel=canonical]')?.href, body: document.body.innerText.slice(0, 500) }))
    await page.close()
    throw new Error(`${route}: ${error.message}; ${JSON.stringify(state)}; ${errors.join('; ')}`, { cause: error })
  }
  if (errors.length) throw new Error(`${route}: ${errors.join('; ')}`)

  const html = await page.content()
  await page.close()

  const outPath =
    route === '/'
      ? resolve(distDir, 'index.html')
      : resolve(distDir, route.replace(/^\//, ''), 'index.html')
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, html, 'utf8')

  const titleMatch = html.match(/<title>([^<]+)<\/title>/)
  const hasJsonLd = html.includes('application/ld+json')
  console.log(
    `  ${route.padEnd(22)} → ${outPath.replace(distDir, 'dist')}  (title: ${titleMatch?.[1]?.slice(0, 60) || '?'}${hasJsonLd ? ', schema ✓' : ', schema ✗'})`
  )
}

async function main() {
  console.log(`Prerendering ${routes.length} routes...`)
  const server = await startStaticServer()
  let browser
  try {
    browser = await puppeteer.launch(launchOptions)
    await browser.defaultBrowserContext().overridePermissions(ORIGIN, [])
    const pending = routes.filter(route => route !== '/')
    let cursor = 0
    const workers = await Promise.allSettled(Array.from({ length: 4 }, async () => {
      while (cursor < pending.length) await prerenderRoute(browser, pending[cursor++])
    }))
    const failed = workers.find(worker => worker.status === 'rejected')
    if (failed) throw failed.reason
    await prerenderRoute(browser, '/')
  } finally {
    if (browser) await browser.close()
    server.close()
  }

  const sitemapPath = await generateSitemap(distDir, snapshot)
  console.log(`  sitemap → ${sitemapPath.replace(distDir, 'dist')}`)

  console.log('Prerender complete.')
}

export { startStaticServer, puppeteer, launchOptions }

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
