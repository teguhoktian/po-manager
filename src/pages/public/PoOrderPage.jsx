import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, Percent, SearchX, Timer, Users } from 'lucide-react'
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { CartBar, ProductCard, STATE_META, StoreHeader } from '../../components/storefront'
import { usePublicPo } from '../../hooks/usePublicData'
import { useNow } from '../../hooks/useNow'
import { useCart } from '../../hooks/useCart'
import { formatDateTime } from '../../lib/format'
import { formatCountdown, liveState } from '../../lib/poState'
import { clearIdempotencyKey, idempotencyKeyFor, saveReceipt, submitCheckout } from '../../services/checkoutService'

export default function PoOrderPage() {
  const { storeSlug, poSlug } = useParams()
  const { data, error, loading, reload, version } = usePublicPo(storeSlug, poSlug)
  // Survives the reload that follows a stock/quota conflict, so the buyer sees why their cart changed.
  const [notice, setNotice] = useState(null)

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }
  if (error?.status === 404) {
    return (
      <EmptyState
        icon={SearchX}
        title="PO tidak ditemukan"
        description="PO ini tidak ada atau belum dibuka. Periksa kembali link dari penjual."
      />
    )
  }
  if (error) return <ErrorState title="Gagal memuat PO" description="Periksa koneksi Anda lalu coba lagi." onRetry={reload} />

  // Remount after a reload so the cart is re-clamped against fresh stock/quota.
  return <PoView key={version} data={data} storeSlug={storeSlug} reload={reload} notice={notice} onNotice={setNotice} />
}

// Separate component so the cart initializes from the loaded products exactly once.
function PoView({ data, storeSlug, reload, notice, onNotice }) {
  const navigate = useNavigate()
  const { store, order, products } = data
  const now = useNow()
  const state = liveState(order.state, order.closeAt, now)
  const canOrder = state === 'OPEN'
  const cart = useCart({ storageKey: `cart:${storeSlug}/${order.slug}`, products, order, enabled: canOrder })
  const meta = STATE_META[state]

  const submitOrder = async (customer, honeypot) => {
    const items = cart.lines.map((l) => ({ itemId: l.itemId, quantity: l.qty }))
    const signature = JSON.stringify([items, customer])
    const key = idempotencyKeyFor(`idem:${storeSlug}/${order.slug}`, signature)
    try {
      const { receipt } = await submitCheckout({ storeSlug, poSlug: order.slug, idempotencyKey: key, customer, items, website: honeypot })
      saveReceipt(storeSlug, order.slug, receipt)
      clearIdempotencyKey(`idem:${storeSlug}/${order.slug}`)
      onNotice(null)
      cart.clear()
      navigate(`/po/${storeSlug}/${order.slug}/pesanan`)
    } catch (error) {
      // Stock/quota/state changed under the buyer: refresh the page data; the cart is kept and re-clamped.
      if (error.status === 404 || error.status === 409) {
        onNotice(`${error.message} Keranjang Anda sudah disesuaikan.`)
        reload()
      }
      throw error
    }
  }
  const closeAt = order.closeAt ? new Date(order.closeAt) : null

  return (
    <div className={`space-y-5 ${cart.totalQty > 0 ? 'pb-32' : ''}`}>
      <title>{`${order.title} · ${store.name}`}</title>
      <StoreHeader store={store} to={`/po/${store.slug}`} compact />
      {notice && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{notice}</p>
          <button type="button" onClick={() => onNotice(null)} className="shrink-0 font-semibold">
            Tutup
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{order.title}</h1>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        {order.description && <p className="mt-2 text-sm whitespace-pre-line text-slate-600">{order.description}</p>}

        <dl className="mt-3 space-y-2 text-sm text-slate-700">
          {state === 'OPEN' && closeAt && (
            <Info icon={Timer} label={`Ditutup ${formatDateTime(closeAt)} · sisa ${formatCountdown(closeAt - now)}`} />
          )}
          {state === 'UPCOMING' && order.openAt && <Info icon={CalendarClock} label={`Dibuka ${formatDateTime(new Date(order.openAt))}`} />}
          {state === 'CLOSED' && closeAt && <Info icon={CalendarClock} label={`Ditutup ${formatDateTime(closeAt)}`} />}
          <Info
            icon={Percent}
            label={order.paymentMode === 'DP' ? `Pembayaran: DP ${order.dpPercent}%, sisanya saat pelunasan` : 'Pembayaran: lunas di awal'}
          />
          {order.minOrderQty > 1 && <Info icon={Users} label={`Minimal pemesanan ${order.minOrderQty} barang`} />}
          {order.remainingQuota !== null && state !== 'CLOSED' && <Info icon={Users} label={`Sisa kuota ${order.remainingQuota} barang`} />}
        </dl>

        {state === 'FULL' && <Notice>Kuota PO ini sudah penuh. Anda masih bisa melihat produknya.</Notice>}
        {state === 'CLOSED' && <Notice>PO ini sudah ditutup dan tidak menerima pesanan baru.</Notice>}
        {state === 'UPCOMING' && <Notice>PO belum dibuka. Pemesanan aktif setelah penjual membuka PO.</Notice>}
      </section>

      {products.length === 0 ? (
        <EmptyState title="Belum ada produk" description="Penjual belum menambahkan produk ke PO ini." />
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <ProductCard
              key={product.productId}
              product={product}
              qty={cart.qty}
              totalQty={cart.totalQty}
              remainingQuota={order.remainingQuota}
              canOrder={canOrder}
              onChange={cart.setItem}
            />
          ))}
        </div>
      )}

      {canOrder && (
        <CartBar
          lines={cart.lines}
          totals={cart.totals}
          po={order}
          onChange={cart.setItem}
          onClear={cart.clear}
          maxFor={(line) => cart.maxFor(line.itemId)}
          onSubmitOrder={submitOrder}
        />
      )}
    </div>
  )
}

function Info({ icon: Icon, label }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <dd>{label}</dd>
    </div>
  )
}

function Notice({ children }) {
  return <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{children}</p>
}
