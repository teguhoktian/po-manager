import { randomBytes } from 'node:crypto'
import { Timestamp } from 'firebase-admin/firestore'
import { PAYMENT_MODE, PO_CLOSE_REASON, PO_STATUS } from '../../src/constants/statuses.js'
import { effectiveState } from '../../src/lib/poState.js'
import { computeTotals } from '../../src/lib/pricing.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'
import { sha256 } from './rateLimit.js'

const conflict = (message) => new HttpError(409, message)

const STATE_MESSAGE = {
  UPCOMING: 'PO ini belum dibuka.',
  FULL: 'Kuota PO ini sudah penuh.',
  CLOSED: 'PO ini sudah ditutup.',
}

/**
 * Create an order for an OPEN PO in ONE transaction: validate state/quota/stock against fresh data,
 * price every line from stored prices, write order + lines, bump counters, reserve stock, close the PO
 * when the quota is reached. The request never supplies a price, total or seller.
 *
 * Idempotent: the same (seller, idempotencyKey) returns the original receipt instead of a second order.
 * `db` and `now` are injected for testing.
 */
export async function placeOrder(db, input, now = new Date()) {
  const { storeSlug, poSlug, idempotencyKey, customer, items } = input

  const slugSnap = await db.collection('store_slugs').doc(storeSlug).get()
  const sellerId = slugSnap.exists ? slugSnap.data().sellerId : null
  const storeSnap = sellerId ? await db.collection('stores').doc(sellerId).get() : null
  if (!storeSnap?.exists || storeSnap.data().sellerId !== sellerId || storeSnap.data().slug !== storeSlug) {
    throw new HttpError(404, 'Toko tidak ditemukan')
  }
  const store = storeSnap.data()

  const idemRef = db.collection('idempotency_keys').doc(sha256(`${sellerId}:${idempotencyKey}`))
  let receipt
  let replayed = false

  await db.runTransaction(async (tx) => {
    // ---- reads (all before any write) ----
    const idemSnap = await tx.get(idemRef)
    if (idemSnap.exists) {
      receipt = idemSnap.data().receipt
      replayed = true
      return
    }

    const poQuery = await tx.get(db.collection('purchase_orders').where('sellerId', '==', sellerId).where('slug', '==', poSlug))
    const poDocs = poQuery.docs.filter((d) => ![PO_STATUS.DRAFT, PO_STATUS.CANCELLED].includes(d.data().status))
    if (!poDocs.length) throw new HttpError(404, 'PO tidak ditemukan')
    // Slugs are unique among live POs; if history leaves several, only an OPEN one can take orders.
    const poDoc = poDocs.find((d) => d.data().status === PO_STATUS.OPEN) ?? poDocs[0]
    const po = poDoc.data()

    const state = effectiveState(po, now)
    if (state !== 'OPEN') throw conflict(STATE_MESSAGE[state] ?? 'PO tidak menerima pesanan.')

    const itemSnaps = await Promise.all(items.map((i) => tx.get(db.collection('purchase_order_items').doc(i.itemId))))
    const poItems = itemSnaps.map((s, idx) => {
      const d = s.exists ? s.data() : null
      if (!d || d.sellerId !== sellerId || d.poId !== poDoc.id) throw conflict('Ada barang yang sudah tidak tersedia. Muat ulang halaman.')
      return { ...d, itemId: items[idx].itemId, quantity: items[idx].quantity }
    })

    const productRefs = new Map()
    const variantRefs = new Map()
    for (const it of poItems) {
      productRefs.set(it.productId, db.collection('products').doc(it.productId))
      if (it.variantId) variantRefs.set(it.variantId, db.collection('product_variants').doc(it.variantId))
    }
    const [productSnaps, variantSnaps] = await Promise.all([
      Promise.all([...productRefs.values()].map((r) => tx.get(r))),
      Promise.all([...variantRefs.values()].map((r) => tx.get(r))),
    ])
    const products = new Map(productSnaps.map((s) => [s.id, s]))
    const variants = new Map(variantSnaps.map((s) => [s.id, s]))

    // ---- validation + pricing ----
    const totalQty = poItems.reduce((n, i) => n + i.quantity, 0)
    if (totalQty < (po.minOrderQty ?? 1)) throw conflict(`Minimal pemesanan ${po.minOrderQty} barang.`)
    if (po.quota != null) {
      const left = Math.max(0, po.quota - (po.orderedQty ?? 0))
      if (totalQty > left) throw conflict(left === 0 ? 'Kuota PO ini sudah penuh.' : `Kuota PO tinggal ${left} barang. Kurangi jumlah pesanan.`)
    }

    const lines = []
    const stockWrites = []
    for (const it of poItems) {
      const productSnap = products.get(it.productId)
      const product = productSnap?.exists && productSnap.data().sellerId === sellerId ? productSnap.data() : null
      if (!product || product.status !== 'ACTIVE') throw conflict('Ada produk yang sudah tidak tersedia. Muat ulang halaman.')

      let variant = null
      if (it.variantId) {
        const vs = variants.get(it.variantId)
        variant = vs?.exists && vs.data().sellerId === sellerId && vs.data().productId === it.productId ? vs.data() : null
        if (!variant || variant.status !== 'ACTIVE') throw conflict(`Varian produk "${product.name}" sudah tidak tersedia. Muat ulang halaman.`)
      } else if (product.hasVariants) {
        throw conflict('Ada produk yang sudah tidak tersedia. Muat ulang halaman.')
      }

      const label = variant ? `${product.name} ${variant.name}` : product.name
      if (product.trackStock) {
        const source = variant ?? product
        const stock = Math.max(0, source.stock ?? 0)
        if (it.quantity > stock) throw conflict(stock === 0 ? `"${label}" sudah habis.` : `Stok "${label}" tinggal ${stock}.`)
        stockWrites.push({
          ref: variant ? variantRefs.get(it.variantId) : productRefs.get(it.productId),
          stock: stock - it.quantity,
        })
      }

      lines.push({
        itemId: it.itemId,
        productId: it.productId,
        variantId: it.variantId ?? null,
        productName: product.name,
        variantName: variant?.name ?? null,
        unitPrice: it.sellingPrice, // snapshot from the PO item, never from the request
        unitCost: (variant ?? product).purchaseCost ?? 0,
        quantity: it.quantity,
        lineTotal: it.sellingPrice * it.quantity,
      })
    }

    const totals = computeTotals(
      lines.map((l) => ({ price: l.unitPrice, qty: l.quantity })),
      { paymentMode: po.paymentMode, dpPercent: po.dpPercent },
    )
    const dpAmount = po.paymentMode === PAYMENT_MODE.DP ? totals.dpAmount : 0

    const sequence = (po.orderCount ?? 0) + 1
    const orderNumber = `${po.slug.replace(/-/g, '').toUpperCase().slice(0, 6)}-${String(sequence).padStart(4, '0')}`
    // Buyer-held secret for looking up this order later (only its hash is stored on the order).
    const accessToken = randomBytes(24).toString('base64url')
    const orderRef = db.collection('orders').doc()
    const createdAt = Timestamp.fromDate(now)

    // ---- writes ----
    tx.set(orderRef, {
      sellerId,
      storeId: sellerId,
      poId: poDoc.id,
      orderNumber,
      idempotencyKey: sha256(`${sellerId}:${idempotencyKey}`),
      accessTokenHash: sha256(accessToken),
      customer: { name: customer.name, whatsapp: customer.whatsapp, address: customer.address },
      totalQuantity: totalQty,
      subtotal: totals.subtotal,
      total: totals.subtotal,
      paidAmount: 0,
      balanceDue: totals.subtotal,
      paymentMode: po.paymentMode,
      dpAmount,
      status: 'ACTIVE',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'PENDING',
      createdAt,
      updatedAt: createdAt,
    })
    for (const line of lines) {
      tx.set(db.collection('order_items').doc(), {
        sellerId,
        orderId: orderRef.id,
        poId: poDoc.id,
        productId: line.productId,
        variantId: line.variantId,
        productName: line.productName,
        variantName: line.variantName,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        quantity: line.quantity,
        lineTotal: line.lineTotal,
        createdAt,
      })
    }
    for (const w of stockWrites) tx.update(w.ref, { stock: w.stock, updatedAt: createdAt })

    const orderedQty = (po.orderedQty ?? 0) + totalQty
    const poUpdate = { orderedQty, orderCount: sequence, updatedAt: createdAt }
    const quotaReached = po.quota != null && orderedQty >= po.quota
    if (quotaReached) Object.assign(poUpdate, { status: PO_STATUS.CLOSED, closedAt: createdAt, closeReason: PO_CLOSE_REASON.QUOTA })
    tx.update(poDoc.ref ?? db.collection('purchase_orders').doc(poDoc.id), poUpdate)

    receipt = {
      orderNumber,
      accessToken,
      storeSlug,
      poSlug: po.slug,
      createdAt: now.toISOString(),
      customerName: customer.name,
      poTitle: po.title,
      store: { name: store.name, whatsappNumber: store.whatsappNumber ?? null, paymentInfo: store.paymentInfo ?? '' },
      items: lines.map((l) => ({ name: l.productName, variantName: l.variantName, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal })),
      totalQuantity: totalQty,
      subtotal: totals.subtotal,
      total: totals.subtotal,
      paymentMode: po.paymentMode,
      dpPercent: po.dpPercent ?? null,
      dpAmount,
      balanceDue: totals.subtotal,
    }

    tx.set(idemRef, { sellerId, orderId: orderRef.id, receipt, createdAt, expiresAt: new Date(now.getTime() + 7 * 86400e3) })
    writeAudit(tx, db, {
      sellerId, actorUid: 'public', action: 'ORDER_CREATED', entityType: 'order', entityId: orderRef.id,
      meta: { orderNumber, total: totals.subtotal, quantity: totalQty },
    })
    if (quotaReached) {
      writeAudit(tx, db, {
        sellerId, actorUid: 'system', action: 'PO_AUTO_CLOSE', entityType: 'purchase_order', entityId: poDoc.id,
        meta: { from: PO_STATUS.OPEN, to: PO_STATUS.CLOSED, reason: PO_CLOSE_REASON.QUOTA },
      })
    }
  })

  return { receipt, replayed }
}
