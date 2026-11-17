import { extensionFor, IMAGE_MAX_BYTES, isProofPath, isPublicPath, ownerOf, removeFile, saveFile, signProofUrl, sniffImage } from './_lib/fileStore.js'
import { adminDb } from './_lib/firebaseAdmin.js'
import { handler, HttpError, sendJson } from './_lib/http.js'
import { consumeRateLimit } from './_lib/rateLimit.js'
import { requireAuth } from './_lib/requireAuth.js'

/** Raw request bytes. Vercel hands over a Buffer for octet-stream; fall back to reading the stream. */
async function readBytes(req) {
  if (Buffer.isBuffer(req.body)) return req.body
  if (req.body !== undefined && req.body !== null) throw new HttpError(400, 'Body tidak valid')
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > IMAGE_MAX_BYTES) throw new HttpError(413, 'Ukuran gambar maksimal 2 MB')
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

const pathParam = (req) => String(req.query?.path ?? '')

/**
 * Image files for the signed-in seller (Supabase Storage behind this endpoint; the service key stays on the server).
 *   PUT    /api/files?path=…   upload a logo / product photo (raw bytes, Content-Type application/octet-stream)
 *   DELETE /api/files?path=…   delete one of the seller's own public images
 *   GET    /api/files?path=…   short-lived link to one of the seller's own payment proofs
 * The seller UID inside the path must equal the verified caller; anything else is 403.
 */
export default handler(['PUT', 'DELETE', 'GET'], async (req, res) => {
  const { uid } = await requireAuth(req)
  const path = pathParam(req)

  if (req.method === 'GET') {
    if (!isProofPath(path) || ownerOf(path) !== uid) throw new HttpError(403, 'Forbidden')
    return sendJson(res, 200, { url: await signProofUrl(path) })
  }

  if (!isPublicPath(path) || ownerOf(path) !== uid) throw new HttpError(403, 'Forbidden')

  if (req.method === 'DELETE') {
    await removeFile(path)
    return sendJson(res, 200, { ok: true })
  }

  const body = await readBytes(req)
  if (body.length === 0) throw new HttpError(400, 'File kosong')
  if (body.length > IMAGE_MAX_BYTES) throw new HttpError(413, 'Ukuran gambar maksimal 2 MB')
  const mime = sniffImage(body)
  if (!mime) throw new HttpError(400, 'File harus berupa gambar JPG, PNG, atau WebP.')
  if (extensionFor(mime) !== path.slice(path.lastIndexOf('.') + 1)) throw new HttpError(400, 'Ekstensi file tidak sesuai isi gambar.')
  await consumeRateLimit(adminDb(), { bucket: 'file-upload', id: uid, limit: 120, windowMs: 60 * 60_000 })
  await saveFile(path, body, mime)
  sendJson(res, 201, { path })
})
