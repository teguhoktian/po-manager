import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { ProductForm } from '../../components/product/ProductForm'
import { VariantsCard } from '../../components/product/VariantsCard'
import { useAuth } from '../../hooks/useAuth'
import { useProduct } from '../../hooks/useProducts'
import { newProductId, setProductStatus } from '../../services/productService'
import { CATALOG_STATUS } from '../../constants/statuses'

function BackLink() {
  return (
    <Link to="/dashboard/products" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
      <ArrowLeft className="size-4" aria-hidden="true" /> Semua produk
    </Link>
  )
}

function NewProduct() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [productId] = useState(newProductId)

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink />
      <h2 className="mb-4 text-xl font-bold text-slate-900">Produk baru</h2>
      <ProductForm uid={user.uid} productId={productId} product={null} onSaved={(id) => navigate(`/dashboard/products/${id}`, { replace: true })} />
    </div>
  )
}

function ExistingProduct({ productId }) {
  const { user } = useAuth()
  const { data: product, loading, error, reload } = useProduct(productId)
  const [notice, setNotice] = useState('')
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="mx-auto max-w-2xl space-y-3"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>
  if (error) return <Card><ErrorState description={error} onRetry={reload} /></Card>
  if (!product) {
    return <Card><EmptyState title="Produk tidak ditemukan" action={<Button to="/dashboard/products">Kembali</Button>} /></Card>
  }

  const archived = product.status === CATALOG_STATUS.ARCHIVED

  const changeStatus = async () => {
    setBusy(true)
    try {
      await setProductStatus(product.id, archived ? CATALOG_STATUS.ACTIVE : CATALOG_STATUS.ARCHIVED)
      setNotice(archived ? 'Produk dipulihkan.' : 'Produk diarsipkan.')
      reload()
    } finally {
      setBusy(false)
      setConfirmArchive(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <BackLink />
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-xl font-bold text-slate-900">
            {product.name} {archived && <Badge>Arsip</Badge>}
          </h2>
          <Button variant="secondary" size="sm" onClick={() => (archived ? changeStatus() : setConfirmArchive(true))} loading={busy && archived}>
            {archived ? 'Pulihkan' : 'Arsipkan'}
          </Button>
        </div>
      </div>

      {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-700">{notice}</p>}

      <ProductForm
        key={product.updatedAt?.seconds ?? 'initial'}
        uid={user.uid}
        productId={product.id}
        product={product}
        onSaved={() => {
          setNotice('Perubahan disimpan.')
          reload()
        }}
      />

      <VariantsCard key={`v-${product.hasVariants}`} uid={user.uid} product={product} />

      <ConfirmDialog
        open={confirmArchive}
        title="Arsipkan produk?"
        description="Produk tidak akan muncul untuk PO baru. Riwayat pesanan tetap tersimpan, dan kamu bisa memulihkannya kapan saja."
        confirmLabel="Ya, arsipkan"
        loading={busy}
        onConfirm={changeStatus}
        onCancel={() => setConfirmArchive(false)}
      />
    </div>
  )
}

export default function ProductEditPage() {
  const { productId } = useParams()
  return productId ? <ExistingProduct key={productId} productId={productId} /> : <NewProduct />
}
