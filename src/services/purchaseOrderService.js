import {
  Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase/data'
import { apiFetch } from './apiClient'
import { listProducts, listVariants } from './productService'

const withId = (snap) => ({ id: snap.id, ...snap.data() })

/** Form values (Dates) → Firestore fields shared by create and update. */
const content = (v) => ({
  title: v.title,
  slug: v.slug,
  description: v.description,
  paymentMode: v.paymentMode,
  dpPercent: v.paymentMode === 'DP' ? v.dpPercent : null,
  openAt: Timestamp.fromDate(v.openAt),
  closeAt: Timestamp.fromDate(v.closeAt),
  quota: v.quota,
  minOrderQty: v.minOrderQty,
})

export async function listPurchaseOrders(uid) {
  const snap = await getDocs(query(collection(db, 'purchase_orders'), where('sellerId', '==', uid), limit(300)))
  return snap.docs.map(withId).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function getPurchaseOrder(poId) {
  const snap = await getDoc(doc(db, 'purchase_orders', poId))
  return snap.exists() ? withId(snap) : null
}

/** New POs are always DRAFT with zeroed counters (enforced by rules). Returns the new id. */
export async function createPurchaseOrder(uid, values) {
  const ref = await addDoc(collection(db, 'purchase_orders'), {
    sellerId: uid,
    storeId: uid,
    ...content(values),
    status: 'DRAFT',
    orderedQty: 0,
    orderCount: 0,
    closedAt: null,
    closeReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export function updatePurchaseOrder(poId, values) {
  return updateDoc(doc(db, 'purchase_orders', poId), { ...content(values), updatedAt: serverTimestamp() })
}

export async function listPoItemDocs(uid, poId) {
  const snap = await getDocs(
    query(collection(db, 'purchase_order_items'), where('sellerId', '==', uid), where('poId', '==', poId), limit(200)),
  )
  return snap.docs.map(withId).sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
}

/** Drafts only (rules): removes the items first, then the PO. */
export async function deleteDraftPurchaseOrder(uid, poId) {
  const items = await listPoItemDocs(uid, poId)
  await Promise.all(items.map((item) => deleteDoc(doc(db, 'purchase_order_items', item.id))))
  await deleteDoc(doc(db, 'purchase_orders', poId))
}

export function addPoItem(uid, poId, { productId, variantId, sellingPrice }) {
  return addDoc(collection(db, 'purchase_order_items'), {
    sellerId: uid,
    poId,
    productId,
    variantId: variantId ?? null,
    sellingPrice,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updatePoItemPrice(itemId, sellingPrice) {
  return updateDoc(doc(db, 'purchase_order_items', itemId), { sellingPrice, updatedAt: serverTimestamp() })
}

export function removePoItem(itemId) {
  return deleteDoc(doc(db, 'purchase_order_items', itemId))
}

/** Items with product/variant names attached for display. */
export async function loadPoItems(uid, poId) {
  const [items, products] = await Promise.all([listPoItemDocs(uid, poId), listProducts(uid)])
  const productMap = new Map(products.map((p) => [p.id, p]))
  const variantProductIds = [...new Set(items.filter((i) => i.variantId).map((i) => i.productId))]
  const variantLists = await Promise.all(variantProductIds.map((id) => listVariants(uid, id)))
  const variantMap = new Map(variantLists.flat().map((v) => [v.id, v]))

  return items.map((item) => {
    const product = productMap.get(item.productId)
    const variant = item.variantId ? variantMap.get(item.variantId) : null
    return {
      ...item,
      productName: product?.name ?? 'Produk tidak ditemukan',
      variantName: variant?.name ?? null,
      imagePath: product?.imagePaths?.[0] ?? null,
      unavailable: !product || product.status !== 'ACTIVE' || (item.variantId && (!variant || variant.status !== 'ACTIVE')),
    }
  })
}

/** Server-side status change (publish, open, close, …). Throws Error(message) on failure. */
export function transitionPurchaseOrder(poId, action) {
  return apiFetch('/api/po/status', { method: 'POST', body: { poId, action } })
}
