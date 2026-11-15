import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'

/** Error with a user-safe message. Never carries raw Firebase error text. */
export class AuthError extends Error {
  constructor(message, code) {
    super(message)
    this.name = 'AuthError'
    this.code = code
  }
}

const MESSAGES = {
  'auth/invalid-credential': 'Email atau kata sandi salah.',
  'auth/invalid-email': 'Email atau kata sandi salah.',
  'auth/user-not-found': 'Email atau kata sandi salah.',
  'auth/wrong-password': 'Email atau kata sandi salah.',
  'auth/email-already-in-use': 'Email sudah terdaftar. Silakan masuk.',
  'auth/weak-password': 'Kata sandi terlalu lemah.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.',
  'auth/network-request-failed': 'Koneksi bermasalah. Periksa internet kamu.',
  'auth/user-disabled': 'Akun ini dinonaktifkan.',
}

function toAuthError(error) {
  const code = error?.code ?? 'auth/unknown'
  return new AuthError(MESSAGES[code] ?? 'Terjadi kesalahan. Silakan coba lagi.', code)
}

function requireAuth() {
  if (!isFirebaseConfigured || !auth) {
    throw new AuthError('Firebase belum dikonfigurasi.', 'app/not-configured')
  }
  return auth
}

export async function registerWithEmail({ displayName, email, password }) {
  try {
    const credential = await createUserWithEmailAndPassword(requireAuth(), email, password)
    await updateProfile(credential.user, { displayName })
    return credential.user
  } catch (error) {
    throw error instanceof AuthError ? error : toAuthError(error)
  }
}

export async function loginWithEmail({ email, password }) {
  try {
    const credential = await signInWithEmailAndPassword(requireAuth(), email, password)
    return credential.user
  } catch (error) {
    throw error instanceof AuthError ? error : toAuthError(error)
  }
}

export async function logout() {
  try {
    await signOut(requireAuth())
  } catch (error) {
    throw error instanceof AuthError ? error : toAuthError(error)
  }
}

/** Subscribe to auth state. Returns the unsubscribe function. */
export function subscribeToAuth(callback) {
  return onAuthStateChanged(requireAuth(), callback)
}
