import { COMPANY, SITE } from './site'
import { ARTICLES, articlePath } from '../content/articles'

/** Pages Google should index. Each one is prerendered to static HTML at build time (see scripts/prerender.mjs). */
export const SEO_PAGES = {
  '/': {
    title: `${SITE.name}: Aplikasi Pre-Order WhatsApp Group untuk Penjual`,
    description:
      'Kelola pre-order WhatsApp Group tanpa rekap manual. Bagikan satu link, lalu kuota, stok, bukti bayar, dan pengiriman tercatat rapi di satu tempat.',
    home: true,
  },
  '/cara-pakai': {
    title: `Cara Pakai ${SITE.name}: Panduan Jualan Pre-Order dari Awal`,
    description:
      'Panduan lengkap PO Hub untuk penjual: daftar, buat toko dan produk, buka PO, bagikan link, kelola pesanan, cek pembayaran, sampai pengiriman.',
  },
  '/kontak': {
    title: `Kontak ${SITE.name}`,
    description: 'Hubungi PO Hub lewat WhatsApp atau email untuk pertanyaan, laporan penyalahgunaan, atau permintaan terkait data pribadi.',
  },
  '/syarat-ketentuan': {
    title: `Syarat & Ketentuan ${SITE.name}`,
    description: 'Syarat dan ketentuan penggunaan PO Hub, layanan pre-order WhatsApp Group untuk penjual.',
  },
  '/kebijakan-privasi': {
    title: `Kebijakan Privasi ${SITE.name}`,
    description: 'Kebijakan privasi PO Hub: bagaimana kami mengelola data penjual dan pembeli.',
  },
  '/artikel': {
    title: 'Artikel dan Panduan Jualan Pre-Order',
    description: 'Panduan praktis untuk penjual pre-order: membuka PO, merekap pesanan, menentukan DP, menghitung harga, dan memeriksa bukti transfer.',
  },
  ...Object.fromEntries(
    ARTICLES.map((a) => [articlePath(a.slug), { title: a.title, description: a.description, article: { published: a.date, modified: a.updated ?? a.date } }]),
  ),
}

/** Pages that must stay out of search results. Matched by path prefix; titles only matter to the person's browser tab. */
const PRIVATE_PAGES = [
  ['/login', 'Masuk'],
  ['/register', 'Daftar'],
  ['/lupa-password', 'Lupa kata sandi'],
  ['/cek', 'Cek pesanan'],
  ['/dashboard', 'Dashboard'],
  ['/po', 'Pesan PO'],
]

export const NOT_FOUND_TITLE = 'Halaman tidak ditemukan'
export const OG_IMAGE = { url: `${SITE.url}/og-image.jpg`, width: 1200, height: 630, alt: `${SITE.name}: ${SITE.tagline}` }

/** "PO Hub" is added to a title only when the title does not already say it. */
const withBrand = (title) => (title.includes(SITE.name) ? title : `${title} | ${SITE.name}`)

const normalize = (pathname) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname) || '/'

