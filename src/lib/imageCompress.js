const MAX_SIDE = 1600
const MAX_BYTES = 1_000_000
export const MAX_SOURCE_BYTES = 12 * 1024 * 1024

const toBlob = (canvas, quality) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(new Error('Gagal membaca gambar.'))
    reader.readAsDataURL(blob)
  })

/**
 * Shrink a photo (e.g. a transfer screenshot) to a JPEG under ~1 MB before upload, so it is fast on mobile data
 * and always within the server limit. Returns { base64, previewUrl }.
 */
export async function compressImage(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Pilih file gambar (JPG, PNG, atau WebP).')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Gambar terlalu besar (maks 12 MB).')

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('Gambar tidak bisa dibaca. Coba file lain.')
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff' // flatten transparency (PNG screenshots) instead of turning it black
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()

  let quality = 0.85
  let blob = await toBlob(canvas, quality)
  while (blob && blob.size > MAX_BYTES && quality > 0.4) {
    quality -= 0.15
    blob = await toBlob(canvas, quality)
  }
  if (!blob || blob.size > MAX_BYTES * 1.4) throw new Error('Gambar masih terlalu besar. Coba screenshot yang lebih kecil.')
  return { base64: await blobToBase64(blob), previewUrl: URL.createObjectURL(blob) }
}
