// Article metadata only (no article text), shared by the SEO map, the article list, and the "read also" blocks.
const metas = import.meta.glob('../../content/articles/*.md', { eager: true, import: 'meta' })

/** Newest first; articles with the same date follow their `urutan` (1, 2, 3 ...). */
export const ARTICLES = Object.entries(metas)
  .map(([file, meta]) => ({ ...meta, slug: file.split('/').pop().replace(/\.md$/, ''), order: Number(meta.urutan) || 99 }))
  .sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order)

export const articlePath = (slug) => `/artikel/${slug}`

/** "19 November 2026". Dates are plain calendar days, so they are formatted in UTC to avoid shifting by a day. */
export const formatArticleDate = (iso) =>
  new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`))
