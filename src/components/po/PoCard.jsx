import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { PoStatusBadge } from './PoStatusBadge'
import { QuotaProgress } from './QuotaProgress'
import { formatDateTime } from '../../lib/format'

export function PoCard({ po }) {
  return (
    <Link
      to={`/dashboard/po/${po.id}`}
      className="block rounded-card border border-slate-200/80 bg-white p-4 shadow-card transition-colors hover:border-brand-300"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 truncate font-semibold text-slate-900">{po.title}</h3>
        <PoStatusBadge status={po.status} />
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
        <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
        {formatDateTime(po.openAt)} → {formatDateTime(po.closeAt)}
      </p>
      <div className="mt-3">
        <QuotaProgress ordered={po.orderedQty} quota={po.quota} />
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {po.orderCount ?? 0} pesanan masuk · {po.paymentMode === 'DP' ? `DP ${po.dpPercent}%` : 'Bayar lunas'}
      </p>
    </Link>
  )
}
