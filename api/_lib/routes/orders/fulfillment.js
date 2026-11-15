import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { requireAuth } from '../../requireAuth.js'
import { updateFulfillment } from '../../fulfillmentService.js'
import { fulfillmentSchema } from '../../../../src/schemas/order.js'

/** POST /api/orders/fulfillment — Move an order along the fulfilment steps (shipping needs courier details). */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  sendJson(res, 200, { ok: true, ...(await updateFulfillment(adminDb(), uid, parseBody(fulfillmentSchema, req.body))) })
})
