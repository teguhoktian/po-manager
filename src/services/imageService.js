import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { storage } from '../firebase/data'

/** Limit enforced by storage.rules, applied to the file AFTER optimization. */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024
/** Largest original the browser will try to shrink. */
export const SOURCE_MAX_BYTES = 15 * 1024 * 1024
/** Files get a unique name per upload, so browsers and the CDN may keep them for a year. */
export const IMAGE_CACHE_CONTROL = 'public, max-age=31536000, immutable'
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Checks a picked photo (type + original size; it is shrunk before upload). Throws an Error with a user-facing message. */
export function validateImageFile(file) {
  if (!file || !TYPES[file.type]) throw new Error('Format gambar harus JPG, PNG, atau WebP.')
  if (file.size > SOURCE_MAX_BYTES) throw new Error('Ukuran gambar maksimal 15 MB.')
}

export const imageExtension = (file) => TYPES[file.type]

/** `file` must already be optimized (see optimizeImage); it is checked against the storage.rules limit. */
export async function uploadImage(path, file) {
  validateImageFile(file)
  if (file.size > IMAGE_MAX_BYTES) throw new Error('Gambar masih terlalu besar setelah dikecilkan. Coba foto lain.')
  await uploadBytes(ref(storage, path), file, { contentType: file.type, cacheControl: IMAGE_CACHE_CONTROL })
  return path
}

/** Best-effort delete: a leftover file is harmless, a thrown error would block the user. */
export async function deleteImage(path) {
  try {
    await deleteObject(ref(storage, path))
  } catch {
    // ignore
  }
}

export const getImageUrl = (path) => getDownloadURL(ref(storage, path))
