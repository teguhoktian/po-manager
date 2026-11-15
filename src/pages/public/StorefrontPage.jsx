import { useParams } from 'react-router-dom'
import { PackageOpen, SearchX } from 'lucide-react'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { PoListItem, StoreHeader } from '../../components/storefront'
import { usePublicStore } from '../../hooks/usePublicData'
import { useNow } from '../../hooks/useNow'

export default function StorefrontPage() {
  const { storeSlug } = useParams()
  const { data, error, loading, reload } = usePublicStore(storeSlug)
  const now = useNow()

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }
  if (error?.status === 404) {
    return <EmptyState icon={SearchX} title="Toko tidak ditemukan" description="Periksa kembali link yang Anda terima dari penjual." />
  }
  if (error) return <ErrorState title="Gagal memuat toko" description="Periksa koneksi Anda lalu coba lagi." onRetry={reload} />

  const { store, orders } = data
  return (
    <div className="space-y-5">
      <title>{`${store.name} · Pre-order`}</title>
      <StoreHeader store={store} />
      <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Pre-order</h2>
      {orders.length === 0 ? (
        <EmptyState icon={PackageOpen} title="Belum ada pre-order" description="Penjual belum membuka pre-order. Cek lagi nanti." />
      ) : (
        <div className="space-y-3">
          {orders.map((po) => (
            <PoListItem key={po.id} storeSlug={store.slug} po={po} now={now} />
          ))}
        </div>
      )}
    </div>
  )
}
