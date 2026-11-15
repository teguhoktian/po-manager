import { createHash } from 'node:crypto'
import { HttpError } from './http.js'

export const sha256 = (value) => createHash('sha256').update(value).digest('hex')

/** Client IP as set by the platform proxy (Vercel overwrites x-forwarded-for). Only ever used hashed. */
export function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for']
  const first = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : ''
  return first || (typeof req.headers?.['x-real-ip'] === 'string' ? req.headers['x-real-ip'] : '') || req.socket?.remoteAddress || 'unknown'
}

/**
 * Fixed-window counter in Firestore (`rate_limits`, server-only). Keys are hashed so no IP / phone number
 * is stored in clear. Throws 429 once `limit` is exceeded within `windowMs`.
 */
export async function consumeRateLimit(db, { bucket, id, limit, windowMs, now = new Date() }) {
  const ref = db.collection('rate_limits').doc(sha256(`${bucket}:${id}`))
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? snap.data() : null
    const fresh = !data || now.getTime() - data.windowStart >= windowMs
    const count = fresh ? 1 : data.count + 1
    if (count > limit) throw new HttpError(429, 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.')
    tx.set(ref, {
      bucket,
      count,
      windowStart: fresh ? now.getTime() : data.windowStart,
      expiresAt: new Date((fresh ? now.getTime() : data.windowStart) + windowMs * 2),
    })
  })
}
