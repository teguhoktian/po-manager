import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
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
  'auth/popup-blocked': 'Jendela masuk Google diblokir browser. Izinkan pop-up untuk situs ini, lalu coba lagi.',
  'auth/unauthorized-domain': 'Domain ini belum diizinkan untuk masuk dengan Google.',
  'auth/operation-not-allowed': 'Masuk dengan Google belum diaktifkan.',
  'auth/account-exists-with-different-credential': 'Email ini sudah terdaftar dengan cara masuk lain. Masuk dengan email dan kata sandi.',
  'auth/operation-not-supported-in-this-environment': 'Browser ini tidak mendukung masuk dengan Google. Buka di Chrome atau Safari.',
  'auth/web-storage-unsupported': 'Browser ini tidak mendukung masuk dengan Google. Buka di Chrome atau Safari.',
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

/** Google sign-in doubles as sign-up. Resolves to null when the person closes the popup. */
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  try {
    const credential = await signInWithPopup(requireAuth(), provider)
    return credential.user
  } catch (error) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') return null
    throw error instanceof AuthError ? error : toAuthError(error)
  }
}

/**
 * Sends a password-reset email. An unknown address resolves like a known one so the form cannot be used
 * to find out which emails have accounts.
 */
export async function requestPasswordReset(email) {
  try {
    await sendPasswordResetEmail(requireAuth(), email)
  } catch (error) {
    if (error?.code === 'auth/user-not-found') return
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
