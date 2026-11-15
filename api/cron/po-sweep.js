import { timingSafeEqual } from 'node:crypto'
import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, HttpError, sendJson } from '../_lib/http.js'
import { sweepPurchaseOrders } from '../_lib/poScheduler.js'

/** Constant-time compare of the Vercel cron `Authorization: Bearer $CRON_SECRET` header. */
function authorized(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false // never run unauthenticated, even if the variable is missing
  const given = Buffer.from(req.headers.authorization ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/** GET /api/cron/po-sweep — called by Vercel Cron, not by browsers. */
export default handler(['GET'], async (req, res) => {
  if (!authorized(req)) throw new HttpError(401, 'Unauthorized')
  sendJson(res, 200, { ok: true, ...(await sweepPurchaseOrders(adminDb())) })
})
