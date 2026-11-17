import { useMemo, useState } from 'react'
import { Search, ShoppingBag, Store } from 'lucide-react'
import { Button, Card, CardBody, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { OrderCard } from '../../components/order/OrderCard'
import { useOrders, usePendingProofOrders } from '../../hooks/useOrders'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { useStore } from '../../hooks/useStore'
import { filterOrders, ORDER_STAGES, ORDER_TABS } from '../../lib/orderStatus'
import { fulfillmentBlock } from '../../lib/fulfillment'
import { bulkUpdateFulfillment } from '../../services/orderService'
import { formatRupiah } from '../../lib/format'
import { cn } from '../../lib/cn'

const SHIPPING_STAGES = ['toprocess', 'processing', 'shipped', 'done']

/** mode="shipping" is the Pengiriman menu: same list, fulfilment stages only, starting at "Perlu diproses". */
export default function OrdersPage({ mode }) {
  const shipping = mode === 'shipping'
  const store = useStore()
  const { data: orders, loading, error, reload } = useOrders()
  const { data: pos } = usePurchaseOrders()
  const { data: pendingIds } = usePendingProofOrders()
  const pending = useMemo(() => new Set(pendingIds ?? []), [pendingIds])
  const [tab, setTab] = useState('active')
  const [poId, setPoId] = useState('')
  const [query, setQuery] = useState('')
  const [stage, setStage] = useState(shipping ? 'toprocess' : '')
  const [selected, setSelected] = useState(() => new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [bulkNote, setBulkNote] = useState('')

  const poTitles = useMemo(() => new Map((pos ?? []).map((p) => [p.id, p.title])), [pos])
  const visible = useMemo(() => filterOrders(orders ?? [], { tab, poId, query, stage }), [orders, tab, poId, query, stage])
  const counts = useMemo(
    () => ({
      active: (orders ?? []).filter((o) => o.status === 'ACTIVE').length,
      cancelled: (orders ?? []).filter((o) => o.status === 'CANCELLED').length,
      all: (orders ?? []).length,
    }),
    [orders],
  )
  // Bulk step: "Perlu diproses" → PROCESSING, "Diproses / dikemas" → PACKED (only orders that can actually take it).
  const bulkTarget = stage === 'toprocess' ? 'PROCESSING' : stage === 'processing' ? 'PACKED' : null
  const eligible = useMemo(() => (bulkTarget ? visible.filter((o) => !fulfillmentBlock(o, bulkTarget)) : []), [visible, bulkTarget])
  const chosen = eligible.filter((o) => selected.has(o.id))
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  const changeStage = (v) => {
    setStage(v)
    setSelected(new Set())
    setBulkNote('')
  }
  const runBulk = async () => {
    setBulkBusy(true)
    setBulkNote('')
    try {
      const r = await bulkUpdateFulfillment(
        chosen.map((o) => o.id),
        bulkTarget,
      )
      setBulkNote(r.failed ? `${r.updated} pesanan diperbarui, ${r.failed} gagal.` : `${r.updated} pesanan diperbarui.`)
      setSelected(new Set())
      await reload()
    } catch (e) {
      setBulkNote(e.message || 'Gagal memproses pesanan.')
    } finally {
      setBulkBusy(false)
    }
  }
  const sums = useMemo(() => {
    const active = visible.filter((o) => o.status === 'ACTIVE')
    return { total: active.reduce((s, o) => s + (o.total ?? 0), 0), qty: active.reduce((s, o) => s + (o.totalQuantity ?? 0), 0), count: active.length }
  }, [visible])

  if (!store.loading && !store.error && !store.store) {
    return (
      <Card>
        <EmptyState icon={Store} title="Buat toko dulu" description="Pesanan masuk lewat halaman tokomu." action={<Button to="/dashboard/store">Buat toko</Button>} />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-slate-900">{shipping ? 'Pengiriman' : 'Pesanan'}</h2>

      <div role="tablist" hidden={shipping} aria-label="Status pesanan" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1">
        {ORDER_TABS.map(({ key, label }) => (
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="relative block sm:col-span-1">
          <span className="sr-only">Cari pesanan</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari no. pesanan, nama, atau WhatsApp"
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-9 text-sm placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter PO</span>
          <select
            value={poId}
            onChange={(e) => setPoId(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
          >
            <option value="">Semua PO</option>
            {(pos ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="sr-only">Filter tahap</span>
          <select
            value={stage}
            onChange={(e) => changeStage(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
          >
            {ORDER_STAGES.filter((s) => !shipping || SHIPPING_STAGES.includes(s.key)).map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!loading && !error && sums.count > 0 && (
        <p className="text-sm text-slate-600" aria-live="polite">
          {sums.count} pesanan aktif · {sums.qty} barang · <span className="font-semibold text-slate-900">{formatRupiah(sums.total)}</span>
        </p>
      )}

      {bulkTarget && !loading && !error && eligible.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm">
          <button
            type="button"
            className="font-medium text-brand-700"
            onClick={() => setSelected(chosen.length === eligible.length ? new Set() : new Set(eligible.map((o) => o.id)))}
          >
            {chosen.length === eligible.length ? 'Batal pilih semua' : 'Pilih semua'}
          </button>
          <span className="text-slate-600">{chosen.length} dipilih</span>
          <Button size="sm" className="ml-auto" disabled={!chosen.length} loading={bulkBusy} onClick={runBulk}>
            {bulkTarget === 'PROCESSING' ? 'Tandai diproses' : 'Tandai dikemas'}
          </Button>
        </div>
      )}
      {bulkNote && (
        <p role="status" className="rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">
          {bulkNote}
        </p>
      )}

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Card key={i}><CardBody className="space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-2/3" /><Skeleton className="h-5 w-24" /></CardBody></Card>
          ))}
        </div>
      ) : error ? (
        <Card><ErrorState description={error} onRetry={reload} /></Card>
      ) : visible.length ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              poTitle={poTitles.get(o.poId)}
              pendingProof={pending.has(o.id)}
              selectable={Boolean(bulkTarget) && eligible.some((e) => e.id === o.id)}
              selected={selected.has(o.id)}
              onToggle={toggle}
            />
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState
            icon={ShoppingBag}
            title={orders?.length ? 'Tidak ada pesanan yang cocok' : 'Belum ada pesanan'}
            description={orders?.length ? 'Ubah filter atau kata pencarian.' : 'Pesanan muncul di sini setelah pembeli checkout dari link PO.'}
          />
        </Card>
      )}
    </div>
  )
}
