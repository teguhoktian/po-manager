import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, Checkbox, Input, Textarea } from '../ui'
import { ProductImagesField } from './ProductImagesField'
import { productFormSchema } from '../../schemas/product'
import { isProductSlugTaken, saveProduct } from '../../services/productService'
import { describeFirebaseError } from '../../lib/firebaseErrors'
import { calcMargin, formatRupiah } from '../../lib/format'
import { slugify } from '../../lib/slugify'

const numberOpts = { valueAsNumber: true }

export function ProductForm({ uid, productId, product, onSaved }) {
  const isNew = !product
  const [images, setImages] = useState(() => (product?.imagePaths ?? []).map((path) => ({ key: path, path })))
  const [formError, setFormError] = useState('')
  const slugTouched = useRef(!isNew)

  const {
    register, handleSubmit, setValue, setError, control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      description: product?.description ?? '',
      sellingPrice: product?.sellingPrice ?? '',
      purchaseCost: product?.purchaseCost ?? '',
      trackStock: product?.trackStock ?? false,
      stock: product?.stock ?? 0,
      hasVariants: product?.hasVariants ?? false,
    },
  })

  const [price, cost, trackStock] = useWatch({ control, name: ['sellingPrice', 'purchaseCost', 'trackStock'] })
  const margin = calcMargin(price, cost)
  const showMargin = Number.isFinite(price) && Number.isFinite(cost)

  const nameField = register('name')
  const slugField = register('slug')

  const onSubmit = async (values) => {
    setFormError('')
    try {
      if (await isProductSlugTaken(uid, values.slug, productId)) {
        setError('slug', { message: 'Alamat produk sudah dipakai produk lain' })
        return
      }
      await saveProduct({ uid, productId, isNew, values, images, previousPaths: product?.imagePaths ?? [] })
      onSaved(productId, isNew)
    } catch (error) {
      setFormError(error?.code ? describeFirebaseError(error) : error?.message || 'Gagal menyimpan produk.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Card>
        <CardHeader title="Informasi produk" />
        <CardBody className="space-y-4">
          <Input
            label="Nama produk"
            error={errors.name?.message}
            {...nameField}
            onChange={(e) => {
              nameField.onChange(e)
              if (!slugTouched.current) setValue('slug', slugify(e.target.value), { shouldValidate: false })
            }}
          />
          <Input
            label="Alamat produk (slug)"
            hint="Dipakai di link pemesanan. Terisi otomatis dari nama."
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.slug?.message}
            {...slugField}
            onChange={(e) => {
              slugTouched.current = true
              slugField.onChange(e)
            }}
          />
          <Textarea label="Deskripsi" rows={4} error={errors.description?.message} {...register('description')} />
          <ProductImagesField images={images} onChange={setImages} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Harga dan stok" />
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Harga jual (Rp)"
              type="number" inputMode="numeric" min={0} step={1}
              hint={Number.isFinite(price) ? formatRupiah(price) : undefined}
              error={errors.sellingPrice?.message}
              {...register('sellingPrice', numberOpts)}
            />
            <Input
              label="Harga modal (Rp)"
              type="number" inputMode="numeric" min={0} step={1}
              hint={Number.isFinite(cost) ? formatRupiah(cost) : 'Hanya terlihat olehmu.'}
              error={errors.purchaseCost?.message}
              {...register('purchaseCost', numberOpts)}
            />
          </div>
          {showMargin && (
            <p className={margin.amount < 0 ? 'text-sm font-medium text-red-600' : 'text-sm font-medium text-emerald-700'}>
              Margin per unit: {formatRupiah(margin.amount)}
              {margin.percent !== null && ` (${margin.percent}%)`}
            </p>
          )}

          <Checkbox label="Lacak stok" hint="Aktifkan jika stok produk terbatas." {...register('trackStock')} />
          {trackStock && (
            <Input label="Jumlah stok" type="number" inputMode="numeric" min={0} step={1} error={errors.stock?.message} {...register('stock', numberOpts)} />
          )}

          <Checkbox
            label="Produk punya varian"
            hint="Contoh: rasa, ukuran, warna. Varian dikelola setelah produk disimpan."
            {...register('hasVariants')}
          />
        </CardBody>
      </Card>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        {isNew ? 'Simpan produk' : 'Simpan perubahan'}
      </Button>
    </form>
  )
}
