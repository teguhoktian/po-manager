import { FieldValue } from 'firebase-admin/firestore'
import { writeAudit } from './audit.js'
import { HttpError } from './http.js'

/**
 * Create the seller's store and claim its slug atomically.
 * `db` is injected so the logic can be tested without a live Firebase project.
 */
export async function createStore(db, uid, input) {
  const storeRef = db.collection('stores').doc(uid)
  const slugRef = db.collection('store_slugs').doc(input.slug)

  await db.runTransaction(async (tx) => {
    const [storeSnap, slugSnap] = await Promise.all([tx.get(storeRef), tx.get(slugRef)])
    if (storeSnap.exists) throw new HttpError(409, 'Kamu sudah memiliki toko')
    if (slugSnap.exists) throw new HttpError(409, 'Alamat toko sudah dipakai')

    const now = FieldValue.serverTimestamp()
    tx.set(slugRef, { sellerId: uid, createdAt: now })
    tx.set(storeRef, {
      sellerId: uid,
      name: input.name,
      slug: input.slug,
      description: input.description,
      whatsappNumber: input.whatsappNumber,
      paymentInfo: '',
      logoPath: null,
      createdAt: now,
      updatedAt: now,
    })
    writeAudit(tx, db, { sellerId: uid, actorUid: uid, action: 'STORE_CREATED', entityType: 'store', entityId: uid, meta: { slug: input.slug } })
  })
}

/** Move the store to a new slug: claim the new one, release the old one, all in one transaction. */
export async function changeStoreSlug(db, uid, newSlug) {
  const storeRef = db.collection('stores').doc(uid)
  const newRef = db.collection('store_slugs').doc(newSlug)

  await db.runTransaction(async (tx) => {
    const storeSnap = await tx.get(storeRef)
    if (!storeSnap.exists) throw new HttpError(404, 'Toko belum dibuat')

    const oldSlug = storeSnap.data().slug
    if (oldSlug === newSlug) return

    const oldRef = db.collection('store_slugs').doc(oldSlug)
    const [newSnap, oldSnap] = await Promise.all([tx.get(newRef), tx.get(oldRef)])
    if (newSnap.exists) throw new HttpError(409, 'Alamat toko sudah dipakai')

    const now = FieldValue.serverTimestamp()
    tx.set(newRef, { sellerId: uid, createdAt: now })
    // Only release the old claim if it really belongs to this seller.
    if (oldSnap.exists && oldSnap.data().sellerId === uid) tx.delete(oldRef)
    tx.update(storeRef, { slug: newSlug, updatedAt: now })
    writeAudit(tx, db, {
      sellerId: uid, actorUid: uid, action: 'STORE_SLUG_CHANGED', entityType: 'store', entityId: uid, meta: { from: oldSlug, to: newSlug },
    })
  })
}