/** What a given path should say about itself. `index: false` pages get a noindex robots tag and no canonical. */
export function seoFor(pathname) {
  const path = normalize(pathname)
  const page = SEO_PAGES[path]
  if (page) return { ...page, path, index: true, fullTitle: withBrand(page.title) }

  const priv = PRIVATE_PAGES.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`))
  const title = priv ? priv[1] : NOT_FOUND_TITLE
  return { title, path, index: false, fullTitle: withBrand(title), description: SITE.tagline }
}

/** The <meta>/<link> tags for a page as data, so the build script and the browser produce the same set. */
export function headTags(seo) {
  if (!seo.index) {
    return [
      { tag: 'meta', key: 'name=description', attrs: { name: 'description', content: seo.description } },
      { tag: 'meta', key: 'name=robots', attrs: { name: 'robots', content: 'noindex' } },
    ]
  }
  const url = `${SITE.url}${seo.path}`
  const articleTimes = seo.article
    ? [
        { tag: 'meta', key: 'property=article:published_time', attrs: { property: 'article:published_time', content: seo.article.published } },
        { tag: 'meta', key: 'property=article:modified_time', attrs: { property: 'article:modified_time', content: seo.article.modified } },
      ]
    : []
  return [
    { tag: 'meta', key: 'name=description', attrs: { name: 'description', content: seo.description } },
    { tag: 'link', key: 'rel=canonical', attrs: { rel: 'canonical', href: url } },
    { tag: 'meta', key: 'property=og:type', attrs: { property: 'og:type', content: seo.article ? 'article' : 'website' } },
    { tag: 'meta', key: 'property=og:site_name', attrs: { property: 'og:site_name', content: SITE.name } },
    { tag: 'meta', key: 'property=og:locale', attrs: { property: 'og:locale', content: 'id_ID' } },
    { tag: 'meta', key: 'property=og:title', attrs: { property: 'og:title', content: seo.fullTitle } },
    { tag: 'meta', key: 'property=og:description', attrs: { property: 'og:description', content: seo.description } },
    { tag: 'meta', key: 'property=og:url', attrs: { property: 'og:url', content: url } },
    { tag: 'meta', key: 'property=og:image', attrs: { property: 'og:image', content: OG_IMAGE.url } },
    { tag: 'meta', key: 'property=og:image:width', attrs: { property: 'og:image:width', content: String(OG_IMAGE.width) } },
    { tag: 'meta', key: 'property=og:image:height', attrs: { property: 'og:image:height', content: String(OG_IMAGE.height) } },
    { tag: 'meta', key: 'property=og:image:alt', attrs: { property: 'og:image:alt', content: OG_IMAGE.alt } },
    { tag: 'meta', key: 'name=twitter:card', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
    { tag: 'meta', key: 'name=twitter:title', attrs: { name: 'twitter:title', content: seo.fullTitle } },
    { tag: 'meta', key: 'name=twitter:description', attrs: { name: 'twitter:description', content: seo.description } },
    { tag: 'meta', key: 'name=twitter:image', attrs: { name: 'twitter:image', content: OG_IMAGE.url } },
    ...articleTimes,
  ]
}

/** Structured data for the home page only: who runs the site, what the site is, and what the product is. No prices or ratings. */
export function jsonLdFor(seo) {
  if (seo.article) return articleLd(seo)
  if (!seo.home) return null
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: COMPANY.name,
        url: SITE.url,
        logo: `${SITE.url}/logo-512.png`,
        email: COMPANY.email,
        address: { '@type': 'PostalAddress', streetAddress: COMPANY.address, addressCountry: 'ID' },
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer support',
          telephone: `+${COMPANY.whatsapp}`,
          email: COMPANY.email,
          areaServed: 'ID',
          availableLanguage: 'id',
        },
      },
      { '@type': 'WebSite', '@id': `${SITE.url}/#website`, url: SITE.url, name: SITE.name, inLanguage: 'id-ID', publisher: { '@id': `${SITE.url}/#organization` } },
      {
        '@type': 'SoftwareApplication',
        name: SITE.name,
        url: SITE.url,
        description: SITE.tagline,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        inLanguage: 'id-ID',
        publisher: { '@id': `${SITE.url}/#organization` },
      },
    ],
  }
}

function articleLd(seo) {
  const url = `${SITE.url}${seo.path}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: seo.title,
        description: seo.description,
        inLanguage: 'id-ID',
        datePublished: seo.article.published,
        dateModified: seo.article.modified,
        mainEntityOfPage: url,
        image: OG_IMAGE.url,
        author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
        publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: { '@type': 'ImageObject', url: `${SITE.url}/logo-512.png` } },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE.name, item: `${SITE.url}/` },
          { '@type': 'ListItem', position: 2, name: 'Artikel', item: `${SITE.url}/artikel` },
          { '@type': 'ListItem', position: 3, name: seo.title, item: url },
        ],
      },
    ],
  }
}
