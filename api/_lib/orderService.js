import { Timestamp } from 'firebase-admin/firestore'
import { FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_RECORD_STATUS, PAYMENT_RECORD_TYPE, PAYMENT_STATUS } from '../../src/constants/statuses.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'

const conflict = (message) => new HttpError(409, message)

/**
 * Cancel an order (seller action). Allowed before fulfilment starts. If money was already received the seller
 * must pass `refund = true` (confirming they return it): a REFUND payment is recorded and the order becomes REFUNDED.
 * Proofs still waiting for review are rejected automatically. Stock reserved at checkout goes back and the PO's ordered quantity drops, in the
 * same transaction. Ownership comes from the verified UID; a missing order and someone else's order both
 * answer 404 so ids cannot be probed. `db` and `now` are injected for testing.
 */
export async function cancelOrder(db, uid, orderId, reason, now = new Date(), refund = false) {
  const orderRef = db.collection('orders').doc(orderId)

  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists || orderSnap.data().sellerId !== uid) throw new HttpError(404, 'Pesanan tidak ditemukan')
    const order = orderSnap.data()

    if (order.status === ORDER_STATUS.CANCELLED) throw conflict('Pesanan ini sudah dibatalkan.')
    const paid = order.paidAmount ?? 0
    if (paid > 0 && !refund) {
      throw conflict(`Pesanan ini sudah dibayar Rp ${new Intl.NumberFormat('id-ID').format(paid)}. Konfirmasi pengembalian dana untuk membatalkan.`)
    }
    if (order.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) throw conflict('Pesanan ini sudah diproses atau dikirim.')

    const poRef = db.collection('purchase_orders').doc(order.poId)
    const [poSnap, paymentsQuery, linesQuery] = await Promise.all([
      tx.get(poRef),
      tx.get(db.collection('payments').where('sellerId', '==', uid).where('orderId', '==', orderId)),
      tx.get(db.collection('order_items').where('sellerId', '==', uid).where('orderId', '==', orderId)),
    ])
    const lines = linesQuery.docs.map((d) => d.data())

    const refs = new Map()
    for (const l of lines) {
      refs.set(l.variantId ? `v:${l.variantId}` : `p:${l.productId}`, {
        ref: db.collection(l.variantId ? 'product_variants' : 'products').doc(l.variantId ?? l.productId),
        productRef: db.collection('products').doc(l.productId),
        quantity: l.quantity,
      })
    }
    const targets = [...refs.values()]
    const [targetSnaps, productSnaps] = await Promise.all([
      Promise.all(targets.map((t) => tx.get(t.ref))),
      Promise.all(targets.map((t) => tx.get(t.productRef))),
    ])

    const stamp = Timestamp.fromDate(now)

    // Give stock back only for products that track it (same rule as at checkout).
    targets.forEach((t, i) => {
      const target = targetSnaps[i]
      const product = productSnaps[i]
      if (!target.exists || !product.exists || target.data().sellerId !== uid || product.data().sellerId !== uid) return
      if (!product.data().trackStock) return
      tx.update(t.ref, { stock: (target.data().stock ?? 0) + t.quantity, updatedAt: stamp })
    })

    if (poSnap.exists && poSnap.data().sellerId === uid) {
      tx.update(poRef, { orderedQty: Math.max(0, (poSnap.data().orderedQty ?? 0) - (order.totalQuantity ?? 0)), updatedAt: stamp })
    }

    for (const p of paymentsQuery.docs) {
      if (p.data().status === PAYMENT_RECORD_STATUS.SUBMITTED) {
        tx.update(db.collection('payments').doc(p.id), { status: PAYMENT_RECORD_STATUS.REJECTED, rejectReason: 'Pesanan dibatalkan', updatedAt: stamp })
      }
    }
    if (paid > 0) {
      tx.set(db.collection('payments').doc(), {
        sellerId: uid, orderId, poId: order.poId, orderNumber: order.orderNumber, type: PAYMENT_RECORD_TYPE.REFUND, amount: paid,
        proofPath: null, buyerNote: null, status: PAYMENT_RECORD_STATUS.VERIFIED, rejectReason: null, verifiedAt: stamp, reviewedBy: uid,
        createdAt: stamp, updatedAt: stamp,
      })
    }

    tx.update(orderRef, {
      ...(paid > 0 ? { paymentStatus: PAYMENT_STATUS.REFUNDED, refundedAmount: paid } : {}),
      balanceDue: 0,
      status: ORDER_STATUS.CANCELLED,
      cancelledAt: stamp,
      cancelledBy: uid,
      cancelReason: reason || null,
      updatedAt: stamp,
    })
    writeAudit(tx, db, {
      sellerId: uid, actorUid: uid, action: 'ORDER_CANCELLED', entityType: 'order', entityId: orderId,
      meta: { orderNumber: order.orderNumber, quantity: order.totalQuantity ?? 0, reason: reason || null, refunded: paid },
    })
  })

  return { status: ORDER_STATUS.CANCELLED }
}
