import { z } from 'zod'
import { longText, shortText, whatsappNumber } from './common.js'
import { storeSlug } from './store.js'
import { MAX_MONEY, slug } from './common.js'

export const MAX_CHECKOUT_LINES = 30
export const MAX_LINE_QUANTITY = 100

export const customerSchema = z.strictObject({
  name: shortText(80, 'Nama').pipe(z.string().min(2, 'Nama minimal 2 karakter')),
  whatsapp: whatsappNumber,
  address: longText(300).pipe(z.string().min(5, 'Alamat minimal 5 karakter')),
})

/** Same fields for the browser form (before normalisation by whatsappNumber). */
export const checkoutFormSchema = customerSchema

/**
 * Public checkout request. Prices and totals are deliberately NOT part of it: the server derives them
 * from stored prices. `website` is a honeypot that real users never fill.
 */
export const checkoutSchema = z.strictObject({
  storeSlug,
  poSlug: slug,
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, 'Kunci idempotensi tidak valid'),
  customer: customerSchema,
  items: z
    .array(
      z.strictObject({
        itemId: z.string().min(1).max(40),
        quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
      }),
    )
    .min(1, 'Keranjang kosong')
    .max(MAX_CHECKOUT_LINES)
    .refine((items) => new Set(items.map((i) => i.itemId)).size === items.length, 'Ada barang yang dobel'),
  website: z.string().max(0).optional(),
})

export const orderCancelSchema = z.strictObject({
  orderId: z.string().min(1).max(40),
  reason: z.string().trim().max(200, 'Alasan maksimal 200 karakter').optional(),
  // Required to cancel an order that already has verified payments: the seller confirms the money is returned.
  refund: z.boolean().optional(),
})

const accessToken = z.string().regex(/^[A-Za-z0-9_-]{20,64}$/, 'Token tidak valid')
const orderNumber = z.string().trim().min(3).max(40)

/** Buyer-side order lookup: order number + the secret token from the order link. */
export const orderLookupSchema = z.strictObject({ storeSlug, orderNumber, token: accessToken })

/** Buyer-side tracking without the order link: order number + the WhatsApp number used at checkout. */
export const orderTrackSchema = z.strictObject({ orderNumber: orderNumber.transform((v) => v.toUpperCase()), whatsapp: whatsappNumber })

export const MAX_PROOF_BYTES = 1_500_000

/** Payment proof upload: image as base64 (the browser compresses it first). */
export const paymentProofSchema = z.strictObject({
  storeSlug,
  orderNumber,
  token: accessToken,
  image: z.string().min(100).max(Math.ceil((MAX_PROOF_BYTES * 4) / 3) + 8, 'Gambar terlalu besar'),
  note: z.string().trim().max(200, 'Catatan maksimal 200 karakter').optional(),
})

/** Seller verifies or rejects a submitted proof. `amount` = what really arrived (defaults to the expected amount). */
export const paymentActionSchema = z
  .strictObject({
    paymentId: z.string().min(1).max(40),
    action: z.enum(['verify', 'reject']),
    amount: z.number().int().min(1).max(MAX_MONEY).optional(),
    reason: z.string().trim().max(200, 'Alasan maksimal 200 karakter').optional(),
  })
  .refine((v) => v.action !== 'reject' || (v.reason && v.reason.length >= 3), { message: 'Tulis alasan penolakan', path: ['reason'] })

/** Seller records a payment received outside the app (cash, transfer confirmed on WhatsApp, …). */
export const paymentRecordSchema = z.strictObject({
  orderId: z.string().min(1).max(40),
  amount: z.number().int().min(1).max(MAX_MONEY),
  note: z.string().trim().max(200, 'Catatan maksimal 200 karakter').optional(),
})

const FULFILLMENT_VALUES = ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'COMPLETED']

export const shipmentSchema = z.strictObject({
  carrier: z.string().trim().min(2, 'Kurir wajib diisi').max(40, 'Maksimal 40 karakter'),
  trackingNumber: z
    .string()
    .trim()
    .max(60, 'Maksimal 60 karakter')
    .regex(/^[A-Za-z0-9 ./-]*$/, 'Hanya huruf, angka, spasi, titik, garis miring, dan strip')
    .optional(),
  note: z.string().trim().max(200, 'Catatan maksimal 200 karakter').optional(),
})

/** Move one order to another fulfilment step. Shipping needs courier details. */
export const fulfillmentSchema = z
  .strictObject({
    orderId: z.string().min(1).max(40),
    status: z.enum(FULFILLMENT_VALUES),
    shipment: shipmentSchema.optional(),
  })
  .refine((v) => v.status !== 'SHIPPED' || v.shipment, { message: 'Isi data pengiriman', path: ['shipment'] })

/** Same step for many orders at once (preparing/packing only: no courier data needed). */
export const fulfillmentBulkSchema = z.strictObject({
  orderIds: z.array(z.string().min(1).max(40)).min(1, 'Pilih pesanan').max(50, 'Maksimal 50 pesanan sekali proses'),
  status: z.enum(['PROCESSING', 'PACKED']),
})

export const shipmentUpdateSchema = shipmentSchema.extend({ orderId: z.string().min(1).max(40) })
