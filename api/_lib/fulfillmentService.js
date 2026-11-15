import { Timestamp } from 'firebase-admin/firestore'
import { FULFILLMENT_STATUS } from '../../src/constants/statuses.js'
import { fulfillmentBlock } from '../../src/lib/fulfillment.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'

const conflict = (message) => new HttpError(409, message)

/**
 * Move an order one step along PENDING → PROCESSING → PACKED → SHIPPED → COMPLETED (or one step back to fix a
 * mistake). Payment gates and valid steps come from the shared `fulfillmentBlock`. Shipping writes the
 * `shipments/{orderId}` record. Ownership from the verified UID; foreign and missing orders both 404.
 */
export async function updateFulfillment(db, uid, { orderId, status, shipment }, now = new Date()) {
  const orderRef = db.collection('orders').doc(orderId)
  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists || orderSnap.data().sellerId !== uid) throw new HttpError(404, 'Pesanan tidak ditemukan')
    const order = orderSnap.data()
    const block = fulfillmentBlock(order, status)
    if (block) throw conflict(block)

    const shipmentRef = db.collection('shipments').doc(orderId)
    const existing = status === FULFILLMENT_STATUS.SHIPPED ? await tx.get(shipmentRef) : null
    const stamp = Timestamp.fromDate(now)

    const update = { fulfillmentStatus: status, updatedAt: stamp }
    if (status === FULFILLMENT_STATUS.SHIPPED) update.shippedAt = stamp
    if (status === FULFILLMENT_STATUS.COMPLETED) update.completedAt = stamp
    if (order.fulfillmentStatus === FULFILLMENT_STATUS.SHIPPED && status === FULFILLMENT_STATUS.PACKED) update.shippedAt = null

    if (status === FULFILLMENT_STATUS.SHIPPED) {
      tx.set(shipmentRef, {
        sellerId: uid,
        orderId,
        poId: order.poId,
        orderNumber: order.orderNumber,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber || null,
        note: shipment.note || null,
        shippedAt: stamp,
        createdAt: existing?.exists ? existing.data().createdAt : stamp,
        updatedAt: stamp,
      })
    }
    tx.update(orderRef, update)
    writeAudit(tx, db, {
      sellerId: uid,
      actorUid: uid,
      action: 'FULFILLMENT_UPDATED',
      entityType: 'order',
      entityId: orderId,
      meta: { orderNumber: order.orderNumber, from: order.fulfillmentStatus, to: status },
    })
  })
  return { fulfillmentStatus: status }
}

/** Same step for several orders. Each order is its own transaction; one failure never blocks the others. */
export async function bulkUpdateFulfillment(db, uid, { orderIds, status }, now = new Date()) {
  const results = []
  for (const orderId of [...new Set(orderIds)]) {
    try {
      await updateFulfillment(db, uid, { orderId, status }, now)
      results.push({ orderId, ok: true })
    } catch (error) {
      if (!(error instanceof HttpError)) throw error
      results.push({ orderId, ok: false, error: error.message })
    }
  }
  return { results, updated: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length }
}

/** Edit courier / tracking number after shipping (typo fix, new resi). */
export async function updateShipment(db, uid, { orderId, carrier, trackingNumber, note }, now = new Date()) {
  const orderRef = db.collection('orders').doc(orderId)
  await db.runTransaction(async (tx) => {
    const orderSnap = await tx.get(orderRef)
    if (!orderSnap.exists || orderSnap.data().sellerId !== uid) throw new HttpError(404, 'Pesanan tidak ditemukan')
    const order = orderSnap.data()
    if (order.status !== 'ACTIVE') throw conflict('Pesanan sudah dibatalkan.')
    if (![FULFILLMENT_STATUS.SHIPPED, FULFILLMENT_STATUS.COMPLETED].includes(order.fulfillmentStatus))
      throw conflict('Pesanan belum dikirim.')
    const shipmentRef = db.collection('shipments').doc(orderId)
    const shipmentSnap = await tx.get(shipmentRef)
    if (!shipmentSnap.exists || shipmentSnap.data().sellerId !== uid) throw new HttpError(404, 'Data pengiriman tidak ditemukan')
    tx.update(shipmentRef, { carrier, trackingNumber: trackingNumber || null, note: note || null, updatedAt: Timestamp.fromDate(now) })
    writeAudit(tx, db, {
      sellerId: uid,
      actorUid: uid,
      action: 'SHIPMENT_UPDATED',
      entityType: 'order',
      entityId: orderId,
      meta: { orderNumber: order.orderNumber, carrier },
    })
  })
  return { ok: true }
}
