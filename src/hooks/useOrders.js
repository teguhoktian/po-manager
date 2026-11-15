import { useAuth } from './useAuth'
import { useAsyncData } from './useAsyncData'
import { getOrder, getShipment, listItemsByPo, listOrdersByPo, listOrderItems, listOrders, listPayments, listPendingProofOrderIds } from '../services/orderService'

export function useOrders() {
  const { user } = useAuth()
  return useAsyncData(() => listOrders(user.uid), user?.uid, 'Gagal memuat pesanan.')
}

export function useOrder(orderId) {
  return useAsyncData(() => getOrder(orderId), orderId, 'Gagal memuat pesanan.')
}

export function useOrderItems(orderId) {
  const { user } = useAuth()
  return useAsyncData(() => listOrderItems(user.uid, orderId), user?.uid && orderId, 'Gagal memuat isi pesanan.')
}

export function usePayments(orderId) {
  const { user } = useAuth()
  return useAsyncData(() => listPayments(user.uid, orderId), user?.uid && orderId, 'Gagal memuat pembayaran.')
}

export function usePendingProofOrders() {
  const { user } = useAuth()
  return useAsyncData(() => listPendingProofOrderIds(user.uid), user?.uid, 'Gagal memuat bukti pembayaran.')
}

export function useShipment(orderId, enabled) {
  return useAsyncData(() => getShipment(orderId), enabled ? orderId : null, 'Gagal memuat data pengiriman.')
}

export function usePoReport(poId) {
  const { user } = useAuth()
  return useAsyncData(
    async () => {
      const [orders, items] = await Promise.all([listOrdersByPo(user.uid, poId), listItemsByPo(user.uid, poId)])
      return { orders, items }
    },
    user?.uid && poId,
    'Gagal memuat laporan.',
  )
}
