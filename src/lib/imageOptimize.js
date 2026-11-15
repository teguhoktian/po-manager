// Shrink a photo in the browser before it goes to Firebase Storage: most of the bandwidth bill is image downloads,
// so each stored image is a ~150–200 KB WebP (JPEG where WebP encoding is unavailable) instead of a multi-MB original.

const PRESETS = {
  product: { maxSide: 1200, targetBytes: 200_000 },
  logo: { maxSide: 400, targetBytes: 60_000 },
}
const QUALITIES = [0.82, 0.72, 0.62, 0.5, 0.4]
const PASSES = 3 // each extra pass also shrinks the pixel size by 20%

let webpSupported
const canEncodeWebp = () => (webpSupported ??= document.createElement('canvas').toDataURL('image/webp').startsWith('data:image/webp'))

const toBlob = (canvas, type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality))

/** Returns a File (image/webp or image/jpeg) that is as close to the kind's size budget as the source allows. */
export async function optimizeImage(file, kind = 'product') {
  const { maxSide, targetBytes } = PRESETS[kind]
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error('Gambar tidak bisa dibaca. Coba file lain.')
  }
  try {
    const type = canEncodeWebp() ? 'image/webp' : 'image/jpeg'
    const longest = Math.max(bitmap.width, bitmap.height)
    let side = Math.min(maxSide, longest)
    let best = null
    for (let pass = 0; pass < PASSES && (!best || best.size > targetBytes); pass += 1) {
      const scale = side / longest
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      const ctx = canvas.getContext('2d')
      if (type === 'image/jpeg') {
        ctx.fillStyle = '#fff' // JPEG has no transparency
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      for (const quality of QUALITIES) {
        const blob = await toBlob(canvas, type, quality)
        if (!blob) throw new Error('Gagal memproses gambar.')
        if (!best || blob.size < best.size) best = blob
        if (blob.size <= targetBytes) break
      }
      side = Math.round(side * 0.8)
    }
    // Already small and no bigger than what we produced: keep the original bytes.
    if (file.size <= targetBytes && file.size <= best.size && longest <= maxSide) return file
    const base = file.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([best], `${base}.${type === 'image/webp' ? 'webp' : 'jpg'}`, { type })
  } finally {
    bitmap.close?.()
  }
}
