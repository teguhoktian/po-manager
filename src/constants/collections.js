/** Firestore collection names. Use these instead of string literals. */
export const COLLECTIONS = Object.freeze({
  USERS: 'users',
  STORES: 'stores',
  PRODUCTS: 'products',
  PRODUCT_VARIANTS: 'product_variants',
  PURCHASE_ORDERS: 'purchase_orders',
  PURCHASE_ORDER_ITEMS: 'purchase_order_items',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  PAYMENTS: 'payments',
  SHIPMENTS: 'shipments',
  AUDIT_LOGS: 'audit_logs',
  // Server-only (no client access at all)
  STORE_SLUGS: 'store_slugs',
  IDEMPOTENCY_KEYS: 'idempotency_keys',
  RATE_LIMITS: 'rate_limits',
})
