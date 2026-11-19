import { marked } from 'marked'

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const REQUIRED = ['title', 'description', 'date']

/**
 * Turns content/articles/*.md into modules at build time, so no Markdown parser ships to the browser.
 * Each file starts with a `---` block of `key: value` lines (title, description, date, optional updated and urutan).
 * Exports `meta` (the fields plus readingMinutes) and `html` separately, so pages that only list articles do not bundle the text.
 */
export function markdownArticles() {
  return {
    name: 'po-hub:markdown-articles',
    enforce: 'pre',
    transform(source, id) {
      if (!id.split('?')[0].endsWith('.md')) return null
      const match = FRONTMATTER.exec(source)
      if (!match) this.error(`${id}: the file must start with a --- frontmatter block`)

      const meta = {}
      for (const line of match[1].split(/\r?\n/)) {
        const at = line.indexOf(':')
        if (at > 0) meta[line.slice(0, at).trim()] = line.slice(at + 1).trim()
      }
      for (const key of REQUIRED) if (!meta[key]) this.error(`${id}: frontmatter "${key}" is missing`)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) this.error(`${id}: "date" must look like 2026-11-19`)
      if (meta.description.length > 160) this.warn(`${id}: description is ${meta.description.length} characters; Google shows about 155`)

      const body = source.slice(match[0].length)
      const readingMinutes = Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200))
      const html = marked.parse(body, { async: false })

      return {
        code: `export const meta = ${JSON.stringify({ ...meta, readingMinutes })}\nexport const html = ${JSON.stringify(html)}\n`,
        map: null,
      }
    },
  }
}
