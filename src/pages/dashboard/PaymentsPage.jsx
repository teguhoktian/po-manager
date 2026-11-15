import { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { Card, CardBody, EmptyState, ErrorState, Skeleton } from '../../components/ui'
import { OrderCard } from '../../components/order/OrderCard'
import { useOrders, usePendingProofOrders } from '../../hooks/useOrders'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { formatRupiah } from '../../lib/format'

function Section({ title, hint, orders, poTitles, pending }) {
  if (!orders.length) return null
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          {title} <span className="text-sm font-normal text-slate-500">({orders.length})</span>
        </h3>
        {hint && <p className="text-sm text-slate-600">{hint}</p>}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} poTitle={poTitles.get(o.poId)} pendingProof={pending.has(o.id)} />
        ))}
      </div>
    </section>
  )
}

/** Pembayaran: what needs the seller's attention (proofs to verify, then unpaid balances). Review itself happens in the order. */
export default function PaymentsPage() {
  const { data: orders, loading, error, reload } = useOrders()
  const { data: pendingIds, error: pendingError } = usePendingProofOrders()
  const { data: pos } = usePurchaseOrders()
  const poTitles = useMemo(() => new Map((pos ?? []).map((p) => [p.id, p.title])), [pos])
  const pending = useMemo(() => new Set(pendingIds ?? []), [pendingIds])

  const { review, unpaid, owed } = useMemo(() => {
    const active = (orders ?? []).filter((o) => o.status === 'ACTIVE')
    const review = active.filter((o) => pending.has(o.id))
    const unpaid = active.filter((o) => !pending.has(o.id) && (o.paymentStatus === 'PENDING_PAYMENT' || o.paymentStatus === 'PARTIALLY_PAID'))
    return { review, unpaid, owed: active.reduce((s, o) => s + (o.balanceDue ?? 0), 0) }
  }, [orders, pending])

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900">Pembayaran</h2>
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <ErrorState description={error} onRetry={reload} />
        </Card>
      ) : (
        <>
          {pendingError && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Daftar bukti bayar gagal dimuat: {pendingError}</p>}
          {review.length + unpaid.length > 0 && (
            <p className="text-sm text-slate-600">
              Total tagihan belum terbayar: <span className="font-semibold text-slate-900">{formatRupiah(owed)}</span>
            </p>
          )}
          <Section title="Cek bukti bayar" hint="Buka pesanan untuk melihat bukti, lalu terima atau tolak." orders={review} poTitles={poTitles} pending={pending} />
          <Section title="Belum lunas" hint="Menunggu pembayaran dari pembeli." orders={unpaid} poTitles={poTitles} pending={pending} />
          {review.length + unpaid.length === 0 && (
            <Card>
              <CardBody>
                <EmptyState icon={Wallet} title="Tidak ada yang perlu ditindaklanjuti" description="Semua pesanan aktif sudah lunas dan tidak ada bukti bayar yang menunggu." />
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
