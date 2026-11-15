import { useState } from 'react'
import { ExternalLink, Plus } from 'lucide-react'
import { Badge, Button, Card, CardBody, CardHeader, ErrorState, Input, Skeleton, Textarea } from '../ui'
import { useStorageUrl } from '../../hooks/useStorageUrl'
import { formatDateTime, formatRupiah } from '../../lib/format'
import { PAYMENT_RECORD_META, PAYMENT_TYPE_LABEL } from '../../lib/orderStatus'
import { recordPayment, reviewPayment } from '../../services/orderService'

const toInt = (v) => Number.parseInt(String(v).replace(/\D/g, ''), 10) || 0

function Proof({ path }) {
  const url = useStorageUrl(path)
  if (!url) return <Skeleton className="h-40 w-full" />
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="block">
      <img src={url} alt="Bukti transfer" className="max-h-64 w-full rounded-xl border border-slate-200 bg-slate-50 object-contain" />
      <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700">
        <ExternalLink className="size-3" aria-hidden="true" /> Buka ukuran penuh
      </span>
    </a>
  )
}

function Review({ payment, order, onDone }) {
  const [amount, setAmount] = useState(String(Math.min(payment.amount, order.balanceDue)))
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await reviewPayment(payment.id, action, action === 'verify' ? { amount: toInt(amount) } : { reason: reason.trim() })
      await onDone()
    } catch (e) {
      setError(e.message || 'Gagal memproses pembayaran.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-3 space-y-3 rounded-xl bg-amber-50/60 p-3">
      {payment.proofPath && <Proof path={payment.proofPath} />}
      {payment.buyerNote && <p className="text-sm text-slate-700">Catatan pembeli: {payment.buyerNote}</p>}
      {rejecting ? (
        <>
          <Textarea
            label="Alasan penolakan"
            rows={2}
            maxLength={200}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            hint="Pembeli akan melihat alasan ini dan bisa mengunggah ulang."
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>
              Batal
            </Button>
            <Button variant="danger" className="flex-1" onClick={() => run('reject')} loading={busy} disabled={reason.trim().length < 3}>
              Tolak bukti
            </Button>
          </div>
        </>
      ) : (
        <>
          <Input
            label="Nominal yang diterima (Rp)"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            hint={`Diminta ${formatRupiah(payment.amount)}. Ubah jika pembeli mentransfer nominal lain.`}
          />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setRejecting(true)} disabled={busy}>
              Tolak
            </Button>
            <Button
              className="flex-1"
              onClick={() => run('verify')}
              loading={busy}
              disabled={toInt(amount) < 1 || toInt(amount) > order.balanceDue}
            >
              Terima {formatRupiah(toInt(amount))}
            </Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function ManualRecord({ order, onDone }) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState(String(order.balanceDue))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!open) {
    return (
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" /> Catat pembayaran manual
      </Button>
    )
  }
  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await recordPayment(order.id, toInt(amount), note.trim())
      setOpen(false)
      await onDone()
    } catch (e) {
      setError(e.message || 'Gagal mencatat pembayaran.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 p-3">
      <Input
        label="Nominal diterima (Rp)"
        inputMode="numeric"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        hint="Untuk pembayaran tunai atau transfer yang sudah kamu cek sendiri."
      />
      <Input label="Catatan (opsional)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
          Batal
        </Button>
        <Button className="flex-1" onClick={submit} loading={busy} disabled={toInt(amount) < 1 || toInt(amount) > order.balanceDue}>
          Simpan pembayaran
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export function PaymentsCard({ order, payments, loading, error, reload, onChanged }) {
  const done = async () => {
    await reload()
    await onChanged()
  }
  const active = order.status === 'ACTIVE'
  return (
    <Card>
      <CardHeader title="Pembayaran" />
      <CardBody className="space-y-3">
        {loading ? (
          <Skeleton className="h-16 w-full" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : payments.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pembayaran.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {payments.map((p) => {
              const meta = PAYMENT_RECORD_META[p.status]
              return (
                <li key={p.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {PAYMENT_TYPE_LABEL[p.type]} · {formatRupiah(p.amount)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(p.createdAt)}
                        {!p.proofPath && p.type !== 'REFUND' && ' · dicatat manual'}
                      </p>
                      {p.sellerNote && <p className="text-xs text-slate-500">{p.sellerNote}</p>}
                      {p.status === 'REJECTED' && p.rejectReason && <p className="text-xs text-red-700">Alasan: {p.rejectReason}</p>}
                    </div>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>
                  {p.status === 'SUBMITTED' && active && <Review payment={p} order={order} onDone={done} />}
                </li>
              )
            })}
          </ul>
        )}
        {active && order.balanceDue > 0 && !loading && !error && <ManualRecord key={order.balanceDue} order={order} onDone={done} />}
      </CardBody>
    </Card>
  )
}
