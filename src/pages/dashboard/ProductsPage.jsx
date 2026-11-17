import { useMemo, useState } from 'react'
import { Package, Plus, Search, Store } from 'lucide-react'
import { Button, Card, CardBody, EmptyState, ErrorState, Input, Skeleton } from '../../components/ui'
import { ProductCard } from '../../components/product/ProductCard'
import { useProducts } from '../../hooks/useProducts'
import { useStore } from '../../hooks/useStore'
import { CATALOG_STATUS } from '../../constants/statuses'
import { cn } from '../../lib/cn'

const TABS = [
  { key: CATALOG_STATUS.ACTIVE, label: 'Aktif' },
  { key: CATALOG_STATUS.ARCHIVED, label: 'Arsip' },
]

export default function ProductsPage() {
  const store = useStore()
  const { data: products, loading, error, reload } = useProducts()
  const [tab, setTab] = useState(CATALOG_STATUS.ACTIVE)
  const [search, setSearch] = useState('')

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return (products ?? []).filter((p) => p.status === tab && (!needle || p.name.toLowerCase().includes(needle)))
  }, [products, tab, search])

  if (!store.loading && !store.error && !store.store) {
    return (
      <Card>
        <EmptyState
          icon={Store}
          title="Buat toko dulu"
          description="Produk terhubung ke tokomu. Buat toko terlebih dahulu."
          action={<Button to="/dashboard/store">Buat toko</Button>}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div role="tablist" aria-label="Status produk" className="inline-flex rounded-xl bg-slate-200/70 p-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn('h-9 rounded-lg px-4 text-sm font-medium', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600')}
            >
              {label}
            </button>
          ))}
        </div>
        <Button to="/dashboard/products/new">
          <Plus className="size-4" aria-hidden="true" /> Tambah
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <Input aria-label="Cari produk" placeholder="Cari produk…" value={search} onChange={(e) => setSearch(e.target.value)} className="[&_input]:pl-10" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Card key={i}><CardBody className="flex gap-3"><Skeleton className="size-20" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-1/3" /></div></CardBody></Card>
          ))}
        </div>
      ) : error ? (
        <Card><ErrorState description={error} onRetry={reload} /></Card>
      ) : visible.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={Package}
            title={search ? 'Produk tidak ditemukan' : tab === CATALOG_STATUS.ACTIVE ? 'Belum ada produk' : 'Tidak ada produk diarsipkan'}
            description={search ? 'Coba kata kunci lain.' : tab === CATALOG_STATUS.ACTIVE ? 'Tambahkan produk pertamamu untuk mulai membuat PO.' : undefined}
            action={!search && tab === CATALOG_STATUS.ACTIVE ? <Button to="/dashboard/products/new">Tambah produk</Button> : undefined}
          />
        </Card>
      )}
    </div>
  )
}
