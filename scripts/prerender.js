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
import { writeFile, mkdir, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CITY_CONFIG } from '../src/lib/cities.js'

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
const routes = [
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
  return new Promise((resolvePromise) => {
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
    server.listen(PORT, '127.0.0.1', () => resolvePromise(server))
  })
}

async function prerenderRoute(browser, route) {
  const page = await browser.newPage()
  const context = browser.defaultBrowserContext()
  await context.overridePermissions(ORIGIN, [])

  // Flag tells React components (via ClientOnly) not to render DOM-mutating
  // libraries like Google Maps during the prerender pass.
  await page.evaluateOnNewDocument(() => {
    window.__PRERENDER__ = true
  })

  page.on('pageerror', (err) => {
    console.error(`[${route}] page error:`, err.message)
  })

  await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: 30_000 })

  // Wait until SaunaDataContext has populated and Helmet has updated <title>.
  // The "Loading saunas..." text disappears once data is in.
  await page.waitForFunction(
    () => !document.body.innerText.includes('Loading saunas'),
    { timeout: 15_000 }
  )

  // Give Helmet one more tick to flush meta tags
  await new Promise((r) => setTimeout(r, 250))

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
    for (const route of routes) {
      await prerenderRoute(browser, route)
    }
  } finally {
    if (browser) await browser.close()
    server.close()
  }
  console.log('Prerender complete.')
}

main().catch((err) => {
  console.error('Prerender failed:', err)
  process.exit(1)
})
