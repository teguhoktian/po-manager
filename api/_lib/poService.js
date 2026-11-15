import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { PO_ACTIONS, PO_STATUS, PO_TRANSITIONS } from '../../src/constants/statuses.js'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'

const toMillis = (v) => (typeof v?.toMillis === 'function' ? v.toMillis() : new Date(v).getTime())
const fail = (message) => new HttpError(409, message)

/**
 * Everything that must be true before a PO can go live. Reads only (runs inside the transaction).
 * Clients may edit items while a PO is SCHEDULED, so this also runs when a scheduled PO is opened.
 */
async function assertPublishable(tx, db, uid, poRef, po, now) {
  if (toMillis(po.closeAt) <= now.getTime()) throw fail('Tanggal tutup sudah lewat. Ubah jadwal PO terlebih dahulu.')

  const [storeSnap, itemsSnap, sameSlugSnap] = await Promise.all([
    tx.get(db.collection('stores').doc(uid)),
    tx.get(db.collection('purchase_order_items').where('sellerId', '==', uid).where('poId', '==', poRef.id)),
    tx.get(db.collection('purchase_orders').where('sellerId', '==', uid).where('slug', '==', po.slug)),
  ])

  if (!storeSnap.exists) throw fail('Buat toko terlebih dahulu.')

  const clash = sameSlugSnap.docs.some(
    (d) => d.id !== poRef.id && ![PO_STATUS.DRAFT, PO_STATUS.CANCELLED].includes(d.data().status),
  )
  if (clash) throw fail('Alamat PO sudah dipakai PO lain. Ubah alamat PO.')

  const items = itemsSnap.docs.map((d) => d.data())
  if (!items.length) throw fail('Tambahkan minimal satu produk ke PO.')

  const seen = new Set()
  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ''}`
    if (seen.has(key)) throw fail('Ada produk yang ditambahkan dua kali.')
    seen.add(key)
  }

  const productIds = [...new Set(items.map((i) => i.productId))]
  const variantIds = [...new Set(items.filter((i) => i.variantId).map((i) => i.variantId))]
  const [productSnaps, variantSnaps] = await Promise.all([
    Promise.all(productIds.map((id) => tx.get(db.collection('products').doc(id)))),
    Promise.all(variantIds.map((id) => tx.get(db.collection('product_variants').doc(id)))),
  ])
  const products = new Map(productSnaps.map((s) => [s.id, s]))
  const variants = new Map(variantSnaps.map((s) => [s.id, s]))

  for (const item of items) {
    const productSnap = products.get(item.productId)
    const product = productSnap?.exists ? productSnap.data() : null
    if (!product || product.sellerId !== uid) throw fail('Ada produk di PO yang sudah tidak tersedia.')
    if (product.status !== 'ACTIVE') throw fail(`Produk "${product.name}" sudah diarsipkan. Hapus dari PO.`)

    if (product.hasVariants && !item.variantId) throw fail(`Pilih varian untuk produk "${product.name}".`)
    if (!product.hasVariants && item.variantId) throw fail(`Produk "${product.name}" tidak memiliki varian.`)

    if (item.variantId) {
      const variantSnap = variants.get(item.variantId)
      const variant = variantSnap?.exists ? variantSnap.data() : null
      if (!variant || variant.sellerId !== uid || variant.productId !== item.productId) {
        throw fail(`Varian untuk produk "${product.name}" tidak valid.`)
      }
      if (variant.status !== 'ACTIVE') throw fail(`Varian "${variant.name}" sudah diarsipkan. Hapus dari PO.`)
    }
  }
}

/**
 * Apply a seller action to a PO atomically. Ownership comes from the verified UID; a PO that is
 * missing or belongs to someone else is reported identically (404) so ids cannot be probed.
 * `db` and `now` are injected for testing.
 */
export async function transitionPO(db, uid, poId, action, now = new Date()) {
  const def = PO_ACTIONS[action]
  if (!def) throw new HttpError(400, 'Aksi tidak dikenal')

  const poRef = db.collection('purchase_orders').doc(poId)
  let result

  await db.runTransaction(async (tx) => {
    const poSnap = await tx.get(poRef)
    if (!poSnap.exists || poSnap.data().sellerId !== uid) throw new HttpError(404, 'PO tidak ditemukan')
    const po = poSnap.data()

    if (!def.from.includes(po.status)) throw fail(`Aksi ini tidak bisa dilakukan pada PO berstatus ${po.status}.`)

    // A PO can be cancelled only when no ACTIVE order remains (cancelled orders do not count).
    if (action === 'cancel' && po.orderCount > 0) {
      const orders = await tx.get(db.collection('orders').where('sellerId', '==', uid).where('poId', '==', poId))
      if (orders.docs.some((d) => d.data().status !== 'CANCELLED')) {
        throw fail('PO masih memiliki pesanan aktif. Batalkan semua pesanan terlebih dahulu.')
      }
    }

    // A PO is completed only when every active order has been delivered.
    if (action === 'complete' && po.orderCount > 0) {
      const orders = await tx.get(db.collection('orders').where('sellerId', '==', uid).where('poId', '==', poId))
      const open = orders.docs.filter((d) => d.data().status !== 'CANCELLED' && d.data().fulfillmentStatus !== 'COMPLETED').length
      if (open > 0) throw fail(`Masih ada ${open} pesanan yang belum selesai. Selesaikan atau batalkan dulu pesanan tersebut.`)
    }

    const update = { updatedAt: FieldValue.serverTimestamp() }
    let to = def.to

    if (action === 'publish' || action === 'open') {
      await assertPublishable(tx, db, uid, poRef, po, now)
    }

    if (action === 'publish') to = toMillis(po.openAt) <= now.getTime() ? PO_STATUS.OPEN : PO_STATUS.SCHEDULED
    if (action === 'open' && toMillis(po.openAt) > now.getTime()) update.openAt = Timestamp.fromDate(now)
    if (action === 'reopen') {
      if (toMillis(po.closeAt) <= now.getTime()) throw fail('Batas waktu PO sudah lewat, PO tidak bisa dibuka kembali.')
      if (po.quota != null && (po.orderedQty ?? 0) >= po.quota) throw fail('Kuota PO masih penuh. Batalkan pesanan untuk membebaskan kuota.')
      Object.assign(update, { closedAt: null, closeReason: null })
    }
    if (action === 'close') Object.assign(update, { closedAt: FieldValue.serverTimestamp(), closeReason: 'MANUAL' })

    // Defence in depth: the table in constants must agree with what we are about to write.
    if (!PO_TRANSITIONS[po.status]?.includes(to)) throw fail('Perubahan status tidak diizinkan.')

    update.status = to
    tx.update(poRef, update)
    writeAudit(tx, db, {
      sellerId: uid, actorUid: uid, action: `PO_${action.toUpperCase()}`, entityType: 'purchase_order', entityId: poId,
      meta: { from: po.status, to },
    })
    result = { status: to }
  })

  return result
}
