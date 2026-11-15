/** Ordered units vs quota. Quota null means unlimited. */
export function QuotaProgress({ ordered = 0, quota }) {
  if (quota == null) return <p className="text-sm text-slate-600">{ordered} terpesan · tanpa batas kuota</p>
  const pct = Math.min(100, Math.round((ordered / quota) * 100))
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm text-slate-600">
        <span>{ordered} / {quota} terpesan</span>
        <span>{pct}%</span>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={quota} aria-valuenow={Math.min(ordered, quota)} className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div className={pct >= 100 ? 'h-full bg-amber-500' : 'h-full bg-brand-600'} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
