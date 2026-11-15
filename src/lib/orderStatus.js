export const ORDER_STATUS_META = {
  ACTIVE: { label: 'Aktif', tone: 'brand' },
  CANCELLED: { label: 'Dibatalkan', tone: 'danger' },
}

export const PAYMENT_STATUS_META = {
  PENDING_PAYMENT: { label: 'Belum bayar', tone: 'warning' },
  PARTIALLY_PAID: { label: 'DP dibayar', tone: 'info' },
  PAID: { label: 'Lunas', tone: 'success' },
  REFUNDED: { label: 'Dikembalikan', tone: 'neutral' },
}

export const FULFILLMENT_STATUS_META = {
  PENDING: { label: 'Menunggu', tone: 'neutral' },
  PROCESSING: { label: 'Diproses', tone: 'brand' },
  PACKED: { label: 'Dikemas', tone: 'brand' },
  SHIPPED: { label: 'Dikirim', tone: 'info' },
  COMPLETED: { label: 'Selesai', tone: 'success' },
}

export const COURIERS = ['JNE', 'J&T', 'SiCepat', 'AnterAja', 'Pos Indonesia', 'GoSend', 'Grab', 'Ambil di tempat']

/** Work-queue stages for ACTIVE orders (what the seller still has to do). */
export const ORDER_STAGES = [
  { key: '', label: 'Semua tahap' },
  { key: 'unpaid', label: 'Belum bayar' },
  { key: 'toprocess', label: 'Perlu diproses' },
  { key: 'processing', label: 'Diproses / dikemas' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
]

export function orderStage(o) {
  if (o.status !== 'ACTIVE') return null
  if (o.fulfillmentStatus === 'COMPLETED') return 'done'
  if (o.fulfillmentStatus === 'SHIPPED') return 'shipped'
  if (o.fulfillmentStatus === 'PROCESSING' || o.fulfillmentStatus === 'PACKED') return 'processing'
  return o.paymentStatus === 'PENDING_PAYMENT' ? 'unpaid' : 'toprocess'
}

export const ORDER_TABS = [
  { key: 'active', label: 'Aktif' },
  { key: 'cancelled', label: 'Dibatalkan' },
  { key: 'all', label: 'Semua' },
]

/** Mirrors the server: an ACTIVE order can be cancelled until fulfilment starts (paid orders need a refund). */
export const canCancelOrder = (o) => o.status === 'ACTIVE' && o.fulfillmentStatus === 'PENDING'

/** Why cancelling is not offered (null when it is). */
export const cancelBlockedReason = (o) => (o.status === 'ACTIVE' && !canCancelOrder(o) ? 'Pesanan sudah diproses atau dikirim.' : null)

export const PAYMENT_RECORD_META = {
  SUBMITTED: { label: 'Menunggu verifikasi', tone: 'warning' },
  VERIFIED: { label: 'Terverifikasi', tone: 'success' },
  REJECTED: { label: 'Ditolak', tone: 'danger' },
}
export const PAYMENT_TYPE_LABEL = { DP: 'DP', FULL: 'Pembayaran penuh', BALANCE: 'Pelunasan', REFUND: 'Pengembalian dana' }

export function filterOrders(orders, { tab, poId, query, stage = '' }) {
  const q = query.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  return orders.filter((o) => {
    if (tab === 'active' && o.status !== 'ACTIVE') return false
    if (tab === 'cancelled' && o.status !== 'CANCELLED') return false
    if (poId && o.poId !== poId) return false
    if (stage && orderStage(o) !== stage) return false
    if (!q) return true
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.customer?.name?.toLowerCase().includes(q) ||
      (digits.length >= 3 && o.customer?.whatsapp?.includes(digits.replace(/^0/, '62')))
    )
  })
}
