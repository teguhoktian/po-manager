import { z } from 'zod'
import { CATALOG_STATUS } from '../constants/statuses.js'
import { longText, money, shortText, slug } from './common.js'

const status = z.enum(Object.values(CATALOG_STATUS))
const stock = z.number().int().min(0).max(1_000_000)

export const productSchema = z.object({
  name: shortText(120, 'Nama produk'),
  slug,
  description: longText(2000),
  imagePaths: z.array(z.string().max(200)).max(5, 'Maksimal 5 gambar'),
  sellingPrice: money,
  purchaseCost: money,
  trackStock: z.boolean(),
  stock,
  hasVariants: z.boolean(),
  status,
})

export const variantSchema = z.object({
  name: shortText(80, 'Nama varian'),
  sellingPrice: money,
  purchaseCost: money,
  stock,
  status,
})

/** Form inputs may be blank/NaN when stock tracking is off; treat as 0. */
const formStock = z.preprocess((v) => (v === '' || v == null || Number.isNaN(v) ? 0 : v), stock)

/** Product form fields. Images and status are managed outside the form. */
export const productFormSchema = productSchema.omit({ imagePaths: true, status: true }).extend({ stock: formStock })

export const variantFormSchema = variantSchema.omit({ status: true }).extend({ stock: formStock })
