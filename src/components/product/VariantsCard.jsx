import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Input, Skeleton } from '../ui'
import { variantFormSchema } from '../../schemas/product'
import { useVariants } from '../../hooks/useProducts'
import { createVariant, setVariantStatus, updateVariant } from '../../services/productService'
import { CATALOG_STATUS } from '../../constants/statuses'
import { describeFirebaseError } from '../../lib/firebaseErrors'
import { formatRupiah } from '../../lib/format'

const numberOpts = { valueAsNumber: true }

function VariantForm({ variant, defaults, onSubmit, onCancel }) {
  const [formError, setFormError] = useState('')
  const {
    register, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: variant?.name ?? '',
      sellingPrice: variant?.sellingPrice ?? defaults.sellingPrice,
      purchaseCost: variant?.purchaseCost ?? defaults.purchaseCost,
      stock: variant?.stock ?? 0,
    },
  })

  const submit = async (values) => {
    setFormError('')
    try {
      await onSubmit(values)
    } catch (error) {
      setFormError(describeFirebaseError(error, 'Gagal menyimpan varian.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
      {formError && <p role="alert" className="text-sm text-red-600">{formError}</p>}
      <Input label="Nama varian" placeholder="Contoh: Pedas, XL, Merah" error={errors.name?.message} {...register('name')} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Harga jual" type="number" inputMode="numeric" min={0} step={1} error={errors.sellingPrice?.message} {...register('sellingPrice', numberOpts)} />
        <Input label="Harga modal" type="number" inputMode="numeric" min={0} step={1} error={errors.purchaseCost?.message} {...register('purchaseCost', numberOpts)} />
      </div>
      <Input label="Stok" type="number" inputMode="numeric" min={0} step={1} error={errors.stock?.message} {...register('stock', numberOpts)} />
      <div className="flex gap-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">Batal</Button>
        <Button type="submit" loading={isSubmitting} className="flex-1">Simpan</Button>
      </div>
    </form>
  )
}

export function VariantsCard({ uid, product }) {
  const { data: variants, loading, error, reload } = useVariants(product.id)
  const [editing, setEditing] = useState(null) // 'new' | variant id | null

  const defaults = { sellingPrice: product.sellingPrice, purchaseCost: product.purchaseCost }

  const save = (variant) => async (values) => {
    if (variant) await updateVariant(variant.id, values)
    else await createVariant(uid, product.id, values)
    setEditing(null)
    reload()
  }

  const toggle = async (variant) => {
    const next = variant.status === CATALOG_STATUS.ACTIVE ? CATALOG_STATUS.ARCHIVED : CATALOG_STATUS.ACTIVE
    try {
      await setVariantStatus(variant.id, next)
      reload()
    } catch {
      // The list stays unchanged; user can retry.
    }
  }

  if (!product.hasVariants) {
    return (
      <Card>
        <CardHeader title="Varian" />
        <CardBody>
          <p className="text-sm text-slate-500">
            Aktifkan “Produk punya varian” pada form di atas, lalu simpan, untuk mengelola varian.
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Varian"
        description="Setiap varian punya harga dan stok sendiri."
        action={
          editing !== 'new' && (
            <Button size="sm" variant="secondary" onClick={() => setEditing('new')}>
              <Plus className="size-4" aria-hidden="true" /> Tambah
            </Button>
          )
        }
      />
      <CardBody className="space-y-3">
        {editing === 'new' && <VariantForm defaults={defaults} onSubmit={save(null)} onCancel={() => setEditing(null)} />}

        {loading && !variants ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} className="py-4" />
        ) : variants?.length ? (
          <ul className="space-y-2">
            {variants.map((variant) =>
              editing === variant.id ? (
                <li key={variant.id}>
                  <VariantForm variant={variant} defaults={defaults} onSubmit={save(variant)} onCancel={() => setEditing(null)} />
                </li>
              ) : (
                <li key={variant.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {variant.name}{' '}
                      {variant.status === CATALOG_STATUS.ARCHIVED && <Badge tone="neutral">Arsip</Badge>}
                    </p>
                    <p className="text-sm text-slate-500">{formatRupiah(variant.sellingPrice)} · Stok {variant.stock}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(variant.id)}>Ubah</Button>
                    <Button size="sm" variant="ghost" onClick={() => toggle(variant)}>
                      {variant.status === CATALOG_STATUS.ACTIVE ? 'Arsipkan' : 'Pulihkan'}
                    </Button>
                  </div>
                </li>
              ),
            )}
          </ul>
        ) : (
          editing !== 'new' && <EmptyState title="Belum ada varian" description="Tambahkan varian pertama untuk produk ini." className="py-6" />
        )}
      </CardBody>
    </Card>
  )
}
