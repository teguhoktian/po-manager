import { adminBucket, adminDb } from '../_lib/firebaseAdmin.js'
import { handler, parseBody, sendJson } from '../_lib/http.js'
import { submitPaymentProof } from '../_lib/publicOrderService.js'
import { clientIp, consumeRateLimit } from '../_lib/rateLimit.js'
import { paymentProofSchema } from '../../src/schemas/order.js'

const storage = {
  save: (path, buffer, contentType) => adminBucket().file(path).save(buffer, { contentType, resumable: false, metadata: { cacheControl: 'private, max-age=0' } }),
  remove: (path) => adminBucket().file(path).delete({ ignoreNotFound: true }),
}

/** POST /api/public/payment-proof — buyer uploads a transfer proof (base64 image, validated server-side). */
export default handler(['POST'], async (req, res) => {
  const input = parseBody(paymentProofSchema, req.body)
  const db = adminDb()
  await consumeRateLimit(db, { bucket: 'proof-ip', id: clientIp(req), limit: 8, windowMs: 10 * 60_000 })
  await consumeRateLimit(db, { bucket: 'proof-order', id: `${input.storeSlug}:${input.orderNumber}`, limit: 10, windowMs: 60 * 60_000 })
  sendJson(res, 201, await submitPaymentProof(db, storage, input))
})
