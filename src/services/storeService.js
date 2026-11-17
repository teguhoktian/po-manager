import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/data'
import { apiFetch } from './apiClient'
import { deleteImage, getImageUrl, IMAGE_MAX_BYTES, SOURCE_MAX_BYTES, uploadImage } from './imageService'
import { optimizeImage } from '../lib/imageOptimize'
const LOGO_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Load the signed-in seller's store (document ID == UID). Returns null if not created yet. */
export async function getStore(uid) {
  const snap = await getDoc(doc(db, 'stores', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Server-side: creates the store and claims the slug atomically. */
export function createStore(values) {
  return apiFetch('/api/store', { method: 'POST', body: values })
}

/** Server-side: changes the public address (slug). */
export function changeStoreSlug(slug) {
  return apiFetch('/api/store/slug', { method: 'PUT', body: { slug } })
}

/** Direct write allowed by Firestore rules (whitelisted fields only). */
export function updateStoreProfile(uid, { name, description, whatsappNumber, paymentInfo }) {
  return updateDoc(doc(db, 'stores', uid), { name, description, whatsappNumber, paymentInfo, updatedAt: serverTimestamp() })
}

/** Throws an Error with a user-facing message when the file is not acceptable. */
export function validateLogoFile(file) {
  if (!file || !LOGO_TYPES[file.type]) throw new Error('Format logo harus JPG, PNG, atau WebP.')
  if (file.size > SOURCE_MAX_BYTES) throw new Error('Ukuran logo maksimal 15 MB.')
}

/** Upload a logo to the seller's own folder, point the store at it, and remove the previous file. */
export async function uploadStoreLogo(uid, original, previousPath) {
  validateLogoFile(original)
  const file = await optimizeImage(original, 'logo')
  if (file.size > IMAGE_MAX_BYTES) throw new Error('Ukuran logo terlalu besar. Coba gambar lain.')
  const path = `sellers/${uid}/store/logo-${Date.now()}.${LOGO_TYPES[file.type]}`
  await uploadImage(path, file)
  await updateDoc(doc(db, 'stores', uid), { logoPath: path, updatedAt: serverTimestamp() })
  if (previousPath) await deleteImage(previousPath) // best effort: an orphaned old file is harmless
  return path
}

export const getLogoUrl = getImageUrl
