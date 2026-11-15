import { PO_STATUS } from '../../src/constants/statuses.js'
import { effectiveState } from '../../src/lib/poState.js'
import { HttpError } from './http.js'

export { effectiveState }

/**
 * Read-only public view of a store and its POs. Everything returned here is whitelisted field by field:
 * never purchaseCost, sellerId, ids of other tenants, customer data or internal counters beyond what
 * a buyer needs (remaining quota). The public never reads Firestore directly.
 */

const toMillis = (v) => (typeof v?.toMillis === 'function' ? v.toMillis() : v ? new Date(v).getTime() : null)
const iso = (v) => {
  const ms = toMillis(v)
  return ms == null || Number.isNaN(ms) ? null : new Date(ms).toISOString()
}

const LISTED = [PO_STATUS.SCHEDULED, PO_STATUS.OPEN, PO_STATUS.CLOSED, PO_STATUS.PROCESSING, PO_STATUS.COMPLETED]

/** Public Storage URL for an image the seller owns. Anything else (other tenant, traversal) is dropped. */
export function publicImageUrl(path, sellerId, bucket) {
  if (!bucket || typeof path !== 'string') return null
  const prefix = `sellers/${sellerId}/`
  if (!path.startsWith(prefix) || path.includes('..') || path.length > 300) return null
  return `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(path)}?alt=media`
}

const remainingQuota = (po) => (po.quota == null ? null : Math.max(0, po.quota - (po.orderedQty ?? 0)))

function poSummary(id, po, now) {
  return {
    id,
    title: po.title,
    slug: po.slug,
    description: po.description ?? '',
    state: effectiveState(po, now),
    openAt: iso(po.openAt),
    closeAt: iso(po.closeAt),
    paymentMode: po.paymentMode,
    dpPercent: po.dpPercent ?? null,
    minOrderQty: po.minOrderQty ?? 1,
    remainingQuota: remainingQuota(po),
  }
}

async function loadStore(db, storeSlug, bucket) {
  const slugSnap = await db.collection('store_slugs').doc(storeSlug).get()
  const sellerId = slugSnap.exists ? slugSnap.data().sellerId : null
  const storeSnap = sellerId ? await db.collection('stores').doc(sellerId).get() : null
  if (!storeSnap?.exists || storeSnap.data().sellerId !== sellerId || storeSnap.data().slug !== storeSlug) {
    throw new HttpError(404, 'Toko tidak ditemukan')
  }
  const s = storeSnap.data()
  return {
    sellerId,
    store: {
      name: s.name,
      slug: s.slug,
      description: s.description ?? '',
      whatsappNumber: s.whatsappNumber ?? null,
      logoUrl: s.logoPath ? publicImageUrl(s.logoPath, sellerId, bucket) : null,
    },
  }
}

/** Store profile + its listed POs (newest first). */
export async function getPublicStore(db, { storeSlug, now = new Date(), bucket }) {
  const { sellerId, store } = await loadStore(db, storeSlug, bucket)
  const snap = await db.collection('purchase_orders').where('sellerId', '==', sellerId).where('status', 'in', LISTED).get()
  const rank = { OPEN: 0, UPCOMING: 1, FULL: 2, CLOSED: 3 }
  const orders = snap.docs
    .map((d) => poSummary(d.id, d.data(), now))
    .sort((a, b) => rank[a.state] - rank[b.state] || (b.closeAt ?? '').localeCompare(a.closeAt ?? ''))
    .slice(0, 30)
  return { store, orders }
}

/** One PO with its sellable items grouped per product. */
export async function getPublicPO(db, { storeSlug, poSlug, now = new Date(), bucket }) {
  const { sellerId, store } = await loadStore(db, storeSlug, bucket)

  const poSnap = await db.collection('purchase_orders').where('sellerId', '==', sellerId).where('slug', '==', poSlug).get()
  const live = poSnap.docs.filter((d) => LISTED.includes(d.data().status))
  if (!live.length) throw new HttpError(404, 'PO tidak ditemukan')
  // Slugs are unique among live POs (enforced at publish); if history leaves several, the newest wins.
  live.sort((a, b) => (toMillis(b.data().openAt) ?? 0) - (toMillis(a.data().openAt) ?? 0))
  const poDoc = live[0]
  const po = poDoc.data()

  const itemsSnap = await db.collection('purchase_order_items').where('sellerId', '==', sellerId).where('poId', '==', poDoc.id).get()
  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

  const productIds = [...new Set(items.map((i) => i.productId))]
  const variantIds = [...new Set(items.filter((i) => i.variantId).map((i) => i.variantId))]
  const [productSnaps, variantSnaps] = await Promise.all([
    Promise.all(productIds.map((id) => db.collection('products').doc(id).get())),
    Promise.all(variantIds.map((id) => db.collection('product_variants').doc(id).get())),
  ])
  const products = new Map(productSnaps.filter((s) => s.exists && s.data().sellerId === sellerId).map((s) => [s.id, s.data()]))
  const variants = new Map(variantSnaps.filter((s) => s.exists && s.data().sellerId === sellerId).map((s) => [s.id, s.data()]))

  const grouped = new Map()
  for (const item of items) {
    const product = products.get(item.productId)
    if (!product || product.status !== 'ACTIVE') continue
    const variant = item.variantId ? variants.get(item.variantId) : null
    if (item.variantId && (!variant || variant.productId !== item.productId || variant.status === 'ARCHIVED')) continue
    if (!item.variantId && product.hasVariants) continue

    const stockSource = variant ?? product
    const stock = product.trackStock ? Math.max(0, stockSource.stock ?? 0) : null

    if (!grouped.has(item.productId)) {
      grouped.set(item.productId, {
        productId: item.productId,
        name: product.name,
        description: product.description ?? '',
        images: (product.imagePaths ?? []).map((p) => publicImageUrl(p, sellerId, bucket)).filter(Boolean),
        options: [],
      })
    }
    grouped.get(item.productId).options.push({
      itemId: item.id,
      variantId: item.variantId ?? null,
      name: variant ? variant.name : null,
      price: item.sellingPrice,
      stock,
      soldOut: stock !== null && stock <= 0,
    })
  }

  const productsOut = [...grouped.values()].sort((a, b) => a.name.localeCompare(b.name, 'id'))
  for (const p of productsOut) p.options.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'id'))

  return { store, order: poSummary(poDoc.id, po, now), products: productsOut }
}
