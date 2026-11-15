import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, HttpError, parseBody, sendJson } from '../_lib/http.js'
import { placeOrder } from '../_lib/checkoutService.js'
import { clientIp, consumeRateLimit } from '../_lib/rateLimit.js'
import { checkoutSchema } from '../../src/schemas/order.js'

const MIN = 60_000

/** POST /api/public/checkout — create an order (no login). Validated, rate limited, idempotent. */
export default handler(['POST'], async (req, res) => {
  const input = parseBody(checkoutSchema, req.body)
  if (input.website) throw new HttpError(400, 'Permintaan tidak valid') // honeypot

  const db = adminDb()
  await consumeRateLimit(db, { bucket: 'checkout-ip', id: clientIp(req), limit: 10, windowMs: 10 * MIN })
  await consumeRateLimit(db, { bucket: 'checkout-wa', id: input.customer.whatsapp, limit: 5, windowMs: 60 * MIN })

  const { receipt, replayed } = await placeOrder(db, input)
  sendJson(res, replayed ? 200 : 201, { receipt, replayed })
})
