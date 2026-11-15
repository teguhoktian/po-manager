import { Badge } from '../ui'
import { FULFILLMENT_STATUS_META, ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../lib/orderStatus'

/** Cancelled orders show only the cancellation; otherwise payment + fulfilment. */
export function OrderBadges({ order }) {
  if (order.status === 'CANCELLED') return <Badge tone={ORDER_STATUS_META.CANCELLED.tone}>{ORDER_STATUS_META.CANCELLED.label}</Badge>
  const pay = PAYMENT_STATUS_META[order.paymentStatus]
  const ful = FULFILLMENT_STATUS_META[order.fulfillmentStatus]
  return (
    <span className="flex flex-wrap gap-1.5">
      {pay && <Badge tone={pay.tone}>{pay.label}</Badge>}
      {ful && order.fulfillmentStatus !== 'PENDING' && <Badge tone={ful.tone}>{ful.label}</Badge>}
    </span>
  )
}
