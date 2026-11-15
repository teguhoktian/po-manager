import { adminAppCheck, adminAuth } from './firebaseAdmin.js'
import { HttpError } from './http.js'

/**
 * Verify the caller's Firebase ID token (and App Check token) and return the trusted identity.
 * The UID MUST come from here — never from request body, query, or headers supplied by the client.
 */
export async function requireAuth(req) {
  const header = req.headers.authorization ?? ''
  const match = /^Bearer (.+)$/.exec(header)
  if (!match) throw new HttpError(401, 'Unauthorized')

  await verifyAppCheck(req)

  try {
    // checkRevoked=true so logged-out / disabled accounts are rejected promptly.
    const decoded = await adminAuth().verifyIdToken(match[1], true)
    return { uid: decoded.uid, email: decoded.email ?? null, name: decoded.name ?? null }
  } catch {
    throw new HttpError(401, 'Unauthorized')
  }
}

/** Enforced only when APPCHECK_ENFORCE=true, so local development works before App Check is set up. */
async function verifyAppCheck(req) {
  if (process.env.APPCHECK_ENFORCE !== 'true') return
  const token = req.headers['x-firebase-appcheck']
  if (typeof token !== 'string' || !token) throw new HttpError(401, 'Unauthorized')
  try {
    await adminAppCheck().verifyToken(token)
  } catch {
    throw new HttpError(401, 'Unauthorized')
  }
}
