import { adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { recordPayment } from '../_lib/paymentService.js'
import { requireAuth } from '../_lib/requireAuth.js'
import { paymentRecordSchema } from '../../src/schemas/order.js'

/** POST /api/payments/record { orderId, amount, note? } — payment received outside the app. */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  sendJson(res, 201, { ok: true, ...(await recordPayment(adminDb(), uid, parseBody(paymentRecordSchema, req.body))) })
})
