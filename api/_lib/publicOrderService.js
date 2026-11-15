import { timingSafeEqual } from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { FULFILLMENT_STATUS, ORDER_STATUS, PAYMENT_RECORD_STATUS, PAYMENT_RECORD_TYPE, PAYMENT_STATUS } from '../../src/constants/statuses.js'
import { MAX_PROOF_BYTES } from '../../src/schemas/order.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'
import { sha256 } from './rateLimit.js'

const iso = (v) => (typeof v?.toMillis === 'function' ? new Date(v.toMillis()).toISOString() : null)
const MAX_PROOFS_PER_ORDER = 6

const sameHash = (a, b) => {
  const x = Buffer.from(String(a), 'hex')
  const y = Buffer.from(String(b), 'hex')
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y)
}

/** The amount and type the buyer is expected to pay next (DP or full first, then the balance). */
export function expectedPayment(order) {
  if (order.paymentStatus === PAYMENT_STATUS.PARTIALLY_PAID) return { type: PAYMENT_RECORD_TYPE.BALANCE, amount: order.balanceDue }
  if (order.paymentMode === 'DP') return { type: PAYMENT_RECORD_TYPE.DP, amount: order.dpAmount }
  return { type: PAYMENT_RECORD_TYPE.FULL, amount: order.total }
}

/** Wrong order number, wrong token and unknown store all look the same (404): nothing to probe. */
async function findOrder(db, { storeSlug, orderNumber, token }) {
  const notFound = new HttpError(404, 'Pesanan tidak ditemukan')
  const slugSnap = await db.collection('store_slugs').doc(storeSlug).get()
  const sellerId = slugSnap.exists ? slugSnap.data().sellerId : null
  if (!sellerId) throw notFound
  const storeSnap = await db.collection('stores').doc(sellerId).get()
  if (!storeSnap.exists || storeSnap.data().sellerId !== sellerId) throw notFound
  const snap = await db.collection('orders').where('sellerId', '==', sellerId).where('orderNumber', '==', orderNumber).get()
  const hash = sha256(token)
  const doc = snap.docs.find((d) => d.data().accessTokenHash && sameHash(d.data().accessTokenHash, hash))
  if (!doc) throw notFound
  return { sellerId, store: storeSnap.data(), orderId: doc.id, order: doc.data() }
}

