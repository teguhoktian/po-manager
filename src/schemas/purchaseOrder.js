import { z } from 'zod'
import { PAYMENT_MODE, PO_ACTIONS } from '../constants/statuses.js'
import { longText, money, slug } from './common.js'

const title = z.string().trim().min(3, 'Judul minimal 3 karakter').max(120, 'Judul maksimal 120 karakter')
const nullableInt = (min, max) => z.number().int().min(min).max(max).nullable()
const blankToNull = (v) => (v === '' || v == null || Number.isNaN(v) ? null : v)

const poFields = (date) => ({
  title,
  slug,
  description: longText(2000),
  paymentMode: z.enum(Object.values(PAYMENT_MODE)),
  dpPercent: z.preprocess(blankToNull, nullableInt(1, 99)),
  openAt: date,
  closeAt: date,
  quota: z.preprocess(blankToNull, nullableInt(1, 100_000)),
  minOrderQty: z.number({ error: 'Wajib diisi' }).int('Harus bilangan bulat').min(1, 'Minimal 1').max(1000, 'Maksimal 1000'),
})

function poRules(po, ctx) {
  if (po.closeAt <= po.openAt) ctx.addIssue({ code: 'custom', path: ['closeAt'], message: 'Tanggal tutup harus setelah tanggal buka' })
  if (po.paymentMode === PAYMENT_MODE.DP && po.dpPercent === null)
    ctx.addIssue({ code: 'custom', path: ['dpPercent'], message: 'Persentase DP wajib diisi (1–99)' })
  if (po.paymentMode === PAYMENT_MODE.FULL && po.dpPercent !== null)
    ctx.addIssue({ code: 'custom', path: ['dpPercent'], message: 'DP hanya untuk mode DP' })
}

/** Editable PO fields. Status, counters, and close metadata are server-controlled and not part of this schema. */
export const purchaseOrderSchema = z.object(poFields(z.date())).superRefine(poRules)

/** Same rules for the form: dates arrive as `datetime-local` strings, blank quota/DP become null. */
const formDate = z
  .string()
  .min(1, 'Wajib diisi')
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), 'Tanggal tidak valid')

export const purchaseOrderFormSchema = z.object(poFields(formDate)).superRefine(poRules)

/** A leftover DP percentage must not block saving a FULL-payment PO. */
export const normalizePoFormValues = (values) => (values?.paymentMode === PAYMENT_MODE.FULL ? { ...values, dpPercent: '' } : values)

/** Body of POST /api/po/status. Strict: unknown keys are rejected. */
export const poTransitionSchema = z.strictObject({
  poId: z.string().min(1).max(128),
  action: z.enum(Object.keys(PO_ACTIONS)),
})

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1).max(128),
  variantId: z.string().min(1).max(128).nullable(),
  sellingPrice: money,
})
