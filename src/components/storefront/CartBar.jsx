import { useState } from 'react'
import { ShoppingBag, X } from 'lucide-react'
import { Button } from '../ui'
import { CheckoutForm } from './CheckoutForm'
import { formatRupiah } from '../../lib/format'
import { QtyStepper } from './QtyStepper'

/** Sticky bottom summary + order sheet (cart review → buyer details). */
export function CartBar({ lines, totals, po, onChange, onClear, maxFor, onSubmitOrder }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState('cart')
  if (totals.quantity === 0) return null

  const belowMin = totals.quantity < po.minOrderQty
  const isDp = po.paymentMode === 'DP'

  return (
    <>
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-3xl bg-brand-950 py-2.5 pr-2.5 pl-5 text-white shadow-lift">
          <button type="button" onClick={() => setOpen(true)} className="min-w-0 flex-1 text-left" aria-haspopup="dialog">
            <span className="flex items-center gap-1.5 text-xs text-brand-100">
              <ShoppingBag className="size-3.5" aria-hidden="true" />
              {totals.quantity} barang · lihat detail
            </span>
            <span className="block truncate text-lg font-extrabold text-white">{formatRupiah(totals.subtotal)}</span>
          </button>
          <Button size="lg" onClick={() => setOpen(true)}>
            Pesanan
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-brand-950/60 backdrop-blur-sm sm:items-center"
          onClick={() => {
            setOpen(false)
            setStep('cart')
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Ringkasan pesanan"
            onClick={(e) => e.stopPropagation()}
            className="pb-safe flex max-h-[90dvh] w-full max-w-lg flex-col rounded-t-[2rem] bg-white shadow-lift sm:rounded-[2rem]"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">{step === 'cart' ? 'Ringkasan pesanan' : 'Data pemesan'}</h2>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setStep('cart')
                }}
                aria-label="Tutup"
                className="flex size-10 items-center justify-center rounded-full hover:bg-slate-100"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {step === 'cart' ? (
              <>
                <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
                  {lines.map((line) => (
                    <li key={line.itemId} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words text-slate-900">{line.label}</p>
                        <p className="text-sm text-slate-500">
                          {formatRupiah(line.price)} × {line.qty} ={' '}
                          <span className="font-semibold text-slate-800">{formatRupiah(line.price * line.qty)}</span>
                        </p>
                      </div>
                      <QtyStepper value={line.qty} max={maxFor(line)} label={line.label} onChange={(v) => onChange(line.itemId, v)} />
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 border-t border-slate-100 px-5 py-4 text-sm">
                  <Row label="Subtotal" value={formatRupiah(totals.subtotal)} strong />
                  {isDp && (
                    <>
                      <Row label={`DP ${po.dpPercent}% (bayar di awal)`} value={formatRupiah(totals.dpAmount)} />
                      <Row label="Sisa pelunasan" value={formatRupiah(totals.balance)} />
                    </>
                  )}
                  {belowMin && (
                    <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-800">Minimal pemesanan {po.minOrderQty} barang.</p>
                  )}
                  <Button size="lg" fullWidth className="mt-2" disabled={belowMin} onClick={() => setStep('details')}>
                    Lanjut isi data pemesan
                  </Button>
                  <button type="button" onClick={onClear} className="mx-auto block min-h-11 text-sm font-medium text-red-600">
                    Kosongkan keranjang
                  </button>
                </div>
              </>
            ) : (
              <CheckoutForm onBack={() => setStep('cart')} onSubmit={onSubmitOrder} />
            )}
          </div>
        </div>
      )}
    </>
  )
}

function Row({ label, value, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={strong ? 'font-semibold text-slate-900' : 'text-slate-600'}>{label}</span>
      <span className={strong ? 'text-base font-bold text-slate-900' : 'font-medium text-slate-800'}>{value}</span>
    </div>
  )
}
