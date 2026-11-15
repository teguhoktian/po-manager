import { PAYMENT_MODE } from '../constants/statuses.js'

// Display-side pricing. The server recomputes everything from stored prices at checkout (Phase 08);
// this only previews totals. Integer rupiah everywhere.

export const MAX_LINE_QTY = 100

/** lines: [{ price, qty }] */
export function computeTotals(lines, { paymentMode, dpPercent }) {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0)
  const quantity = lines.reduce((sum, l) => sum + l.qty, 0)
  // DP rounds up so the seller never under-collects by a rupiah; never more than the total.
  const dpAmount = paymentMode === PAYMENT_MODE.DP && dpPercent ? Math.min(subtotal, Math.ceil((subtotal * dpPercent) / 100)) : 0
  return { subtotal, quantity, dpAmount, payNow: paymentMode === PAYMENT_MODE.DP ? dpAmount : subtotal, balance: subtotal - (paymentMode === PAYMENT_MODE.DP ? dpAmount : subtotal) }
}

/**
 * Highest quantity still allowed for one option given the rest of the cart:
 * its own stock, the PO's remaining quota (shared across all options) and a per-line cap.
 */
export function maxQtyFor(option, { remainingQuota, othersQty }) {
  const caps = [MAX_LINE_QTY]
  if (option.stock !== null) caps.push(option.stock)
  if (remainingQuota !== null) caps.push(Math.max(0, remainingQuota - othersQty))
  return Math.max(0, Math.min(...caps))
}
