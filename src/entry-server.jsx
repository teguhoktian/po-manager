/* oxlint-disable react/only-export-components */
import { prerender } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'

export { SEO_PAGES, headTags, jsonLdFor, seoFor } from './config/seo'
export { SITE } from './config/site'

/** Renders one route to an HTML string. Waits for lazy pages, so the result is the finished page, not a loader. */
export async function render(url) {
  const { prelude } = await prerender(
    <StaticRouter location={url}>
      <AppRoutes />
    </StaticRouter>,
  )
  return new Response(prelude).text()
}
