import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { formatDateTime } from '../../lib/format'

const TIMELINE = [
  ['PENDING', 'Pesanan diterima'],
  ['PROCESSING', 'Diproses'],
  ['PACKED', 'Dikemas'],
  ['SHIPPED', 'Dikirim'],
  ['COMPLETED', 'Selesai'],
]

/** Buyer-facing progress of one active order: timeline plus courier / tracking number once shipped. */
export function OrderProgress({ status, shipment }) {
  const [copied, setCopied] = useState(false)
  const at = TIMELINE.findIndex(([k]) => k === status)

  const copyResi = async () => {
    try {
      await navigator.clipboard.writeText(shipment.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the number stays visible on screen.
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-base font-semibold text-slate-900">Status pesanan</h2>
      <ol className="mt-3 space-y-0">
        {TIMELINE.map(([key, label], i) => {
          const done = i <= at
          return (
            <li key={key} className="flex gap-3" aria-current={i === at ? 'step' : undefined}>
              <span className="flex flex-col items-center">
                <span className={`flex size-6 items-center justify-center rounded-full ${done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  {done && <Check className="size-3.5" aria-hidden="true" />}
                </span>
                {i < TIMELINE.length - 1 && <span className={`my-0.5 w-0.5 flex-1 ${i < at ? 'bg-emerald-600' : 'bg-slate-200'}`} />}
              </span>
              <span className={`pb-3 text-sm ${i === at ? 'font-semibold text-slate-900' : done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
            </li>
          )
        })}
      </ol>
      {shipment && (
        <div className="mt-1 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-semibold text-slate-900">Kurir: {shipment.carrier}</p>
          {shipment.trackingNumber ? (
            <button
              type="button"
              onClick={copyResi}
              className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 font-mono font-semibold text-slate-900 ring-1 ring-slate-200"
            >
              {shipment.trackingNumber}
              {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4 text-slate-500" aria-hidden="true" />}
              <span className="sr-only">{copied ? 'Tersalin' : 'Salin nomor resi'}</span>
            </button>
          ) : (
            <p className="text-slate-600">Nomor resi tidak diberikan.</p>
          )}
          <p className="mt-1 text-xs text-slate-500">Dikirim {formatDateTime(shipment.shippedAt)}</p>
        </div>
      )}
    </section>
  )
}
