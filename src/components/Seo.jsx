import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { headTags, jsonLdFor, seoFor } from '../config/seo'

const SEO_ATTR = 'data-seo'

function upsert(tag, key, attrs) {
  let el = document.head.querySelector(`${tag}[${SEO_ATTR}="${key}"]`)
  if (!el) {
    el = document.createElement(tag)
    el.setAttribute(SEO_ATTR, key)
    document.head.appendChild(el)
  }
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, value)
}

/**
 * Keeps <head> in step with the route while the person navigates inside the app.
 * Prerendered pages already carry the same tags (scripts/prerender.mjs), so a first load needs no change.
 * Renders nothing, also on the server, so the prerendered markup and the hydrated tree have the same shape.
 */
export function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = seoFor(pathname)
    document.title = seo.fullTitle

    const tags = headTags(seo)
    const wanted = new Set(tags.map((t) => t.key))
    for (const el of document.head.querySelectorAll(`[${SEO_ATTR}]`)) {
      if (!wanted.has(el.getAttribute(SEO_ATTR)) && el.getAttribute(SEO_ATTR) !== 'ld-json') el.remove()
    }
    for (const { tag, key, attrs } of tags) upsert(tag, key, attrs)

    const ld = jsonLdFor(seo)
    const existing = document.head.querySelector(`script[${SEO_ATTR}="ld-json"]`)
    if (!ld) existing?.remove()
    else {
      const el = existing ?? document.createElement('script')
      if (!existing) {
        el.type = 'application/ld+json'
        el.setAttribute(SEO_ATTR, 'ld-json')
        document.head.appendChild(el)
      }
      el.textContent = JSON.stringify(ld)
    }
  }, [pathname])

  return null
}
