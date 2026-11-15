import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, ErrorState, Skeleton } from '../ui'
import { StorageImage } from '../product/StorageImage'
import { useAsyncData } from '../../hooks/useAsyncData'
import { usePoItems } from '../../hooks/usePurchaseOrders'
import { listProducts, listVariants } from '../../services/productService'
import { addPoItem, removePoItem, updatePoItemPrice } from '../../services/purchaseOrderService'
import { describeFirebaseError } from '../../lib/firebaseErrors'
import { formatRupiah } from '../../lib/format'
import { MAX_MONEY } from '../../schemas/common'

const itemKey = (productId, variantId) => `${productId}:${variantId ?? ''}`

function ItemPrice({ item, onSave }) {
  const [value, setValue] = useState(String(item.sellingPrice))
  const [error, setError] = useState('')

  const commit = async () => {
    const n = Number(value)
    if (value.trim() === '' || !Number.isInteger(n) || n < 0 || n > MAX_MONEY) return setError('Harga tidak valid')
    setError('')
    if (n !== item.sellingPrice) await onSave(item.id, n)
  }

  return (
    <div className="w-full sm:w-32">
      <span aria-hidden="true" className="mb-1 block text-xs text-slate-500">Harga jual (Rp)</span>
      <input
        aria-label={`Harga ${item.productName}`}
        type="number" inputMode="numeric" min={0} step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-10 w-full rounded-lg border border-slate-300 px-2.5 text-right text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
      />
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function VariantChoices({ uid, product, taken, onAdd }) {
  const { data: variants, loading, error } = useAsyncData(() => listVariants(uid, product.id), product.id, 'Gagal memuat varian.')
  if (loading) return <Skeleton className="h-10 w-full" />
  if (error) return <p className="text-sm text-red-600">{error}</p>
  const active = (variants ?? []).filter((v) => v.status === 'ACTIVE')
  if (!active.length) return <p className="text-sm text-slate-500">Belum ada varian aktif. Tambahkan di halaman produk.</p>
  return (
    <ul className="space-y-1.5">
      {active.map((variant) => (
        <li key={variant.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="min-w-0 text-sm">{variant.name} · {formatRupiah(variant.sellingPrice)}</span>
          <Button size="sm" variant="secondary" disabled={taken.has(itemKey(product.id, variant.id))} onClick={() => onAdd({ productId: product.id, variantId: variant.id, sellingPrice: variant.sellingPrice })}>
            {taken.has(itemKey(product.id, variant.id)) ? 'Ditambahkan' : 'Tambah'}
          </Button>
        </li>
      ))}
    </ul>
  )
}

function ProductPicker({ uid, taken, onAdd }) {
  const { data: products, loading, error } = useAsyncData(() => listProducts(uid), uid, 'Gagal memuat produk.')
  const [open, setOpen] = useState(null)

  if (loading) return <Skeleton className="h-24 w-full" />
  if (error) return <p className="text-sm text-red-600">{error}</p>
  const active = (products ?? []).filter((p) => p.status === 'ACTIVE')
  if (!active.length) {
    return <EmptyState title="Belum ada produk aktif" description="Tambahkan produk dulu di menu Produk." action={<Button to="/dashboard/products/new" size="sm">Tambah produk</Button>} className="py-6" />
  }

  return (
    <ul className="space-y-2">
      {active.map((product) => (
        <li key={product.id} className="rounded-xl border border-slate-200 p-3">
          <div className="flex items-center gap-3">
            <StorageImage path={product.imagePaths?.[0]} className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">{product.name}</p>
              <p className="text-xs text-slate-500">{product.hasVariants ? 'Punya varian' : formatRupiah(product.sellingPrice)}</p>
            </div>
            {product.hasVariants ? (
              <Button size="sm" variant="secondary" aria-expanded={open === product.id} onClick={() => setOpen(open === product.id ? null : product.id)}>
                Pilih varian
              </Button>
            ) : (
              <Button size="sm" variant="secondary" disabled={taken.has(itemKey(product.id, null))} onClick={() => onAdd({ productId: product.id, variantId: null, sellingPrice: product.sellingPrice })}>
                {taken.has(itemKey(product.id, null)) ? 'Ditambahkan' : 'Tambah'}
              </Button>
            )}
          </div>
          {open === product.id && <div className="mt-3"><VariantChoices uid={uid} product={product} taken={taken} onAdd={onAdd} /></div>}
        </li>
      ))}
    </ul>
  )
}

export function PoItemsCard({ uid, po, editable }) {
  const { data: items, loading, error, reload } = usePoItems(po.id)
  const [picking, setPicking] = useState(false)
  const [actionError, setActionError] = useState('')

  const run = async (fn) => {
    setActionError('')
    try {
      await fn()
      reload()
    } catch (e) {
      setActionError(describeFirebaseError(e, 'Perubahan gagal disimpan.'))
    }
  }

  const taken = new Set((items ?? []).map((i) => itemKey(i.productId, i.variantId)))

  return (
    <Card>
      <CardHeader
        title="Produk dalam PO"
        description={editable ? 'Harga di sini dipakai untuk pesanan PO ini.' : undefined}
        action={editable && (
          <Button size="sm" variant={picking ? 'ghost' : 'secondary'} onClick={() => setPicking((v) => !v)}>
            {picking ? 'Selesai' : <><Plus className="size-4" aria-hidden="true" /> Tambah</>}
          </Button>
        )}
      />
      <CardBody className="space-y-3">
        {actionError && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{actionError}</p>}

        {editable && picking && (
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3">
            <ProductPicker uid={uid} taken={taken} onAdd={(item) => run(() => addPoItem(uid, po.id, item))} />
          </div>
        )}

        {loading && !items ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} className="py-4" />
        ) : items?.length ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-slate-200 p-3">
                <StorageImage path={item.imagePath} className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-words text-slate-900">{item.productName}</p>
                  {item.variantName && <p className="text-xs break-words text-slate-500">{item.variantName}</p>}
                  {item.unavailable && <Badge tone="danger" className="mt-1">Tidak tersedia</Badge>}
                  {!editable && <p className="text-sm text-slate-700">{formatRupiah(item.sellingPrice)}</p>}
                </div>
                {editable && (
                  <>
                    <button
                      type="button"
                      aria-label={`Hapus ${item.productName}`}
                      onClick={() => run(() => removePoItem(item.id))}
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 sm:order-4"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                    <div className="basis-full sm:order-3 sm:basis-auto">
                      <ItemPrice key={item.sellingPrice} item={item} onSave={(id, price) => run(() => updatePoItemPrice(id, price))} />
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Belum ada produk" description={editable ? 'Tambahkan minimal satu produk sebelum PO dipublikasikan.' : undefined} className="py-6" />
        )}
      </CardBody>
    </Card>
  )
}
