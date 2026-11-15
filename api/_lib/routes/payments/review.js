import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { reviewPayment } from '../../paymentService.js'
import { requireAuth } from '../../requireAuth.js'
import { paymentActionSchema } from '../../../../src/schemas/order.js'

/** POST /api/payments/review { paymentId, action: verify|reject, amount?, reason? } */
export default handler(['POST'], async (req, res) => {
  const { uid } = await requireAuth(req)
  sendJson(res, 200, { ok: true, ...(await reviewPayment(adminDb(), uid, parseBody(paymentActionSchema, req.body))) })
})
