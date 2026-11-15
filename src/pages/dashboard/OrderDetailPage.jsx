import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin, MessageCircle, Phone } from 'lucide-react'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Skeleton,
  Textarea,
} from '../../components/ui'
import { OrderBadges } from '../../components/order/OrderBadges'
import { waLink } from '../../components/storefront/waLink'
import { PaymentsCard } from '../../components/order/PaymentsCard'
import { FulfillmentCard } from '../../components/order/FulfillmentCard'
import { useOrder, useOrderItems, usePayments, useShipment } from '../../hooks/useOrders'
import { usePurchaseOrder } from '../../hooks/usePurchaseOrders'
import { useStore } from '../../hooks/useStore'
import { cancelOrder } from '../../services/orderService'
import { cancelBlockedReason, canCancelOrder } from '../../lib/orderStatus'
import { formatDateTime, formatRupiah } from '../../lib/format'
import { describeFirebaseError } from '../../lib/firebaseErrors'

function BackLink() {
  return (
    <Link to="/dashboard/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
      <ArrowLeft className="size-4" aria-hidden="true" /> Semua pesanan
    </Link>
  )
}

const Row = ({ label, children, strong }) => (
  <div className="flex items-baseline justify-between gap-3 text-sm">
    <dt className={strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>{label}</dt>
    <dd className={strong ? 'text-base font-bold text-slate-900' : 'font-medium text-slate-800'}>{children}</dd>
  </div>
)

export default function OrderDetailPage() {
  const { orderId } = useParams()
  const { store } = useStore()
  const { data: order, loading, error, reload } = useOrder(orderId)
  const { data: items, loading: itemsLoading, error: itemsError, reload: reloadItems } = useOrderItems(orderId)
  const { data: po } = usePurchaseOrder(order?.poId)
  const { data: payments, loading: paymentsLoading, error: paymentsError, reload: reloadPayments } = usePayments(orderId)
  const shippedNow = ['SHIPPED', 'COMPLETED'].includes(order?.fulfillmentStatus)
  const { data: shipment, loading: shipmentLoading, reload: reloadShipment } = useShipment(orderId, shippedNow)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [refundOk, setRefundOk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading)
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  if (error)
    return (
      <Card>
        <ErrorState description={error} onRetry={reload} />
      </Card>
    )
  if (!order)
    return (
      <Card>
        <EmptyState title="Pesanan tidak ditemukan" action={<Button to="/dashboard/orders">Kembali</Button>} />
      </Card>
    )

  const cancelled = order.status === 'CANCELLED'
  const blocked = cancelBlockedReason(order)
  const message = [
    `Halo ${order.customer.name}, terima kasih sudah memesan di ${store?.name ?? 'toko kami'}.`,
    `Pesanan ${order.orderNumber}${po ? ` (${po.title})` : ''} total ${formatRupiah(order.total)}.`,
  ].join(' ')

  const doCancel = async () => {
    setBusy(true)
    setActionError('')
    try {
      await cancelOrder(order.id, reason.trim(), order.paidAmount > 0)
      setConfirming(false)
      setReason('')
      setRefundOk(false)
      await Promise.all([reload(), reloadPayments()])
    } catch (e) {
      setConfirming(false)
      setActionError(e.message || describeFirebaseError(e, 'Gagal membatalkan pesanan.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <BackLink />
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-mono text-xl font-bold text-slate-900">{order.orderNumber}</h2>
          <OrderBadges order={order} />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {formatDateTime(order.createdAt)}
          {po && (
            <>
              {' · '}
              <Link to={`/dashboard/po/${po.id}`} className="font-medium text-brand-700">
                {po.title}
              </Link>
            </>
          )}
        </p>
      </div>

      {cancelled && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
          Dibatalkan {formatDateTime(order.cancelledAt)}.{order.cancelReason ? ` Alasan: ${order.cancelReason}` : ''} Stok dan kuota sudah
          dikembalikan.
          {order.refundedAmount > 0 && ` Dana ${formatRupiah(order.refundedAmount)} dicatat dikembalikan ke pembeli.`}
        </p>
      )}
      {actionError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      <Card>
        <CardHeader title="Pemesan" />
        <CardBody className="space-y-3 text-sm">
          <p className="text-base font-semibold text-slate-900">{order.customer.name}</p>
          <p className="flex items-start gap-2 text-slate-700">
            <Phone className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span>+{order.customer.whatsapp}</span>
          </p>
          <p className="flex items-start gap-2 text-slate-700">
            <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="break-words whitespace-pre-line">{order.customer.address}</span>
          </p>
          <Button href={waLink(order.customer.whatsapp, message)} target="_blank" rel="noopener noreferrer" variant="secondary" fullWidth>
            <MessageCircle className="size-4" aria-hidden="true" /> Hubungi via WhatsApp
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Isi pesanan" />
        <CardBody>
          {itemsLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : itemsError ? (
            <ErrorState description={itemsError} onRetry={reloadItems} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((i) => (
                <li key={i.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="break-words font-medium text-slate-900">
                      {i.productName}
                      {i.variantName ? ` · ${i.variantName}` : ''}
                    </p>
                    <p className="text-slate-500">
                      {formatRupiah(i.unitPrice)} × {i.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 font-semibold text-slate-900">{formatRupiah(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
          )}
          <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
            <Row label={`Total (${order.totalQuantity ?? 0} barang)`} strong>
              {formatRupiah(order.total)}
            </Row>
            {order.paymentMode === 'DP' && <Row label="DP yang diminta">{formatRupiah(order.dpAmount)}</Row>}
            <Row label="Sudah dibayar">{formatRupiah(order.paidAmount)}</Row>
            <Row label="Sisa tagihan">{formatRupiah(cancelled ? 0 : order.balanceDue)}</Row>
          </dl>
        </CardBody>
      </Card>

      <PaymentsCard
        order={order}
        payments={payments ?? []}
        loading={paymentsLoading}
        error={paymentsError}
        reload={reloadPayments}
        onChanged={reload}
      />

      <FulfillmentCard
        order={order}
        shipment={shipment}
        shipmentLoading={shipmentLoading}
        store={store}
        onChanged={() => Promise.all([reload(), reloadShipment()])}
      />

      {!cancelled && (
        <div>
          {canCancelOrder(order) ? (
            <Button variant="ghost" className="!text-red-600 hover:bg-red-50" onClick={() => setConfirming(true)}>
              Batalkan pesanan
            </Button>
          ) : (
            blocked && <p className="text-sm text-slate-500">{blocked}</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirming}
        title="Batalkan pesanan?"
        description="Stok dan kuota PO dikembalikan. Pembeli tidak diberi tahu otomatis, hubungi lewat WhatsApp bila perlu. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, batalkan pesanan"
        cancelLabel="Kembali"
        destructive
        loading={busy}
        confirmDisabled={order.paidAmount > 0 && !refundOk}
        onConfirm={doCancel}
        onCancel={() => setConfirming(false)}
      >
        <div className="space-y-3">
          <Textarea label="Alasan (opsional)" rows={2} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
          {order.paidAmount > 0 && (
            <Checkbox
              label={`Saya akan mengembalikan ${formatRupiah(order.paidAmount)} ke pembeli`}
              hint="Pembayaran yang sudah diterima dicatat sebagai pengembalian dana. Transfer baliknya kamu lakukan sendiri."
              checked={refundOk}
              onChange={(e) => setRefundOk(e.target.checked)}
            />
          )}
        </div>
      </ConfirmDialog>
    </div>
  )
}
