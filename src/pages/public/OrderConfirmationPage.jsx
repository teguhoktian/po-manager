import { useState } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Check, CheckCircle2, Copy, Link2, MessageCircle, XCircle } from 'lucide-react'
import { Badge, Button, ErrorState, Skeleton } from '../../components/ui'
import { waLink } from '../../components/storefront'
import { OrderProgress } from '../../components/storefront/OrderProgress'
import { ProofUploader } from '../../components/storefront/ProofUploader'
import { usePublicOrder } from '../../hooks/usePublicData'
import { formatDateTime, formatRupiah } from '../../lib/format'
import { loadReceipt } from '../../services/checkoutService'

const itemLabel = (i) => (i.variantName ? `${i.name} ${i.variantName}` : i.name)

const PAY_BADGE = {
  SUBMITTED: { label: 'Menunggu verifikasi', tone: 'warning' },
  VERIFIED: { label: 'Diterima', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
}
const TYPE_LABEL = { DP: 'DP', FULL: 'Pembayaran', BALANCE: 'Pelunasan' }
const PAYMENT_HEADLINE = {
  PENDING_PAYMENT: 'Menunggu pembayaran',
  PARTIALLY_PAID: 'DP diterima, menunggu pelunasan',
  PAID: 'Pembayaran lunas',
  REFUNDED: 'Dana dikembalikan',
}
const FULFILLMENT_LABEL = { PROCESSING: 'Sedang diproses', PACKED: 'Sedang dikemas', SHIPPED: 'Sudah dikirim', COMPLETED: 'Selesai' }

function buildMessage(view, store) {
  const o = view.order
  const lines = o.items.map((i) => `- ${itemLabel(i)} x${i.quantity} = ${formatRupiah(i.lineTotal)}`)
  return [
    `Halo ${store.name}, saya sudah membuat pesanan.`,
    `No. pesanan: ${o.orderNumber}`,
    `PO: ${o.poTitle}`,
    `Atas nama: ${o.customerName}`,
    '',
    ...lines,
    `Total: ${formatRupiah(o.total)}`,
  ].join('\n')
}

export default function OrderConfirmationPage() {
  const { storeSlug, poSlug } = useParams()
  const [params] = useSearchParams()
  const { hash } = useLocation()
  // Reference = shared link (?no=…#t=…) or the receipt saved in this tab right after checkout.
  const [receipt] = useState(() => loadReceipt(storeSlug, poSlug))
  const orderNumber = params.get('no') ?? receipt?.orderNumber
  const token = new URLSearchParams(hash.slice(1)).get('t') ?? receipt?.accessToken
  const ref = orderNumber && token ? { storeSlug, orderNumber, token } : null

  const { data: view, error, loading, reload } = usePublicOrder(ref)
  const [copied, setCopied] = useState('')

  if (!ref) return <Navigate to={`/po/${storeSlug}/${poSlug}`} replace />
  if (loading)
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  if (error?.status === 404) {
    return (
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <XCircle className="mx-auto size-10 text-slate-400" aria-hidden="true" />
        <h1 className="text-lg font-bold text-slate-900">Pesanan tidak ditemukan</h1>
        <p className="text-sm text-slate-600">Link pesanan tidak valid. Hubungi penjual dengan menyebutkan nomor pesanan Anda.</p>
        <Link to={`/po/${storeSlug}/${poSlug}`} className="inline-flex min-h-11 items-center text-sm font-medium text-brand-700">
          Kembali ke PO
        </Link>
      </div>
    )
  }
  if (error || !view)
    return (
      <ErrorState
        title="Gagal memuat pesanan"
        description="Pesanan Anda tetap tersimpan. Periksa koneksi lalu coba lagi."
        onRetry={reload}
      />
    )

  const { order, store, payments, nextPayment, shipment } = view
  const cancelled = order.status === 'CANCELLED'
  const orderLink = `${window.location.origin}/po/${storeSlug}/${poSlug}/pesanan?no=${encodeURIComponent(order.orderNumber)}#t=${token}`

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(''), 2000)
    } catch {
      // Clipboard blocked: the value stays visible on screen.
    }
  }

  return (
    <div className="space-y-4">
      <title>{`Pesanan ${order.orderNumber} · ${store.name}`}</title>

      <section className={`rounded-2xl border bg-white p-5 text-center ${cancelled ? 'border-red-200' : 'border-emerald-200'}`}>
        {cancelled ? (
          <XCircle className="mx-auto size-12 text-red-500" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mx-auto size-12 text-emerald-600" aria-hidden="true" />
        )}
        <h1 className="mt-3 text-xl font-bold text-slate-900">{cancelled ? 'Pesanan dibatalkan' : 'Pesanan diterima'}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {cancelled
            ? `${order.cancelReason ? `Alasan: ${order.cancelReason}. ` : ''}${view.refunded > 0 ? `Dana ${formatRupiah(view.refunded)} dikembalikan oleh penjual.` : ''}`
            : `Terima kasih, ${order.customerName}. Simpan nomor pesanan Anda.`}
        </p>
        <button
          type="button"
          onClick={() => copy('number', order.orderNumber)}
          className="mx-auto mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-100 px-4 font-mono text-base font-semibold text-slate-900"
        >
          {order.orderNumber}
          {copied === 'number' ? (
            <Check className="size-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="size-4 text-slate-500" aria-hidden="true" />
          )}
          <span className="sr-only">{copied === 'number' ? 'Tersalin' : 'Salin nomor pesanan'}</span>
        </button>
        {!cancelled && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <Badge tone={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'PARTIALLY_PAID' ? 'info' : 'warning'}>
              {PAYMENT_HEADLINE[order.paymentStatus]}
            </Badge>
            {FULFILLMENT_LABEL[order.fulfillmentStatus] && <Badge tone="brand">{FULFILLMENT_LABEL[order.fulfillmentStatus]}</Badge>}
          </div>
        )}
      </section>

      {!cancelled && <OrderProgress status={order.fulfillmentStatus} shipment={shipment} />}

      {!cancelled && order.paymentStatus !== 'PAID' && nextPayment && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Pembayaran</h2>
          <p className="mt-2 text-sm text-slate-600">
            {nextPayment.type === 'DP'
              ? 'Transfer DP sebesar'
              : nextPayment.type === 'BALANCE'
                ? 'Transfer pelunasan sebesar'
                : 'Transfer sebesar'}
          </p>
          <p className="text-2xl font-bold text-slate-900">{formatRupiah(nextPayment.amount)}</p>
          {store.paymentInfo ? (
            <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm break-words whitespace-pre-line text-slate-800">
              {store.paymentInfo}
            </p>
          ) : (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Penjual belum mengisi info pembayaran. Hubungi penjual lewat WhatsApp untuk nomor rekening.
            </p>
          )}
          {view.awaitingVerification && (
            <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-800">
              Bukti pembayaran Anda sudah dikirim dan menunggu verifikasi penjual.
            </p>
          )}
          {view.canUpload && (
            <div className="mt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-900">Sudah transfer? Unggah buktinya</h3>
              <ProofUploader orderRef={ref} onUploaded={reload} />
            </div>
          )}
        </section>
      )}

      {payments.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Riwayat pembayaran</h2>
          <ul className="mt-2 divide-y divide-slate-100">
            {payments.map((p, idx) => (
              <li key={idx} className="py-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-800">
                    {TYPE_LABEL[p.type]} · {formatRupiah(p.amount)}
                  </span>
                  <Badge tone={PAY_BADGE[p.status].tone}>{PAY_BADGE[p.status].label}</Badge>
                </div>
                <p className="text-xs text-slate-500">{formatDateTime(new Date(p.createdAt))}</p>
                {p.status === 'REJECTED' && p.rejectReason && <p className="mt-1 text-xs text-red-700">Alasan: {p.rejectReason}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-500">{order.poTitle}</h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex items-start justify-between gap-3 py-2.5 text-sm">
              <span className="min-w-0 break-words text-slate-800">
                {itemLabel(i)} <span className="text-slate-500">× {i.quantity}</span>
              </span>
              <span className="shrink-0 font-medium text-slate-900">{formatRupiah(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
          <Row label="Total" value={formatRupiah(order.total)} strong />
          {order.paymentMode === 'DP' && <Row label="DP diminta" value={formatRupiah(order.dpAmount)} />}
          <Row label="Sudah dibayar" value={formatRupiah(order.paidAmount)} />
          {!cancelled && <Row label="Sisa tagihan" value={formatRupiah(order.balanceDue)} />}
        </dl>
      </section>

      <div className="space-y-2">
        {store.whatsappNumber && (
          <Button
            href={waLink(store.whatsappNumber, buildMessage(view, store))}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            fullWidth
          >
            <MessageCircle className="size-5" aria-hidden="true" /> Hubungi penjual
          </Button>
        )}
        <Button variant="secondary" fullWidth onClick={() => copy('link', orderLink)}>
          {copied === 'link' ? (
            <Check className="size-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Link2 className="size-4" aria-hidden="true" />
          )}
          {copied === 'link' ? 'Link tersalin' : 'Salin link pesanan ini'}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Simpan link ini untuk membuka pesanan dari perangkat lain. Siapa pun yang memegang link bisa melihat pesanan ini.
        </p>
        <Link to={`/po/${storeSlug}/${poSlug}`} className="flex min-h-11 items-center justify-center text-sm font-medium text-brand-700">
          Kembali ke PO
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>{label}</dt>
      <dd className={strong ? 'text-base font-bold text-slate-900' : 'font-medium text-slate-800'}>{value}</dd>
    </div>
  )
}
