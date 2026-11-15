import { useAuth } from './useAuth'
import { useAsyncData } from './useAsyncData'
import { getPurchaseOrder, listPurchaseOrders, loadPoItems } from '../services/purchaseOrderService'

export function usePurchaseOrders() {
  const { user } = useAuth()
  return useAsyncData(() => listPurchaseOrders(user.uid), user?.uid, 'Gagal memuat daftar PO.')
}

export function usePurchaseOrder(poId) {
  return useAsyncData(() => getPurchaseOrder(poId), poId, 'Gagal memuat PO.')
}

export function usePoItems(poId) {
  const { user } = useAuth()
  return useAsyncData(() => loadPoItems(user.uid, poId), user?.uid && poId, 'Gagal memuat produk PO.')
}
