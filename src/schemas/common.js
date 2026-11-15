import { z } from 'zod'

/** Amounts are whole rupiah (integers). Floats are never stored for money. */
export const MAX_MONEY = 1_000_000_000

export const money = z.number({ error: 'Wajib diisi' }).int('Harus bilangan bulat').min(0, 'Tidak boleh negatif').max(MAX_MONEY, 'Terlalu besar')

export const slug = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Minimal 3 karakter')
  .max(60, 'Maksimal 60 karakter')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Hanya huruf kecil, angka, dan tanda hubung')

/** Normalise Indonesian WhatsApp numbers to digits-only international form (e.g. 0812… → 62812…). */
export const whatsappNumber = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()+-]/g, ''))
  .transform((v) => (v.startsWith('0') ? `62${v.slice(1)}` : v))
  .pipe(z.string().regex(/^[1-9]\d{7,14}$/, 'Nomor WhatsApp tidak valid'))

export const shortText = (max, label = 'Teks') => z.string().trim().min(1, `${label} wajib diisi`).max(max, `${label} maksimal ${max} karakter`)

export const longText = (max) => z.string().trim().max(max, `Maksimal ${max} karakter`)
