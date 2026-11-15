import { z } from 'zod'
import { longText, shortText, whatsappNumber } from './common.js'

/** Slugs that would collide with app routes or look official. */
export const RESERVED_SLUGS = [
  'api', 'admin', 'app', 'assets', 'dashboard', 'login', 'register', 'logout', 'po', 'store', 'stores',
  'static', 'www', 'help', 'support', 'about', 'terms', 'privacy', 'settings', 'null', 'undefined',
]

export const storeSlug = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Minimal 3 karakter')
  .max(40, 'Maksimal 40 karakter')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung')
  .refine((v) => !RESERVED_SLUGS.includes(v), 'Alamat ini tidak tersedia')

const storeName = shortText(80, 'Nama toko')

/** Editable profile fields (written by the seller's browser; slug is server-controlled). */
export const storeProfileSchema = z.object({
  name: storeName,
  description: longText(500),
  whatsappNumber,
  // Free text shown to buyers after checkout (bank / e-wallet details).
  paymentInfo: longText(500),
})

/** First-time store creation (server endpoint). Strict: unknown keys are rejected. */
export const storeCreateSchema = z.strictObject({
  name: storeName,
  slug: storeSlug,
  description: longText(500),
  whatsappNumber,
})

export const storeSlugChangeSchema = z.strictObject({ slug: storeSlug })
