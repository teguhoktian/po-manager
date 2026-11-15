/** "Nugget Ayam Pedas!" → "nugget-ayam-pedas" (ASCII, max 60 chars). */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '')
}

const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789' // no look-alikes (i, l, o, 0, 1)

/** Four random characters that make a store link unique without asking the seller for an address. */
export function randomCode(length = 4) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

/** "Dapur Kita" + "x7k2" → "dapur-kita-x7k2". Name part is capped so the whole link stays within the 40-character limit. */
export function storeSlugFrom(name, code) {
  const base = slugify(name).slice(0, 35).replace(/-+$/g, '')
  return base ? `${base}-${code}` : ''
}
