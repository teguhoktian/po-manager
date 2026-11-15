import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../ui'
import { OrderBadges } from './OrderBadges'
import { formatDateTime, formatRupiah } from '../../lib/format'
import { cn } from '../../lib/cn'

export function OrderCard({ order, poTitle, pendingProof, selectable, selected, onToggle }) {
  const cancelled = order.status === 'CANCELLED'
  const link = (
    <Link
      to={`/dashboard/orders/${order.id}`}
      className="flex items-center gap-3 rounded-card border border-green-900/10 bg-white p-4 shadow-card transition-[border-color,box-shadow] hover:border-brand-300 hover:shadow-lift"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 truncate font-mono text-sm font-semibold text-slate-900">{order.orderNumber}</p>
          <p className={cn('shrink-0 font-semibold', cancelled ? 'text-slate-400 line-through' : 'text-slate-900')}>
            {formatRupiah(order.total)}
          </p>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-700">{order.customer?.name}</p>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {poTitle ?? 'PO'} · {order.totalQuantity ?? 0} barang · {formatDateTime(order.createdAt)}
        </p>
        <div className="mt-2">
          <span className="flex flex-wrap gap-1.5">
            <OrderBadges order={order} />
            {pendingProof && <Badge tone="warning">Cek bukti bayar</Badge>}
          </span>
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-slate-400" aria-hidden="true" />
    </Link>
  )
  if (!selectable) return link
  return (
    <div className="flex items-stretch gap-2">
      <label className="flex w-11 shrink-0 cursor-pointer items-center justify-center rounded-card border border-green-900/10 bg-white shadow-card">
        <input type="checkbox" checked={selected} onChange={() => onToggle(order.id)} className="size-5 accent-brand-600" />
        <span className="sr-only">Pilih pesanan {order.orderNumber}</span>
      </label>
      <div className="min-w-0 flex-1 [&>a]:h-full">{link}</div>
    </div>
  )
}
