import { readFileSync } from 'node:fs'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { serverTimestamp, Timestamp } from 'firebase/firestore'

export const ALICE = 'alice'
export const BOB = 'bob'

export async function createEnv() {
  return initializeTestEnvironment({
    projectId: 'demo-po',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  })
}

const ts = () => serverTimestamp()
const days = (n) => Timestamp.fromMillis(Date.now() + n * 86_400_000)

export const validProduct = (sellerId = ALICE, over = {}) => ({
  sellerId, storeId: sellerId, name: 'Nugget', slug: 'nugget', description: '', imagePaths: [],
  sellingPrice: 50000, purchaseCost: 30000, trackStock: false, stock: 0, hasVariants: false, status: 'ACTIVE',
  createdAt: ts(), updatedAt: ts(), ...over,
})

export const validPO = (sellerId = ALICE, over = {}) => ({
  sellerId, storeId: sellerId, title: 'PO Nugget', slug: 'po-nugget', description: '', paymentMode: 'FULL', dpPercent: null,
  openAt: days(1), closeAt: days(7), quota: 50, minOrderQty: 1, status: 'DRAFT', orderedQty: 0, orderCount: 0,
  closedAt: null, closeReason: null, createdAt: ts(), updatedAt: ts(), ...over,
})

export const validItem = (over = {}) => ({
  sellerId: ALICE, poId: 'po-draft', productId: 'prod-alice', variantId: null, sellingPrice: 50000, createdAt: ts(), updatedAt: ts(), ...over,
})

/** Seed documents with rules disabled. */
export async function seed(env) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const { doc, setDoc } = await import('firebase/firestore')
    const db = ctx.firestore()
    const base = { createdAt: new Date(), updatedAt: new Date() }
    await setDoc(doc(db, 'users/alice'), { displayName: 'Alice', email: 'alice@example.com', ...base })
    await setDoc(doc(db, 'stores/alice'), { sellerId: ALICE, name: 'Toko', slug: 'toko', description: '', whatsappNumber: '628123456789', logoPath: null, ...base })
    await setDoc(doc(db, 'products/prod-alice'), { ...validProduct(ALICE), ...base })
    await setDoc(doc(db, 'products/prod-bob'), { ...validProduct(BOB), ...base })
    await setDoc(doc(db, 'purchase_orders/po-draft'), { ...validPO(ALICE), ...base })
    await setDoc(doc(db, 'purchase_orders/po-open'), { ...validPO(ALICE, { status: 'OPEN', slug: 'po-open' }), ...base })
    await setDoc(doc(db, 'orders/order-1'), { sellerId: ALICE, poId: 'po-open', total: 100000, paymentStatus: 'PENDING_PAYMENT', ...base })
  })
}
