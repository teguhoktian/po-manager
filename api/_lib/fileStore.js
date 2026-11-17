import { PRIVATE_BUCKET, PUBLIC_BUCKET } from '../../src/constants/storage.js'
import { HttpError } from './http.js'

/**
 * Image storage on Supabase Storage (REST API, service-role key; the browser never sees that key).
 * Paths keep the exact shape the app already stores in Firestore:
 *   sellers/{uid}/store/{file}                       → public bucket (logo)
 *   sellers/{uid}/products/{productId}/{file}        → public bucket (catalog)
 *   sellers/{uid}/payment-proofs/{orderId}/{file}    → private bucket (signed links only)
 */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024

const SEGMENT = '[A-Za-z0-9_-]{1,128}'
const FILE = '[A-Za-z0-9][A-Za-z0-9._-]{0,99}\\.(?:jpg|png|webp)'
const PUBLIC_RE = new RegExp(`^sellers/(${SEGMENT})/(?:store|products/${SEGMENT})/${FILE}$`)
const PROOF_RE = new RegExp(`^sellers/(${SEGMENT})/payment-proofs/${SEGMENT}/${FILE}$`)

export const isPublicPath = (path) => typeof path === 'string' && PUBLIC_RE.test(path)
export const isProofPath = (path) => typeof path === 'string' && PROOF_RE.test(path)
/** The seller UID embedded in a valid public or proof path, or null. */
export const ownerOf = (path) => (typeof path === 'string' ? (PUBLIC_RE.exec(path) ?? PROOF_RE.exec(path))?.[1] ?? null : null)

const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }
export const MIME_BY_EXT = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
export const extensionFor = (mime) => EXT_BY_MIME[mime] ?? null
export const mimeOf = (path) => MIME_BY_EXT[path.slice(path.lastIndexOf('.') + 1)] ?? null

/** Detect the real image type from file signature bytes; the declared Content-Type is never trusted. */
export function sniffImage(buffer) {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.toString('latin1', 0, 4) === 'RIFF' && buffer.toString('latin1', 8, 12) === 'WEBP') return 'image/webp'
  return null
}

// ---- Supabase REST ----

function config() {
  const url = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase Storage is not configured (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
  return { url: `${url}/storage/v1`, key }
}

const bucketFor = (path) => (isProofPath(path) ? PRIVATE_BUCKET : PUBLIC_BUCKET)
// Segments were validated by the regexes above, so encoding only guards against surprises.
const objectPath = (path) => path.split('/').map(encodeURIComponent).join('/')

async function call(method, route, { body, headers } = {}) {
  const { url, key } = config()
  let response
  try {
    response = await fetch(`${url}${route}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, apikey: key, ...headers },
      body,
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    throw new HttpError(502, 'Penyimpanan gambar sedang tidak bisa dihubungi. Coba lagi.')
  }
  return response
}

function assertValid(path) {
  if (!isPublicPath(path) && !isProofPath(path)) throw new HttpError(400, 'Path file tidak valid')
}

export async function saveFile(path, buffer, contentType = mimeOf(path)) {
  assertValid(path)
  const response = await call('POST', `/object/${bucketFor(path)}/${objectPath(path)}`, {
    body: buffer,
    headers: { 'Content-Type': contentType, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' },
  })
  if (!response.ok) {
    console.error('Supabase upload failed:', response.status)
    throw new HttpError(502, 'Gagal menyimpan gambar. Coba lagi.')
  }
}

export async function removeFile(path) {
  assertValid(path)
  const response = await call('DELETE', `/object/${bucketFor(path)}/${objectPath(path)}`)
  // Already gone is fine.
  if (!response.ok && response.status !== 404 && response.status !== 400) {
    console.error('Supabase delete failed:', response.status)
    throw new HttpError(502, 'Gagal menghapus gambar. Coba lagi.')
  }
}

/** Short-lived link to a private payment proof. */
export async function signProofUrl(path, ttlSeconds = 300) {
  if (!isProofPath(path)) throw new HttpError(400, 'Path file tidak valid')
  const response = await call('POST', `/object/sign/${PRIVATE_BUCKET}/${objectPath(path)}`, {
    body: JSON.stringify({ expiresIn: ttlSeconds }),
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) throw new HttpError(response.status === 404 || response.status === 400 ? 404 : 502, 'Bukti pembayaran tidak ditemukan')
  const { signedURL } = await response.json().catch(() => ({}))
  if (typeof signedURL !== 'string') throw new HttpError(502, 'Gagal membuat link bukti pembayaran')
  const { url } = config()
  return `${url}${signedURL.startsWith('/') ? '' : '/'}${signedURL}`
}

/** Public URL of an image in the public bucket (null when Supabase is not configured on this server). */
export function publicFileUrl(path) {
  const base = (process.env.SUPABASE_URL ?? '').replace(/\/+$/, '')
  if (!base || !isPublicPath(path)) return null
  return `${base}/storage/v1/object/public/${PUBLIC_BUCKET}/${objectPath(path)}`
}

/** Adapter used by submitPaymentProof: { save(path, buffer, contentType), remove(path) }. */
export const proofStorage = {
  save: (path, buffer, contentType) => saveFile(path, buffer, contentType),
  remove: (path) => removeFile(path),
}
