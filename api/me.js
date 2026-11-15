import { handler, sendJson } from './_lib/http.js'
import { requireAuth } from './_lib/requireAuth.js'

/** Returns the verified identity of the caller. Useful to confirm the auth pipeline end to end. */
export default handler(['GET'], async (req, res) => {
  const { uid, email, name } = await requireAuth(req)
  sendJson(res, 200, { uid, email, name })
})
