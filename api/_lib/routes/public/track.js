import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { trackPublicOrder } from '../../publicOrderService.js'
import { clientIp, consumeRateLimit, sha256 } from '../../rateLimit.js'
import { orderTrackSchema } from '../../../../src/schemas/order.js'

/** POST /api/public/track { orderNumber, whatsapp } — order status for buyers without their order link.
 *  Limited per IP and per order number so a phone number cannot be guessed. */
export default handler(['POST'], async (req, res) => {
  const input = parseBody(orderTrackSchema, req.body)
  const db = adminDb()
  await consumeRateLimit(db, { bucket: 'order-track-ip', id: clientIp(req), limit: 20, windowMs: 10 * 60_000 })
  await consumeRateLimit(db, { bucket: 'order-track-no', id: sha256(input.orderNumber.toUpperCase()), limit: 8, windowMs: 60 * 60_000 })
  sendJson(res, 200, await trackPublicOrder(db, input))
})
