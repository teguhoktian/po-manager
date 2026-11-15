import {
  LayoutDashboard,
  CalendarClock,
  ShoppingBag,
  Package,
  Wallet,
  Truck,
  BarChart3,
  Store,
} from 'lucide-react'

/**
 * Dashboard navigation.
 * `enabled: false` items are rendered as disabled until their phase ships,
 * so no routes exist for modules that are not implemented yet.
 * `primary` items appear in the mobile bottom bar.
 */
export const DASHBOARD_NAV = [
  { key: 'overview', label: 'Ringkasan', to: '/dashboard', icon: LayoutDashboard, enabled: true, primary: true, end: true },
  { key: 'po', label: 'PO', to: '/dashboard/po', icon: CalendarClock, enabled: true, primary: true },
  { key: 'orders', label: 'Pesanan', to: '/dashboard/orders', icon: ShoppingBag, enabled: true, primary: true },
  { key: 'products', label: 'Produk', to: '/dashboard/products', icon: Package, enabled: true, primary: true },
  { key: 'payments', label: 'Pembayaran', to: '/dashboard/payments', icon: Wallet, enabled: true },
  { key: 'fulfillment', label: 'Pengiriman', to: '/dashboard/fulfillment', icon: Truck, enabled: true },
  { key: 'reports', label: 'Laporan', to: '/dashboard/reports', icon: BarChart3, enabled: true },
  { key: 'store', label: 'Toko', to: '/dashboard/store', icon: Store, enabled: true, primary: true },
]
