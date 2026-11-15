import { after, before, beforeEach, describe, it } from 'node:test'
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { ALICE, BOB, createEnv, seed, validItem, validPO, validProduct } from './helpers.js'

let env
const as = (uid) => env.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()
const anon = () => env.unauthenticatedContext().firestore()
const touch = (extra) => ({ ...extra, updatedAt: serverTimestamp() })

before(async () => { env = await createEnv() })
after(async () => { await env.cleanup() })
beforeEach(async () => { await env.clearFirestore(); await seed(env) })

describe('isolation', () => {
  it('denies unauthenticated reads', async () => {
    await assertFails(getDoc(doc(anon(), 'products/prod-alice')))
    await assertFails(getDoc(doc(anon(), 'orders/order-1')))
  })
  it("denies reading another seller's data", async () => {
    await assertFails(getDoc(doc(as(BOB), 'products/prod-alice')))
    await assertFails(getDoc(doc(as(BOB), 'orders/order-1')))
  })
  it('allows owner reads and filtered queries; denies unfiltered list', async () => {
    await assertSucceeds(getDoc(doc(as(ALICE), 'orders/order-1')))
    await assertSucceeds(getDocs(query(collection(as(ALICE), 'orders'), where('sellerId', '==', ALICE))))
    await assertFails(getDocs(collection(as(ALICE), 'orders')))
  })
  it('denies every client write to server-only collections', async () => {
    for (const c of ['orders', 'order_items', 'payments', 'shipments', 'audit_logs']) {
      await assertFails(setDoc(doc(as(ALICE), `${c}/x1`), { sellerId: ALICE }))
    }
    await assertFails(updateDoc(doc(as(ALICE), 'orders/order-1'), { paymentStatus: 'PAID' }))
    await assertFails(updateDoc(doc(as(ALICE), 'orders/order-1'), { total: 1 }))
    await assertFails(deleteDoc(doc(as(ALICE), 'orders/order-1')))
  })
  it('denies server-only helper collections', async () => {
    await assertFails(setDoc(doc(as(ALICE), 'store_slugs/toko'), { sellerId: ALICE }))
    await assertFails(getDoc(doc(as(ALICE), 'idempotency_keys/k')))
  })
})

