import { useAuth } from './useAuth'
import { useAsyncData } from './useAsyncData'
import { getProduct, listProducts, listVariants } from '../services/productService'

export function useProducts() {
  const { user } = useAuth()
  return useAsyncData(() => listProducts(user.uid), user?.uid, 'Gagal memuat produk.')
}

export function useProduct(productId) {
  return useAsyncData(() => getProduct(productId), productId, 'Gagal memuat produk.')
}

export function useVariants(productId) {
  const { user } = useAuth()
  return useAsyncData(() => listVariants(user.uid, productId), user?.uid && productId, 'Gagal memuat varian.')
}
