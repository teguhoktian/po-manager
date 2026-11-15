import { Minus, Plus } from 'lucide-react'

/** 44px touch targets; `max` already accounts for stock, quota and other cart lines. */
export function QtyStepper({ value, max, onChange, label, disabled }) {
  const atMax = value >= max
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-0.5" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 0}
        aria-label={`Kurangi ${label}`}
        className="flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 disabled:opacity-35"
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <span className="min-w-9 text-center text-base font-bold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={disabled || atMax}
        aria-label={`Tambah ${label}`}
        className="flex size-11 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-60"
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
