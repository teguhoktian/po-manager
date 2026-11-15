import { useState } from 'react'
import { Check, MessageCircle, Truck } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, Input, Skeleton } from '../ui'
import { waLink } from '../storefront/waLink'
import { fulfillmentBlock, nextFulfillment, prevFulfillment } from '../../lib/fulfillment'
import { COURIERS, FULFILLMENT_STATUS_META } from '../../lib/orderStatus'
import { formatDateTime } from '../../lib/format'
import { cn } from '../../lib/cn'
import { updateFulfillment, updateShipment } from '../../services/orderService'

const STEPS = ['PENDING', 'PROCESSING', 'PACKED', 'SHIPPED', 'COMPLETED']
const NEXT_LABEL = { PROCESSING: 'Mulai proses', PACKED: 'Tandai dikemas', SHIPPED: 'Kirim pesanan', COMPLETED: 'Tandai selesai' }

function Stepper({ current }) {
  const at = STEPS.indexOf(current)
  return (
    <ol className="flex items-start" aria-label="Tahap pesanan">
      {STEPS.map((s, i) => (
        <li key={s} className="flex min-w-0 flex-1 flex-col items-center text-center" aria-current={i === at ? 'step' : undefined}>
          <span className="flex w-full items-center">
            <span className={cn('h-0.5 flex-1', i === 0 ? 'opacity-0' : i <= at ? 'bg-brand-600' : 'bg-slate-200')} />
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                i < at
                  ? 'bg-brand-600 text-white'
                  : i === at
                    ? 'bg-brand-600 text-white ring-4 ring-brand-600/20'
                    : 'bg-slate-200 text-slate-500',
              )}
            >
              {i < at ? <Check className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn('h-0.5 flex-1', i === STEPS.length - 1 ? 'opacity-0' : i < at ? 'bg-brand-600' : 'bg-slate-200')} />
          </span>
          <span className={cn('mt-1 text-[11px] leading-tight', i === at ? 'font-semibold text-slate-900' : 'text-slate-500')}>
            {FULFILLMENT_STATUS_META[s].label}
          </span>
        </li>
      ))}
    </ol>
  )
}

function ShipmentForm({ initial, submitLabel, busy, onSubmit, onCancel }) {
  const [carrier, setCarrier] = useState(initial?.carrier ?? COURIERS[0])
  const [custom, setCustom] = useState(initial?.carrier && !COURIERS.includes(initial.carrier) ? initial.carrier : '')
  const [resi, setResi] = useState(initial?.trackingNumber ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const other = carrier === 'Lainnya'
  const name = (other ? custom : carrier).trim()
  const valid = name.length >= 2

  return (
    <form
      className="space-y-3 rounded-xl bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onSubmit({ carrier: name, trackingNumber: resi.trim() || undefined, note: note.trim() || undefined })
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-slate-700">Kurir</span>
        <select
          value={other || (initial?.carrier && !COURIERS.includes(initial.carrier) && carrier === initial.carrier) ? 'Lainnya' : carrier}
          onChange={(e) => setCarrier(e.target.value)}
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
        >
          {[...COURIERS, 'Lainnya'].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      {other && <Input label="Nama kurir" maxLength={40} value={custom} onChange={(e) => setCustom(e.target.value)} />}
      <Input label="Nomor resi (opsional)" maxLength={60} value={resi} onChange={(e) => setResi(e.target.value)} autoComplete="off" />
      <Input label="Catatan untuk pembeli (opsional)" maxLength={200} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
            Batal
          </Button>
        )}
        <Button type="submit" loading={busy} disabled={!valid} className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}

/** Seller-side fulfilment: stepper, next/back, shipping details. The server enforces every rule; this only mirrors them. */
export function FulfillmentCard({ order, shipment, shipmentLoading, store, onChanged }) {
  const [form, setForm] = useState(null) // 'ship' | 'edit' | null
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (order.status !== 'ACTIVE') return null

  const status = order.fulfillmentStatus
  const next = nextFulfillment(status)
  const back = prevFulfillment(status)
  const blockedReason = next ? fulfillmentBlock(order, next) : null
  const shipped = status === 'SHIPPED' || status === 'COMPLETED'

  const run = async (fn) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      setForm(null)
      await onChanged()
    } catch (e) {
      setError(e.message || 'Gagal memperbarui pesanan.')
    } finally {
      setBusy(false)
    }
  }

  const resiMessage = shipment
    ? `Halo ${order.customer.name}, pesanan ${order.orderNumber} dari ${store?.name ?? 'toko kami'} sudah dikirim lewat ${shipment.carrier}${
        shipment.trackingNumber ? ` dengan nomor resi ${shipment.trackingNumber}` : ''
      }. Terima kasih!`
    : ''

  return (
    <Card>
      <CardHeader
        title="Pengiriman"
        action={<Badge tone={FULFILLMENT_STATUS_META[status].tone}>{FULFILLMENT_STATUS_META[status].label}</Badge>}
      />
      <CardBody className="space-y-4">
        <Stepper current={status} />
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {shipped && (
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            {shipmentLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : form === 'edit' ? (
              <ShipmentForm
                initial={shipment}
                submitLabel="Simpan"
                busy={busy}
                onCancel={() => setForm(null)}
                onSubmit={(s) => run(() => updateShipment(order.id, s))}
              />
            ) : shipment ? (
              <div className="space-y-1">
                <p className="flex items-center gap-2 font-semibold text-slate-900">
                  <Truck className="size-4 text-slate-500" aria-hidden="true" /> {shipment.carrier}
                </p>
                <p className="text-slate-700">
                  Resi: <span className="font-mono">{shipment.trackingNumber || '-'}</span>
                </p>
                {shipment.note && <p className="text-slate-600">{shipment.note}</p>}
                <p className="text-xs text-slate-500">Dikirim {formatDateTime(shipment.shippedAt)}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    href={waLink(order.customer.whatsapp, resiMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="secondary"
                    size="sm"
                  >
                    <MessageCircle className="size-4" aria-hidden="true" /> Kirim info resi
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setForm('edit')}>
                    Ubah data
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-600">Data pengiriman tidak ditemukan.</p>
            )}
          </div>
        )}

        {next && form === 'ship' ? (
          <ShipmentForm
            submitLabel="Simpan & tandai dikirim"
            busy={busy}
            onCancel={() => setForm(null)}
            onSubmit={(s) => run(() => updateFulfillment(order.id, 'SHIPPED', s))}
          />
        ) : (
          next && (
            <div className="space-y-2">
              <Button
                fullWidth
                loading={busy}
                disabled={Boolean(blockedReason)}
                onClick={() => (next === 'SHIPPED' ? setForm('ship') : run(() => updateFulfillment(order.id, next)))}
              >
                {NEXT_LABEL[next]}
              </Button>
              {blockedReason && <p className="text-sm text-amber-700">{blockedReason}</p>}
            </div>
          )
        )}

        {status === 'COMPLETED' && <p className="text-sm text-emerald-700">Pesanan selesai. Status ini tidak bisa diubah lagi.</p>}
        {back && form !== 'ship' && (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => run(() => updateFulfillment(order.id, back))}>
            Kembali ke "{FULFILLMENT_STATUS_META[back].label}"
          </Button>
        )}
      </CardBody>
    </Card>
  )
}
