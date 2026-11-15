import { Timestamp } from 'firebase-admin/firestore'
import { ORDER_STATUS, PAYMENT_RECORD_STATUS, PAYMENT_RECORD_TYPE, PAYMENT_STATUS } from '../../src/constants/statuses.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'

const conflict = (message) => new HttpError(409, message)
const rupiah = (n) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`

/** Apply a verified amount to an order: totals and payment status are derived here, never sent by a client. */
function applyPayment(order, amount) {
  if (order.status !== ORDER_STATUS.ACTIVE) throw conflict('Pesanan ini sudah dibatalkan.')
  if (!(order.balanceDue > 0)) throw conflict('Pesanan ini sudah lunas.')
  if (amount > order.balanceDue) throw conflict(`Nominal melebihi sisa tagihan (${rupiah(order.balanceDue)}).`)
  const balanceDue = order.balanceDue - amount
  return {
    paidAmount: (order.paidAmount ?? 0) + amount,
    balanceDue,
    paymentStatus: balanceDue === 0 ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.PARTIALLY_PAID,
  }
}

/** Seller verifies or rejects a buyer's proof. Ownership comes from the verified UID (foreign = 404). */
export async function reviewPayment(db, uid, { paymentId, action, amount, reason }, now = new Date()) {
  const paymentRef = db.collection('payments').doc(paymentId)
  let result
  await db.runTransaction(async (tx) => {
    const paymentSnap = await tx.get(paymentRef)
    if (!paymentSnap.exists || paymentSnap.data().sellerId !== uid) throw new HttpError(404, 'Pembayaran tidak ditemukan')
    const payment = paymentSnap.data()
    if (payment.status !== PAYMENT_RECORD_STATUS.SUBMITTED) throw conflict('Pembayaran ini sudah diproses.')

    const orderRef = db.collection('orders').doc(payment.orderId)
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists || orderSnap.data().sellerId !== uid) throw new HttpError(404, 'Pesanan tidak ditemukan')
    const order = orderSnap.data()
    const stamp = Timestamp.fromDate(now)

    if (action === 'reject') {
      tx.update(paymentRef, { status: PAYMENT_RECORD_STATUS.REJECTED, rejectReason: reason, reviewedBy: uid, updatedAt: stamp })
      writeAudit(tx, db, { sellerId: uid, actorUid: uid, action: 'PAYMENT_REJECTED', entityType: 'payment', entityId: paymentId, meta: { orderNumber: order.orderNumber, reason } })
      result = { status: PAYMENT_RECORD_STATUS.REJECTED }
      return
    }

    const verified = amount ?? payment.amount
    const next = applyPayment(order, verified)
    tx.update(paymentRef, { status: PAYMENT_RECORD_STATUS.VERIFIED, amount: verified, verifiedAt: stamp, reviewedBy: uid, updatedAt: stamp })
    tx.update(orderRef, { ...next, updatedAt: stamp })
    writeAudit(tx, db, {
      sellerId: uid, actorUid: uid, action: 'PAYMENT_VERIFIED', entityType: 'payment', entityId: paymentId,
      meta: { orderNumber: order.orderNumber, amount: verified, paymentStatus: next.paymentStatus },
    })
    result = { status: PAYMENT_RECORD_STATUS.VERIFIED, paymentStatus: next.paymentStatus, balanceDue: next.balanceDue }
  })
  return result
}

/** Seller records money received outside the app. Stored as an already VERIFIED payment without a proof. */
export async function recordPayment(db, uid, { orderId, amount, note }, now = new Date()) {
  const orderRef = db.collection('orders').doc(orderId)
  let result
  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists || orderSnap.data().sellerId !== uid) throw new HttpError(404, 'Pesanan tidak ditemukan')
    const order = orderSnap.data()
    const next = applyPayment(order, amount)
    const stamp = Timestamp.fromDate(now)
    const type =
      order.paymentStatus === PAYMENT_STATUS.PENDING_PAYMENT
        ? order.paymentMode === 'DP' && amount < order.total
          ? PAYMENT_RECORD_TYPE.DP
          : PAYMENT_RECORD_TYPE.FULL
        : PAYMENT_RECORD_TYPE.BALANCE
    const paymentRef = db.collection('payments').doc()
    tx.set(paymentRef, {
      sellerId: uid, orderId, poId: order.poId, orderNumber: order.orderNumber, type, amount, proofPath: null,
      buyerNote: null, sellerNote: note || null, status: PAYMENT_RECORD_STATUS.VERIFIED, rejectReason: null,
      verifiedAt: stamp, reviewedBy: uid, createdAt: stamp, updatedAt: stamp,
    })
    tx.update(orderRef, { ...next, updatedAt: stamp })
    writeAudit(tx, db, {
      sellerId: uid, actorUid: uid, action: 'PAYMENT_RECORDED', entityType: 'payment', entityId: paymentRef.id,
      meta: { orderNumber: order.orderNumber, amount, paymentStatus: next.paymentStatus },
    })
    result = { paymentStatus: next.paymentStatus, balanceDue: next.balanceDue }
  })
  return result
}
