import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Search, XCircle } from 'lucide-react'
import { Button, Card, CardBody, Input } from '../../components/ui'
import { OrderProgress } from '../../components/storefront/OrderProgress'
import { waLink } from '../../components/storefront'
import { formatDateTime, formatRupiah } from '../../lib/format'
import { trackOrder } from '../../services/publicService'

const PAYMENT_LABEL = {
  PENDING_PAYMENT: 'Menunggu pembayaran',
  PARTIALLY_PAID: 'DP diterima, menunggu pelunasan',
  PAID: 'Pembayaran lunas',
  REFUNDED: 'Dana dikembalikan',
}

/** /cek — buyers look up an order with its number + the WhatsApp number used at checkout. */
export default function TrackOrderPage() {
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('no') ?? '')
  const [whatsapp, setWhatsapp] = useState('')
  const [state, setState] = useState({ status: 'idle' })

  const submit = async (e) => {
    e.preventDefault()
    setState({ status: 'loading' })
    try {
      setState({ status: 'done', view: await trackOrder({ orderNumber: orderNumber.trim(), whatsapp: whatsapp.trim() }) })
    } catch (error) {
      setState({ status: 'error', message: error.status === 400 ? 'Isi kode pesanan dan nomor WhatsApp dengan benar.' : error.message })
    }
  }

  const view = state.status === 'done' ? state.view : null
  const order = view?.order

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Cek pesanan</h1>
      <p className="mt-1 text-slate-600">Masukkan kode pesanan dan nomor WhatsApp yang dipakai saat memesan.</p>

      <Card className="mt-6">
        <CardBody>
          <form onSubmit={submit} noValidate className="space-y-4">
            <Input
              label="Kode pesanan"
              placeholder="Contoh: BROWNI-0012"
              autoCapitalize="characters"
              autoCorrect="off"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
            />
            <Input
              label="Nomor WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="0812xxxxxxx"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
            />
            {state.status === 'error' && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {state.message}
              </p>
            )}
            <Button type="submit" size="lg" fullWidth loading={state.status === 'loading'} disabled={!orderNumber.trim() || !whatsapp.trim()}>
              <Search className="size-4" aria-hidden="true" /> Cek pesanan
            </Button>
          </form>
        </CardBody>
      </Card>

      {order && (
        <div className="mt-6 space-y-4" aria-live="polite">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-base font-bold text-slate-900">{order.orderNumber}</p>
                  <p className="text-sm text-slate-600">
                    {order.poTitle} · {view.store.name}
                  </p>
                  <p className="text-xs text-slate-500">Dipesan {formatDateTime(order.createdAt)}</p>
                </div>
                <p className="shrink-0 text-lg font-extrabold text-slate-900">{formatRupiah(order.total)}</p>
              </div>
              <ul className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
                {order.items.map((l, i) => (
                  <li key={i} className="flex justify-between gap-3 py-2">
                    <span className="text-slate-700">
                      {l.name}
                      {l.variantName ? ` · ${l.variantName}` : ''} × {l.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">{formatRupiah(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              {order.status === 'ACTIVE' ? (
                <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {PAYMENT_LABEL[order.paymentStatus]}
                  {order.balanceDue > 0 && <span className="font-semibold"> · sisa {formatRupiah(order.balanceDue)}</span>}
                </p>
              ) : (
                <p className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  <XCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>
                    Pesanan dibatalkan{order.cancelReason ? `: ${order.cancelReason}` : '.'}
                    {view.refunded > 0 && ` Dana ${formatRupiah(view.refunded)} dikembalikan.`}
                  </span>
                </p>
              )}
            </CardBody>
          </Card>

          {order.status === 'ACTIVE' && <OrderProgress status={order.fulfillmentStatus} shipment={view.shipment} />}

          {order.status === 'ACTIVE' && order.paymentStatus !== 'PAID' && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-900">
              Untuk membayar atau mengunggah bukti transfer, buka link pesanan yang kamu terima setelah memesan, atau hubungi penjual.
            </p>
          )}

          {view.store.whatsappNumber && (
            <Button
              href={waLink(view.store.whatsappNumber, `Halo ${view.store.name}, saya ingin menanyakan pesanan ${order.orderNumber}.`)}
              target="_blank"
              rel="noopener noreferrer"
              variant="secondary"
              fullWidth
            >
              <MessageCircle className="size-4" aria-hidden="true" /> Hubungi penjual
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
