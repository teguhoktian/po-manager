import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui'
import { formatDateTime } from '../../lib/format'
import { formatCountdown, liveState } from '../../lib/poState'
import { STATE_META } from './poMeta'

export function PoListItem({ storeSlug, po, now }) {
  const state = liveState(po.state, po.closeAt, now)
  const meta = STATE_META[state]
  const closeAt = po.closeAt ? new Date(po.closeAt) : null
  return (
    <Link
      to={`/po/${storeSlug}/${po.slug}`}
      className="flex items-center gap-3 rounded-3xl border border-green-900/10 bg-white p-4 shadow-card transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-lift active:bg-brand-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-slate-900">{po.title}</h3>
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {state === 'OPEN' && closeAt
            ? `Ditutup ${formatDateTime(closeAt)} · sisa ${formatCountdown(closeAt - now)}`
            : state === 'UPCOMING' && po.openAt
              ? `Dibuka ${formatDateTime(new Date(po.openAt))}`
              : closeAt
                ? `Ditutup ${formatDateTime(closeAt)}`
                : ''}
        </p>
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <ChevronRight className="size-5" aria-hidden="true" />
      </span>
    </Link>
  )
}
