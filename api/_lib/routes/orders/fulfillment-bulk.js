import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { requireAuth } from '../../requireAuth.js'
import { bulkUpdateFulfillment } from '../../fulfillmentService.js'
import { fulfillmentBulkSchema } from '../../../../src/schemas/order.js'

/** POST /api/orders/fulfillment-bulk — Same step (processing/packed) for many orders. */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  sendJson(res, 200, { ok: true, ...(await bulkUpdateFulfillment(adminDb(), uid, parseBody(fulfillmentBulkSchema, req.body))) })
})
