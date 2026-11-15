/** Pure report maths over rows the server already computed (orders.total/paidAmount/balanceDue, order_items.*). */

/** Cancelled orders are excluded from sales; their refunds are reported separately. */
export function summarizeOrders(orders) {
  const r = { orders: 0, qty: 0, revenue: 0, paid: 0, outstanding: 0, cancelled: 0, refunded: 0 }
  for (const o of orders) {
    if (o.status === 'CANCELLED') {
      r.cancelled += 1
      r.refunded += o.refundedAmount ?? 0
      continue
    }
    r.orders += 1
    r.qty += o.totalQuantity ?? 0
    r.revenue += o.total ?? 0
    r.paid += o.paidAmount ?? 0
    r.outstanding += o.balanceDue ?? 0
  }
  return r
}

/** One row per product/variant over ACTIVE orders only, biggest revenue first. profit = revenue − unitCost × qty. */
export function summarizeProducts(items, orders) {
  const active = new Set(orders.filter((o) => o.status === 'ACTIVE').map((o) => o.id))
  const rows = new Map()
  for (const i of items) {
    if (!active.has(i.orderId)) continue
    const key = `${i.productId}:${i.variantId ?? ''}`
    const row = rows.get(key) ?? { key, name: i.variantName ? `${i.productName} · ${i.variantName}` : i.productName, qty: 0, revenue: 0, cost: 0 }
    row.qty += i.quantity
    row.revenue += i.lineTotal
    row.cost += (i.unitCost ?? 0) * i.quantity
    rows.set(key, row)
  }
  return [...rows.values()].map((r) => ({ ...r, profit: r.revenue - r.cost })).sort((a, b) => b.revenue - a.revenue)
}

/** Orders waiting on the seller, for the dashboard overview. */
export function workQueue(orders, pendingProofOrderIds) {
  const q = { proofs: 0, toProcess: 0, processing: 0, toComplete: 0, unpaid: 0 }
  const pending = new Set(pendingProofOrderIds)
  for (const o of orders) {
    if (o.status !== 'ACTIVE') continue
    if (pending.has(o.id)) q.proofs += 1
    if (o.paymentStatus === 'PENDING_PAYMENT') q.unpaid += 1
    else if (o.fulfillmentStatus === 'PENDING') q.toProcess += 1
    if (o.fulfillmentStatus === 'PROCESSING' || o.fulfillmentStatus === 'PACKED') q.processing += 1
    if (o.fulfillmentStatus === 'SHIPPED') q.toComplete += 1
  }
  return q
}
