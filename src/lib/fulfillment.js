import { FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_STATUS } from '../constants/statuses.js'

// Shared by the server (authoritative) and the dashboard (to show/hide actions). Explicit .js imports.

export const FULFILLMENT_FLOW = [
  FULFILLMENT_STATUS.PENDING,
  FULFILLMENT_STATUS.PROCESSING,
  FULFILLMENT_STATUS.PACKED,
  FULFILLMENT_STATUS.SHIPPED,
  FULFILLMENT_STATUS.COMPLETED,
]

export const nextFulfillment = (status) => FULFILLMENT_FLOW[FULFILLMENT_FLOW.indexOf(status) + 1] ?? null

/** One step back is allowed to correct a mistake, except out of COMPLETED. */
export const prevFulfillment = (status) => {
  const i = FULFILLMENT_FLOW.indexOf(status)
  return i > 0 && status !== FULFILLMENT_STATUS.COMPLETED ? FULFILLMENT_FLOW[i - 1] : null
}

const PAID_ENOUGH_TO_PREPARE = [PAYMENT_STATUS.PARTIALLY_PAID, PAYMENT_STATUS.PAID]

/**
 * Why `order` cannot move to `to` right now (Indonesian message), or null when it can.
 * Preparing (processing/packing) needs a verified payment (a DP is enough); shipping and completion need PAID.
 */
export function fulfillmentBlock(order, to) {
  if (order.status !== ORDER_STATUS.ACTIVE) return 'Pesanan sudah dibatalkan.'
  const from = order.fulfillmentStatus
  const forward = nextFulfillment(from) === to
  const back = prevFulfillment(from) === to
  if (!forward && !back) return 'Perubahan status ini tidak valid.'
  if (back) return null
  if (to === FULFILLMENT_STATUS.PROCESSING || to === FULFILLMENT_STATUS.PACKED) {
    return PAID_ENOUGH_TO_PREPARE.includes(order.paymentStatus) ? null : 'Belum ada pembayaran yang diverifikasi.'
  }
  return order.paymentStatus === PAYMENT_STATUS.PAID ? null : 'Pesanan belum lunas.'
}
