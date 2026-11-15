import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { requireAuth } from '../../requireAuth.js'
import { updateShipment } from '../../fulfillmentService.js'
import { shipmentUpdateSchema } from '../../../../src/schemas/order.js'

/** POST /api/orders/shipment — Edit courier/tracking after shipping. */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  sendJson(res, 200, { ok: true, ...(await updateShipment(adminDb(), uid, parseBody(shipmentUpdateSchema, req.body))) })
})
