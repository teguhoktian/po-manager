import { proofStorage } from '../../fileStore.js'
import { adminDb } from '../../firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../../http.js'
import { submitPaymentProof } from '../../publicOrderService.js'
import { clientIp, consumeRateLimit } from '../../rateLimit.js'
import { paymentProofSchema } from '../../../../src/schemas/order.js'

/** POST /api/public/payment-proof — buyer uploads a transfer proof (base64 image, validated server-side). */
export default handler(['POST'], async (req, res) => {
  const input = parseBody(paymentProofSchema, req.body)
  const db = adminDb()
  await consumeRateLimit(db, { bucket: 'proof-ip', id: clientIp(req), limit: 8, windowMs: 10 * 60_000 })
  await consumeRateLimit(db, { bucket: 'proof-order', id: `${input.storeSlug}:${input.orderNumber}`, limit: 10, windowMs: 60 * 60_000 })
  sendJson(res, 201, await submitPaymentProof(db, proofStorage, input))
})
