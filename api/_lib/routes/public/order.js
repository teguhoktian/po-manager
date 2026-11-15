import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { getPublicOrder } from '../../publicOrderService.js'
import { clientIp, consumeRateLimit } from '../../rateLimit.js'
import { orderLookupSchema } from '../../../../src/schemas/order.js'

/** POST /api/public/order { storeSlug, orderNumber, token } — buyer's live order + payment status.
 *  POST (not GET) so the secret token never lands in URLs or access logs. */
export default handler(['POST'], async (req, res) => {
  const input = parseBody(orderLookupSchema, req.body)
  const db = adminDb()
  await consumeRateLimit(db, { bucket: 'order-lookup-ip', id: clientIp(req), limit: 60, windowMs: 10 * 60_000 })
  sendJson(res, 200, await getPublicOrder(db, input))
})
