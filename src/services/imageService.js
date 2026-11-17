import { PUBLIC_BUCKET } from '../constants/storage'
import { apiFetch, apiUpload } from './apiClient'

/** Limit enforced by the server, applied to the file AFTER optimization. */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024
/** Largest original the browser will try to shrink. */
export const SOURCE_MAX_BYTES = 15 * 1024 * 1024
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Checks a picked photo (type + original size; it is shrunk before upload). Throws an Error with a user-facing message. */
export function validateImageFile(file) {
  if (!file || !TYPES[file.type]) throw new Error('Format gambar harus JPG, PNG, atau WebP.')
  if (file.size > SOURCE_MAX_BYTES) throw new Error('Ukuran gambar maksimal 15 MB.')
}

export const imageExtension = (file) => TYPES[file.type]

/** `file` must already be optimized (see optimizeImage); it is checked against the server limit. */
export async function uploadImage(path, file) {
  validateImageFile(file)
  if (file.size > IMAGE_MAX_BYTES) throw new Error('Gambar masih terlalu besar setelah dikecilkan. Coba foto lain.')
  await apiUpload(`/api/files?path=${encodeURIComponent(path)}`, file)
  return path
}

/** Best-effort delete: a leftover file is harmless, a thrown error would block the user. */
export async function deleteImage(path) {
  try {
    await apiFetch(`/api/files?path=${encodeURIComponent(path)}`, { method: 'DELETE' })
  } catch {
    // ignore
  }
}

/** Public images load straight from Supabase's public bucket; private payment proofs need a short-lived signed link. */
export async function getImageUrl(path) {
  if (path.includes('/payment-proofs/')) {
    const { url } = await apiFetch(`/api/files?path=${encodeURIComponent(path)}`)
    return url
  }
  const base = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/+$/, '')
  if (!base) throw new Error('Penyimpanan gambar belum dikonfigurasi')
  return `${base}/storage/v1/object/public/${PUBLIC_BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`
}