async function paymentsOf(db, sellerId, orderId) {
  const snap = await db.collection('payments').where('sellerId', '==', sellerId).where('orderId', '==', orderId).get()
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** Buyer-facing order status. Whitelisted: no cost, no seller id, no proof paths. */
export async function getPublicOrder(db, input) {
  return buildView(db, await findOrder(db, input))
}

/**
 * Order lookup by order number + the WhatsApp number used at checkout (for buyers who lost their link).
 * Same view as above, but read-only: no token exists here, so uploading a proof still needs the order link.
 * A wrong number and an unknown order are indistinguishable (404).
 */
export async function trackPublicOrder(db, { orderNumber, whatsapp }) {
  const snap = await db.collection('orders').where('orderNumber', '==', orderNumber).get()
  const matches = snap.docs.filter((d) => d.data().customer?.whatsapp === whatsapp)
  if (!matches.length) throw new HttpError(404, 'Pesanan tidak ditemukan. Periksa kode pesanan dan nomor WhatsApp.')
  // Order numbers derive from the PO name, so two stores can share one. Never guess which order the buyer means.
  if (matches.length > 1) throw new HttpError(409, 'Kode pesanan ini dipakai di lebih dari satu toko. Buka lewat link pesanan dari penjual.')
  const doc = matches[0]
  const order = doc.data()
  const storeSnap = await db.collection('stores').doc(order.sellerId).get()
  if (!storeSnap.exists) throw new HttpError(404, 'Pesanan tidak ditemukan. Periksa kode pesanan dan nomor WhatsApp.')
  const view = await buildView(db, { sellerId: order.sellerId, store: storeSnap.data(), orderId: doc.id, order })
  return { ...view, canUpload: false }
}

async function buildView(db, { sellerId, store, orderId, order }) {
  const shipped = [FULFILLMENT_STATUS.SHIPPED, FULFILLMENT_STATUS.COMPLETED].includes(order.fulfillmentStatus)
  const [payments, linesSnap, poSnap, shipmentSnap] = await Promise.all([
    paymentsOf(db, sellerId, orderId),
    db.collection('order_items').where('sellerId', '==', sellerId).where('orderId', '==', orderId).get(),
    db.collection('purchase_orders').doc(order.poId).get(),
    shipped ? db.collection('shipments').doc(orderId).get() : null,
  ])
  const active = order.status === ORDER_STATUS.ACTIVE
  const hasPending = payments.some((p) => p.status === PAYMENT_RECORD_STATUS.SUBMITTED)
  const refundable = payments.filter((p) => p.type === PAYMENT_RECORD_TYPE.REFUND)
  const next = expectedPayment(order)

  return {
    order: {
      orderNumber: order.orderNumber,
      poTitle: poSnap.exists ? poSnap.data().title : '',
      poSlug: poSnap.exists ? poSnap.data().slug : null,
      customerName: order.customer.name,
      createdAt: iso(order.createdAt),
      status: order.status,
      paymentStatus: order.paymentStatus,
      fulfillmentStatus: order.fulfillmentStatus,
      cancelReason: order.cancelReason ?? null,
      paymentMode: order.paymentMode,
      total: order.total,
      dpAmount: order.dpAmount,
      paidAmount: order.paidAmount,
      balanceDue: active ? order.balanceDue : 0,
      totalQuantity: order.totalQuantity,
      items: linesSnap.docs.map((d) => d.data()).map((l) => ({ name: l.productName, variantName: l.variantName, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal })),
    },
    store: { name: store.name, whatsappNumber: store.whatsappNumber ?? null, paymentInfo: store.paymentInfo ?? '' },
    shipment:
      shipmentSnap?.exists && shipmentSnap.data().sellerId === sellerId
        ? { carrier: shipmentSnap.data().carrier, trackingNumber: shipmentSnap.data().trackingNumber ?? null, shippedAt: iso(shipmentSnap.data().shippedAt) }
        : null,
    payments: payments
      .filter((p) => p.type !== PAYMENT_RECORD_TYPE.REFUND)
      .sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
      .map((p) => ({ type: p.type, amount: p.amount, status: p.status, rejectReason: p.rejectReason ?? null, createdAt: iso(p.createdAt) })),
    refunded: refundable.reduce((n, p) => n + p.amount, 0),
    canUpload:
      active &&
      order.fulfillmentStatus === FULFILLMENT_STATUS.PENDING &&
      order.paymentStatus !== PAYMENT_STATUS.PAID &&
      !hasPending &&
      payments.length < MAX_PROOFS_PER_ORDER &&
      order.balanceDue > 0,
    awaitingVerification: hasPending,
    nextPayment: active && order.paymentStatus !== PAYMENT_STATUS.PAID ? next : null,
  }
}

const MAGIC = [
  { ext: 'jpg', mime: 'image/jpeg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', mime: 'image/png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', mime: 'image/webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
]

/** Identify the real image type from its bytes (the declared type is never trusted). */
export function sniffImage(buffer) {
  return MAGIC.find((m) => buffer.length > 12 && m.test(buffer)) ?? null
}

/**
 * Buyer uploads a payment proof. Validates type/size by magic bytes, stores the file via the injected
 * `storage` ({ save(path, buffer, contentType), remove(path) }) under the seller's private proof folder,
 * and creates a SUBMITTED payment for the seller to verify. One pending proof per order at a time.
 */
export async function submitPaymentProof(db, storage, input, now = new Date()) {
  const { sellerId, orderId, order } = await findOrder(db, input)

  if (order.status !== ORDER_STATUS.ACTIVE) throw new HttpError(409, 'Pesanan ini sudah dibatalkan.')
  if (order.paymentStatus === PAYMENT_STATUS.PAID || !(order.balanceDue > 0)) throw new HttpError(409, 'Pesanan ini sudah lunas.')
  if (order.fulfillmentStatus !== FULFILLMENT_STATUS.PENDING) throw new HttpError(409, 'Pesanan sudah diproses.')

  const buffer = Buffer.from(input.image, 'base64')
  if (buffer.length === 0 || buffer.length > MAX_PROOF_BYTES) throw new HttpError(400, 'Ukuran gambar terlalu besar (maks 1,5 MB).')
  const type = sniffImage(buffer)
  if (!type) throw new HttpError(400, 'File harus berupa gambar JPG, PNG, atau WebP.')

  const paymentRef = db.collection('payments').doc()
  const path = `sellers/${sellerId}/payment-proofs/${orderId}/${paymentRef.id}.${type.ext}`
  const expected = expectedPayment(order)
  const stamp = Timestamp.fromDate(now)

  await storage.save(path, buffer, type.mime)
  try {
    await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(db.collection('orders').doc(orderId))
      const existing = await tx.get(db.collection('payments').where('sellerId', '==', sellerId).where('orderId', '==', orderId))
      const fresh = orderSnap.data()
      if (fresh.status !== ORDER_STATUS.ACTIVE || fresh.paymentStatus === PAYMENT_STATUS.PAID) throw new HttpError(409, 'Pesanan ini tidak menerima pembayaran lagi.')
      if (existing.docs.some((d) => d.data().status === PAYMENT_RECORD_STATUS.SUBMITTED)) {
        throw new HttpError(409, 'Bukti pembayaran sebelumnya masih menunggu verifikasi penjual.')
      }
      if (existing.docs.length >= MAX_PROOFS_PER_ORDER) throw new HttpError(409, 'Batas unggah bukti untuk pesanan ini sudah tercapai. Hubungi penjual.')

      tx.set(paymentRef, {
        sellerId,
        orderId,
        poId: order.poId,
        orderNumber: order.orderNumber,
        type: expected.type,
        amount: expected.amount,
        proofPath: path,
        buyerNote: input.note || null,
        status: PAYMENT_RECORD_STATUS.SUBMITTED,
        rejectReason: null,
        verifiedAt: null,
        createdAt: stamp,
        updatedAt: stamp,
      })
      writeAudit(tx, db, {
        sellerId, actorUid: 'public', action: 'PAYMENT_PROOF_SUBMITTED', entityType: 'payment', entityId: paymentRef.id,
        meta: { orderNumber: order.orderNumber, type: expected.type, amount: expected.amount },
      })
    })
  } catch (error) {
    await storage.remove(path).catch(() => {})
    throw error
  }
  return { status: PAYMENT_RECORD_STATUS.SUBMITTED }
}
