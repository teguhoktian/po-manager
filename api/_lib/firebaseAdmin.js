import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getAppCheck } from 'firebase-admin/app-check'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

/** Lazily initialise Admin SDK from server-only env vars. Never import this from client code. */
function getAdminApp() {
  if (getApps().length) return getApps()[0]

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase Admin credentials are not configured')
  }

  return initializeApp({
    credential: cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Env UIs store newlines as literal "\n".
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminAuth = () => getAuth(getAdminApp())
export const adminAppCheck = () => getAppCheck(getAdminApp())
export const adminDb = () => getFirestore(getAdminApp())

/** Default Storage bucket (FIREBASE_STORAGE_BUCKET). Used only for server-validated uploads. */
export function adminBucket() {
  const name = process.env.FIREBASE_STORAGE_BUCKET
  if (!name) throw new Error('FIREBASE_STORAGE_BUCKET is not configured')
  return getStorage(getAdminApp()).bucket(name)
}
