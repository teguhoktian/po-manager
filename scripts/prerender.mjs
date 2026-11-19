// Runs after `vite build` and `vite build --ssr`. Turns the public pages into static HTML so Google, WhatsApp and
// other crawlers get the real content and tags without running JavaScript.
//   dist/index.html, dist/<page>.html  prerendered, indexable
//   dist/app.html                      unmodified app shell, noindex; Vercel serves it for login, dashboard, /po/... (vercel.json)
//   dist/404.html                      prerendered "not found", noindex
//   dist/sitemap.xml                   every indexable page
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const dist = resolve('dist')
const { render, SEO_PAGES, SITE, headTags, jsonLdFor, seoFor } = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')).href)

const template = await readFile(resolve(dist, 'index.html'), 'utf8')

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function headHtml(seo) {
  const lines = [`<title>${esc(seo.fullTitle)}</title>`]
  for (const { tag, key, attrs } of headTags(seo)) {
    const attrStr = Object.entries(attrs).map(([k, v]) => `${k}="${esc(v)}"`).join(' ')
    lines.push(`<${tag} data-seo="${esc(key)}" ${attrStr} />`)
  }
  const ld = jsonLdFor(seo)
  // "<" is escaped so the JSON can never close the script element.
  if (ld) lines.push(`<script type="application/ld+json" data-seo="ld-json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`)
  return lines.join('\n    ')
}

function build(seo, body) {
  let html = template
  const stripped = html.replace(/<title>[\s\S]*?<\/title>\s*/, '').replace(/<meta name="description"[^>]*>\s*/, '')
  if (stripped === html) throw new Error('index.html: title/description not found, update scripts/prerender.mjs')
  html = stripped.replace('</head>', `    ${headHtml(seo)}\n  </head>`)
  if (!html.includes('<div id="root"></div>')) throw new Error('index.html: empty #root not found')
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`)
}

const fileFor = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`)

// 1) app shell first: dist/index.html is about to be replaced by the prerendered home page.
await writeFile(resolve(dist, 'app.html'), build({ ...seoFor('/login'), fullTitle: SITE.name }, ''))

// 2) indexable pages
for (const path of Object.keys(SEO_PAGES)) {
  const body = await render(path)
  if (body.length < 500) throw new Error(`Prerender of ${path} produced almost nothing (${body.length} chars)`)
  await mkdir(dirname(resolve(dist, fileFor(path))), { recursive: true })
  await writeFile(resolve(dist, fileFor(path)), build(seoFor(path), body))
  console.log(`prerendered ${path.padEnd(20)} ${body.length} chars`)
}

// 3) real 404 page
await writeFile(resolve(dist, '404.html'), build(seoFor('/halaman-tidak-ada'), await render('/halaman-tidak-ada')))

// 4) sitemap
const urls = Object.entries(SEO_PAGES)
  .map(([p, page]) => `  <url><loc>${SITE.url}${p}</loc>${page.article ? `<lastmod>${page.article.modified}</lastmod>` : ''}</url>`)
  .join('\n')
await writeFile(resolve(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
console.log('wrote app.html, 404.html, sitemap.xml')
