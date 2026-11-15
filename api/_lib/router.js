import { sendJson } from './http.js'

/**
 * Vercel's free plan allows 12 Functions per deployment, so related endpoints share one dynamic file
 * (`api/<group>/[action].js`) and dispatch by the `action` path segment. URLs stay /api/<group>/<action>.
 * `table` maps action → handler (each already wrapped with `handler([...methods], fn)`).
 */
export function router(table) {
  return async (req, res) => {
    const action = String(req.query?.action ?? '')
    const route = Object.hasOwn(table, action) ? table[action] : null
    if (!route) return sendJson(res, 404, { error: 'Not found' })
    return route(req, res)
  }
}
