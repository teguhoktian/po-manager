import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { cancelOrder } from '../_lib/orderService.js'
import { orderCancelSchema } from '../../src/schemas/order.js'

/** POST /api/orders/cancel { orderId, reason? } — seller cancels an order before fulfilment (refund: true when it was already paid). */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  const { orderId, reason, refund } = parseBody(orderCancelSchema, req.body)
  const result = await cancelOrder(adminDb(), uid, orderId, reason, new Date(), refund === true)
  sendJson(res, 200, { ok: true, ...result })
})
