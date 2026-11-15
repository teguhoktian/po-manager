import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../firebase/data'
import { apiFetch } from './apiClient'

const withId = (snap) => ({ id: snap.id, ...snap.data() })

/** Newest first. Rules require the sellerId filter; sorting happens here so no extra index is needed. */
export async function listOrders(uid) {
  const snap = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', uid), limit(300)))
  return snap.docs.map(withId).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function getOrder(orderId) {
  const snap = await getDoc(doc(db, 'orders', orderId))
  return snap.exists() ? withId(snap) : null
}

export async function listOrderItems(uid, orderId) {
  const snap = await getDocs(query(collection(db, 'order_items'), where('sellerId', '==', uid), where('orderId', '==', orderId), limit(100)))
  return snap.docs.map(withId)
}

/** Server-side cancel (restores stock and quota). Throws Error(message) on failure. */
export async function cancelOrder(orderId, reason, refund = false) {
  return apiFetch('/api/orders/cancel', { method: 'POST', body: { orderId, ...(reason ? { reason } : {}), ...(refund ? { refund: true } : {}) } })
}

export async function listPayments(uid, orderId) {
  const snap = await getDocs(query(collection(db, 'payments'), where('sellerId', '==', uid), where('orderId', '==', orderId), limit(50)))
  return snap.docs.map(withId).sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
}

/** Order ids that have a proof waiting for the seller's review. */
export async function listPendingProofOrderIds(uid) {
  const snap = await getDocs(query(collection(db, 'payments'), where('sellerId', '==', uid), where('status', '==', 'SUBMITTED'), limit(300)))
  return [...new Set(snap.docs.map((d) => d.data().orderId))]
}

/** action: 'verify' (amount optional) | 'reject' (reason required). */
export const reviewPayment = (paymentId, action, { amount, reason } = {}) =>
  apiFetch('/api/payments/review', { method: 'POST', body: { paymentId, action, ...(amount ? { amount } : {}), ...(reason ? { reason } : {}) } })

export const recordPayment = (orderId, amount, note) =>
  apiFetch('/api/payments/record', { method: 'POST', body: { orderId, amount, ...(note ? { note } : {}) } })

export async function getShipment(orderId) {
  const snap = await getDoc(doc(db, 'shipments', orderId))
  return snap.exists() ? withId(snap) : null
}

/** status: next/previous step. `shipment` {carrier, trackingNumber?, note?} is required for SHIPPED. */
export const updateFulfillment = (orderId, status, shipment) =>
  apiFetch('/api/orders/fulfillment', { method: 'POST', body: { orderId, status, ...(shipment ? { shipment } : {}) } })

/** status: 'PROCESSING' | 'PACKED'. Resolves { results, updated, failed } (one failure never blocks the rest). */
export const bulkUpdateFulfillment = (orderIds, status) => apiFetch('/api/orders/fulfillment-bulk', { method: 'POST', body: { orderIds, status } })

export const updateShipment = (orderId, { carrier, trackingNumber, note }) =>
  apiFetch('/api/orders/shipment', { method: 'POST', body: { orderId, carrier, ...(trackingNumber ? { trackingNumber } : {}), ...(note ? { note } : {}) } })

/** All orders / lines of one PO (equality filters only, no composite index). */
export async function listOrdersByPo(uid, poId) {
  const snap = await getDocs(query(collection(db, 'orders'), where('sellerId', '==', uid), where('poId', '==', poId), limit(500)))
  return snap.docs.map(withId)
}

export async function listItemsByPo(uid, poId) {
  const snap = await getDocs(query(collection(db, 'order_items'), where('sellerId', '==', uid), where('poId', '==', poId), limit(2000)))
  return snap.docs.map(withId)
}
