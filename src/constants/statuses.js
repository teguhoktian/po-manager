/**
 * Shared status vocabularies. Plain JS with no imports so server code (api/*) can reuse it.
 * Payment and fulfillment are tracked separately; cancellation is its own flag.
 */

export const PO_STATUS = Object.freeze({
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
})

/** Allowed PO transitions. Enforced server-side; clients can never change PO status. */
export const PO_TRANSITIONS = Object.freeze({
  DRAFT: ['SCHEDULED', 'OPEN', 'CANCELLED'],
  SCHEDULED: ['OPEN', 'DRAFT', 'CANCELLED'],
  OPEN: ['CLOSED', 'CANCELLED'],
  CLOSED: ['OPEN', 'PROCESSING', 'CANCELLED'],
  PROCESSING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
})

export const PO_CLOSE_REASON = Object.freeze({ DEADLINE: 'DEADLINE', QUOTA: 'QUOTA_FULL', MANUAL: 'MANUAL' })

export const PAYMENT_MODE = Object.freeze({ FULL: 'FULL', DP: 'DP' })

export const ORDER_STATUS = Object.freeze({ ACTIVE: 'ACTIVE', CANCELLED: 'CANCELLED' })

export const PAYMENT_STATUS = Object.freeze({
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
})

export const FULFILLMENT_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
})

export const PAYMENT_RECORD_TYPE = Object.freeze({ DP: 'DP', FULL: 'FULL', BALANCE: 'BALANCE', REFUND: 'REFUND' })

export const PAYMENT_RECORD_STATUS = Object.freeze({ SUBMITTED: 'SUBMITTED', VERIFIED: 'VERIFIED', REJECTED: 'REJECTED' })

export const CATALOG_STATUS = Object.freeze({ ACTIVE: 'ACTIVE', ARCHIVED: 'ARCHIVED' })

/**
 * Seller-triggered PO actions → allowed source statuses and target status.
 * `publish` resolves to OPEN or SCHEDULED depending on openAt (decided server-side).
 * Every (from → to) pair here must exist in PO_TRANSITIONS.
 */
export const PO_ACTIONS = Object.freeze({
  publish: { from: ['DRAFT'], to: null },
  open: { from: ['SCHEDULED'], to: 'OPEN' },
  unschedule: { from: ['SCHEDULED'], to: 'DRAFT' },
  close: { from: ['OPEN'], to: 'CLOSED' },
  reopen: { from: ['CLOSED'], to: 'OPEN' },
  process: { from: ['CLOSED'], to: 'PROCESSING' },
  complete: { from: ['PROCESSING'], to: 'COMPLETED' },
  cancel: { from: ['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'PROCESSING'], to: 'CANCELLED' },
})