describe('users and stores', () => {
  it('lets a user create only their own profile with strict fields', async () => {
    const db = as(BOB)
    const ok = { displayName: 'Bob', email: 'bob@example.com', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
    await assertFails(setDoc(doc(db, 'users/bob'), { ...ok, role: 'admin' }))
    await assertFails(setDoc(doc(db, 'users/alice'), ok))
    await assertSucceeds(setDoc(doc(db, 'users/bob'), ok))
  })
  it('allows store profile edits but not slug/sellerId or creation', async () => {
    const db = as(ALICE)
    await assertSucceeds(updateDoc(doc(db, 'stores/alice'), touch({ name: 'Toko Baru' })))
    await assertSucceeds(updateDoc(doc(db, 'stores/alice'), touch({ paymentInfo: 'BCA 123 a.n. Alice' })))
    await assertFails(updateDoc(doc(db, 'stores/alice'), touch({ paymentInfo: 'x'.repeat(501) })))
    await assertFails(updateDoc(doc(db, 'stores/alice'), touch({ paymentInfo: 42 })))
    await assertFails(updateDoc(doc(db, 'stores/alice'), touch({ slug: 'hijack' })))
    await assertFails(updateDoc(doc(db, 'stores/alice'), touch({ sellerId: BOB })))
    await assertFails(updateDoc(doc(db, 'stores/alice'), touch({ whatsappNumber: '0812' })))
    await assertFails(setDoc(doc(as(BOB), 'stores/bob'), { sellerId: BOB }))
  })
})

describe('products', () => {
  it('creates valid products only for self', async () => {
    await assertSucceeds(setDoc(doc(as(ALICE), 'products/p1'), validProduct(ALICE)))
    await assertFails(setDoc(doc(as(ALICE), 'products/p2'), validProduct(BOB)))
  })
  it('rejects extra fields, negative and fractional prices', async () => {
    const db = as(ALICE)
    await assertFails(setDoc(doc(db, 'products/p3'), validProduct(ALICE, { isAdmin: true })))
    await assertFails(setDoc(doc(db, 'products/p4'), validProduct(ALICE, { sellingPrice: -1 })))
    await assertFails(setDoc(doc(db, 'products/p5'), validProduct(ALICE, { sellingPrice: 10.5 })))
  })
  it('blocks editing others, changing sellerId, and hard delete', async () => {
    await assertFails(updateDoc(doc(as(BOB), 'products/prod-alice'), touch({ name: 'x' })))
    await assertFails(updateDoc(doc(as(ALICE), 'products/prod-alice'), touch({ sellerId: BOB })))
    await assertSucceeds(updateDoc(doc(as(ALICE), 'products/prod-alice'), touch({ status: 'ARCHIVED' })))
    await assertFails(deleteDoc(doc(as(ALICE), 'products/prod-alice')))
  })
})

describe('purchase orders', () => {
  it('only creates DRAFT with zeroed counters', async () => {
    const db = as(ALICE)
    await assertSucceeds(setDoc(doc(db, 'purchase_orders/n1'), validPO(ALICE, { slug: 'n1-po' })))
    await assertFails(setDoc(doc(db, 'purchase_orders/n2'), validPO(ALICE, { status: 'OPEN' })))
    await assertFails(setDoc(doc(db, 'purchase_orders/n3'), validPO(ALICE, { orderedQty: 5 })))
  })
  it('rejects bad dates and inconsistent DP', async () => {
    const db = as(ALICE)
    const { Timestamp } = await import('firebase/firestore')
    await assertFails(setDoc(doc(db, 'purchase_orders/n4'), validPO(ALICE, { closeAt: Timestamp.fromMillis(Date.now() - 1000), openAt: Timestamp.now() })))
    await assertFails(setDoc(doc(db, 'purchase_orders/n5'), validPO(ALICE, { paymentMode: 'DP', dpPercent: null })))
    await assertFails(setDoc(doc(db, 'purchase_orders/n6'), validPO(ALICE, { paymentMode: 'FULL', dpPercent: 30 })))
    await assertSucceeds(setDoc(doc(db, 'purchase_orders/n7'), validPO(ALICE, { paymentMode: 'DP', dpPercent: 30, slug: 'n7-po' })))
  })
  it('edits content of a draft but never status or counters', async () => {
    const db = as(ALICE)
    await assertSucceeds(updateDoc(doc(db, 'purchase_orders/po-draft'), touch({ title: 'Judul Baru' })))
    await assertFails(updateDoc(doc(db, 'purchase_orders/po-draft'), touch({ status: 'OPEN' })))
    await assertFails(updateDoc(doc(db, 'purchase_orders/po-draft'), touch({ orderedQty: 1 })))
    await assertFails(updateDoc(doc(db, 'purchase_orders/po-draft'), touch({ closeReason: 'MANUAL' })))
  })
  it('locks OPEN POs and only deletes drafts', async () => {
    const db = as(ALICE)
    await assertFails(updateDoc(doc(db, 'purchase_orders/po-open'), touch({ title: 'Ubah' })))
    await assertFails(deleteDoc(doc(db, 'purchase_orders/po-open')))
    await assertSucceeds(deleteDoc(doc(db, 'purchase_orders/po-draft')))
  })
})

describe('purchase order items', () => {
  it('adds items to a draft PO with own products only', async () => {
    const db = as(ALICE)
    await assertSucceeds(setDoc(doc(db, 'purchase_order_items/i1'), validItem()))
    await assertFails(setDoc(doc(db, 'purchase_order_items/i2'), validItem({ productId: 'prod-bob' })))
    await assertFails(setDoc(doc(db, 'purchase_order_items/i3'), validItem({ poId: 'po-open' })))
  })
})
