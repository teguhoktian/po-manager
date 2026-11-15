import { Link } from 'react-router-dom'
import { CalendarClock, ShoppingBag, Banknote, Hourglass, Wallet, Truck, BarChart3, ExternalLink } from 'lucide-react'
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from '../../components/ui'
import { OrderCard } from '../../components/order/OrderCard'
import { useOrders, usePendingProofOrders } from '../../hooks/useOrders'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useStore } from '../../hooks/useStore'
import { formatRupiah } from '../../lib/format'
import { summarizeOrders, workQueue } from '../../lib/report'

const TONES = {
  green: 'bg-green-100 text-green-700',
  sky: 'bg-sky-100 text-sky-700',
  amber: 'bg-amber-100 text-amber-700',
  rose: 'bg-rose-100 text-rose-700',
}

function StatCard({ label, icon: Icon, value, loading, tone = 'green' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className={`flex size-9 items-center justify-center rounded-xl ${TONES[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-24" /> : <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>}
    </Card>
  )
}

const QUEUE = [
  { key: 'proofs', label: 'Bukti bayar perlu dicek', to: '/dashboard/payments' },
  { key: 'toProcess', label: 'Pesanan siap diproses', to: '/dashboard/fulfillment' },
  { key: 'processing', label: 'Sedang diproses / dikemas', to: '/dashboard/fulfillment' },
  { key: 'toComplete', label: 'Dikirim, belum selesai', to: '/dashboard/fulfillment' },
]

// The bottom bar only fits the main menus, so these stay reachable on phones from here (the sidebar shows them on desktop).
const MORE = [
  { label: 'Pembayaran', to: '/dashboard/payments', icon: Wallet },
  { label: 'Pengiriman', to: '/dashboard/fulfillment', icon: Truck },
  { label: 'Laporan', to: '/dashboard/reports', icon: BarChart3 },
]

export default function OverviewPage() {
  const { store, loading, error } = useStore()
  const needsStore = !loading && !error && !store
  const { data: orders, loading: ordersLoading } = useOrders()
  const { data: pendingIds } = usePendingProofOrders()
  const { data: pos } = usePurchaseOrders()

  const sum = summarizeOrders(orders ?? [])
  const queue = workQueue(orders ?? [], pendingIds ?? [])
  const openPos = (pos ?? []).filter((p) => p.status === 'OPEN').length
  const poTitles = new Map((pos ?? []).map((p) => [p.id, p.title]))
  const recent = (orders ?? []).slice(0, 5)
  const todo = QUEUE.filter((q) => queue[q.key] > 0)

  return (
    <div className="space-y-5">
      {needsStore && (
        <Card className="border-brand-200 bg-brand-50">
          <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-brand-900">Langkah pertama: buat toko kamu</h2>
              <p className="text-sm text-brand-800">Toko dibutuhkan sebelum kamu bisa membuat produk dan PO.</p>
            </div>
            <Button to="/dashboard/store">Buat toko</Button>
          </CardBody>
        </Card>
      )}

      {store && (
        <section className="flex items-center justify-between gap-3 rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-5 text-white shadow-lift">
          <div className="min-w-0">
            <p className="text-sm text-brand-100">Selamat datang kembali</p>
            <h2 className="truncate text-xl font-extrabold">{store.name}</h2>
          </div>
          {store.slug && (
            <Button to={`/po/${store.slug}`} variant="secondary" size="sm" className="shrink-0">
              Lihat toko <ExternalLink className="size-4" aria-hidden="true" />
            </Button>
          )}
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="PO dibuka" icon={CalendarClock} value={openPos} loading={!pos} tone="green" />
        <StatCard label="Pesanan aktif" icon={ShoppingBag} value={sum.orders} loading={ordersLoading} tone="sky" />
        <StatCard label="Total penjualan" icon={Banknote} value={formatRupiah(sum.revenue)} loading={ordersLoading} tone="green" />
        <StatCard label="Belum dibayar" icon={Hourglass} value={formatRupiah(sum.outstanding)} loading={ordersLoading} tone="amber" />
      </div>

      <nav aria-label="Menu lainnya" className="grid grid-cols-3 gap-3 lg:hidden">
        {MORE.map(({ label, to, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-1.5 rounded-card border border-green-900/10 bg-white p-3 text-sm font-semibold text-slate-700 shadow-card">
            <Icon className="size-5 text-brand-600" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Perlu ditindaklanjuti" />
          <CardBody>
            {ordersLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : todo.length ? (
              <ul className="divide-y divide-slate-100">
                {todo.map((q) => (
                  <li key={q.key}>
                    <Link to={q.to} className="flex items-center justify-between gap-3 py-3 text-sm font-medium text-slate-800 hover:text-brand-700">
                      {q.label}
                      <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-sm font-bold text-white">{queue[q.key]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={ShoppingBag} title="Tidak ada yang menunggu" description="Pesanan baru akan muncul di sini." />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pesanan terbaru" action={<Link to="/dashboard/orders" className="text-sm font-medium text-brand-700">Semua</Link>} />
          <CardBody className="space-y-3">
            {ordersLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : recent.length ? (
              recent.map((o) => <OrderCard key={o.id} order={o} poTitle={poTitles.get(o.poId)} pendingProof={(pendingIds ?? []).includes(o.id)} />)
            ) : (
              <EmptyState icon={ShoppingBag} title="Belum ada pesanan" description="Pesanan dari link PO akan muncul di sini." />
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
