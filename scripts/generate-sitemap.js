// Generates dist/sitemap.xml from CITY_CONFIG so the sitemap can never drift
// from the routes that actually ship. Invoked by scripts/prerender.js (the
// postbuild step); can also be run directly: `node scripts/generate-sitemap.js`.

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { CITY_CONFIG } from '../src/lib/cities.js'

const SITE = 'https://sauna-finder.koriboshi.com'

export function buildSitemapXml() {
  const cityRoutes = Object.keys(CITY_CONFIG)
    .filter((slug) => slug !== 'all')
    .map((slug) => `/city/${slug}`)

  const urls = [
    { loc: '/', priority: '1.0' },
    ...cityRoutes.map((loc) => ({ loc, priority: '0.8' })),
  ]

  const body = urls
    .map(
      ({ loc, priority }) =>
        `  <url>\n    <loc>${SITE}${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export async function generateSitemap(distDir) {
  await mkdir(distDir, { recursive: true })
  const outPath = resolve(distDir, 'sitemap.xml')
  await writeFile(outPath, buildSitemapXml(), 'utf8')
  return outPath
}

// Run directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const distDir = resolve(__dirname, '..', 'dist')
  generateSitemap(distDir).then((p) => console.log(`Wrote ${p}`))
}
