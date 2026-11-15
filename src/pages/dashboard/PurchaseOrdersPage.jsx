import { useMemo, useState } from 'react'
import { CalendarClock, Plus, Store } from 'lucide-react'
import { Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { PoCard } from '../../components/po/PoCard'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useStore } from '../../hooks/useStore'
import { PO_GROUPS } from '../../lib/poStatus'
import { cn } from '../../lib/cn'

export default function PurchaseOrdersPage() {
  const store = useStore()
  const { data: orders, loading, error, reload } = usePurchaseOrders()
  const [tab, setTab] = useState('active')

  const counts = useMemo(
    () => Object.fromEntries(PO_GROUPS.map((g) => [g.key, (orders ?? []).filter((o) => g.statuses.includes(o.status)).length])),
    [orders],
  )
  const visible = useMemo(() => {
    const group = PO_GROUPS.find((g) => g.key === tab)
    return (orders ?? []).filter((o) => group.statuses.includes(o.status))
  }, [orders, tab])

  if (!store.loading && !store.error && !store.store) {
    return (
      <Card>
        <EmptyState icon={Store} title="Buat toko dulu" description="PO terhubung ke tokomu. Buat toko terlebih dahulu." action={<Button to="/dashboard/store">Buat toko</Button>} />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Pre-order</h2>
        <Button to="/dashboard/po/new">
          <Plus className="size-4" aria-hidden="true" /> Buat PO
        </Button>
      </div>

      <div role="tablist" aria-label="Status PO" className="grid grid-cols-4 gap-1 rounded-xl bg-slate-200/70 p-1">
        {PO_GROUPS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={cn('min-h-10 rounded-lg px-1 text-sm font-medium', tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600')}
          >
            {label}
            {!loading && !error && <span className="ml-1 text-xs text-slate-500">{counts[key]}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => (
            <Card key={i}><CardBody className="space-y-3"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-2 w-full" /></CardBody></Card>
          ))}
        </div>
      ) : error ? (
        <Card><ErrorState description={error} onRetry={reload} /></Card>
      ) : visible.length ? (
        <div className="grid gap-3 sm:grid-cols-2">{visible.map((po) => <PoCard key={po.id} po={po} />)}</div>
      ) : (
        <Card>
          <EmptyState
            icon={CalendarClock}
            title={tab === 'active' ? 'Belum ada PO aktif' : 'Tidak ada PO di sini'}
            description={tab === 'active' ? 'Buat PO, tambahkan produk, lalu publikasikan dan bagikan linknya ke grup WhatsApp.' : undefined}
            action={tab === 'active' ? <Button to="/dashboard/po/new">Buat PO</Button> : undefined}
          />
        </Card>
      )}
    </div>
  )
}
