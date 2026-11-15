import {
  addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where,
} from 'firebase/firestore'
import { db } from '../firebase/data'
import { CATALOG_STATUS } from '../constants/statuses'
import { deleteImage, imageExtension, uploadImage } from './imageService'
import { optimizeImage } from '../lib/imageOptimize'

const byUpdatedDesc = (a, b) => (b.updatedAt?.seconds ?? 0) - (a.updatedAt?.seconds ?? 0)
const withId = (snap) => ({ id: snap.id, ...snap.data() })

export const newProductId = () => doc(collection(db, 'products')).id

/** All of the seller's products (single-field filter, sorted client-side: no composite index needed). */
export async function listProducts(uid) {
  const snap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', uid), limit(300)))
  return snap.docs.map(withId).sort(byUpdatedDesc)
}

export async function getProduct(productId) {
  const snap = await getDoc(doc(db, 'products', productId))
  return snap.exists() ? withId(snap) : null
}

/** Best-effort uniqueness inside the seller's catalog. The server re-checks when a PO is published. */
export async function isProductSlugTaken(uid, slug, excludeId) {
  const snap = await getDocs(
    query(collection(db, 'products'), where('sellerId', '==', uid), where('slug', '==', slug), limit(2)),
  )
  return snap.docs.some((d) => d.id !== excludeId)
}

const randomSuffix = () => Math.random().toString(36).slice(2, 8)

/**
 * Create or update a product. `images` is the final ordered list: `{ path }` (already stored) or `{ file }` (new).
 * New files are uploaded first; if the write fails they are removed, and after success removed images are deleted.
 */
export async function saveProduct({ uid, productId, isNew, values, images, previousPaths = [] }) {
  const uploaded = []
  try {
    const imagePaths = []
    for (const image of images) {
      if (image.path) {
        imagePaths.push(image.path)
        continue
      }
      const file = await optimizeImage(image.file, 'product')
      const path = `sellers/${uid}/products/${productId}/${Date.now()}-${randomSuffix()}.${imageExtension(file)}`
      await uploadImage(path, file)
      uploaded.push(path)
      imagePaths.push(path)
    }

    const data = {
      name: values.name,
      slug: values.slug,
      description: values.description,
      sellingPrice: values.sellingPrice,
      purchaseCost: values.purchaseCost,
      trackStock: values.trackStock,
      stock: values.trackStock ? values.stock : 0,
      hasVariants: values.hasVariants,
      imagePaths,
    }

    if (isNew) {
      await setDoc(doc(db, 'products', productId), {
        sellerId: uid,
        storeId: uid,
        status: CATALOG_STATUS.ACTIVE,
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    } else {
      await updateDoc(doc(db, 'products', productId), { ...data, updatedAt: serverTimestamp() })
    }

    await Promise.all(previousPaths.filter((p) => !imagePaths.includes(p)).map(deleteImage))
    return imagePaths
  } catch (error) {
    await Promise.all(uploaded.map(deleteImage))
    throw error
  }
}

export function setProductStatus(productId, status) {
  return updateDoc(doc(db, 'products', productId), { status, updatedAt: serverTimestamp() })
}

// ---------- variants ----------

export async function listVariants(uid, productId) {
  const snap = await getDocs(
    query(collection(db, 'product_variants'), where('sellerId', '==', uid), where('productId', '==', productId), limit(100)),
  )
  return snap.docs.map(withId).sort((a, b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
}

export function createVariant(uid, productId, { name, sellingPrice, purchaseCost, stock }) {
  return addDoc(collection(db, 'product_variants'), {
    sellerId: uid,
    productId,
    name,
    sellingPrice,
    purchaseCost,
    stock,
    status: CATALOG_STATUS.ACTIVE,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export function updateVariant(variantId, { name, sellingPrice, purchaseCost, stock }) {
  return updateDoc(doc(db, 'product_variants', variantId), { name, sellingPrice, purchaseCost, stock, updatedAt: serverTimestamp() })
}

export function setVariantStatus(variantId, status) {
  return updateDoc(doc(db, 'product_variants', variantId), { status, updatedAt: serverTimestamp() })
}
