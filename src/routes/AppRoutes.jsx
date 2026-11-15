import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { StorefrontLayout } from '../layouts/StorefrontLayout'
import { AuthLayout } from '../layouts/AuthLayout'
import { FullPageLoader } from '../components/layout/FullPageLoader'
import { ProtectedRoute } from './ProtectedRoute'
import { GuestRoute } from './GuestRoute'
import LandingPage from '../pages/public/LandingPage'
import NotFoundPage from '../pages/public/NotFoundPage'

// Route-level code splitting keeps the public bundle small (Firestore/Storage only load in the dashboard).
const StorefrontPage = lazy(() => import('../pages/public/StorefrontPage'))
const PoOrderPage = lazy(() => import('../pages/public/PoOrderPage'))
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout').then((m) => ({ default: m.DashboardLayout })))
const OrderConfirmationPage = lazy(() => import('../pages/public/OrderConfirmationPage'))
const OrdersPage = lazy(() => import('../pages/dashboard/OrdersPage'))
const OrderDetailPage = lazy(() => import('../pages/dashboard/OrderDetailPage'))
const AuthShell = lazy(() => import('./AuthShell'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const PaymentsPage = lazy(() => import('../pages/dashboard/PaymentsPage'))
const ReportsPage = lazy(() => import('../pages/dashboard/ReportsPage'))
const OverviewPage = lazy(() => import('../pages/dashboard/OverviewPage'))
const StorePage = lazy(() => import('../pages/dashboard/StorePage'))
const ProductsPage = lazy(() => import('../pages/dashboard/ProductsPage'))
const ProductEditPage = lazy(() => import('../pages/dashboard/ProductEditPage'))
const PurchaseOrdersPage = lazy(() => import('../pages/dashboard/PurchaseOrdersPage'))
const PurchaseOrderEditPage = lazy(() => import('../pages/dashboard/PurchaseOrderEditPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="/po/:storeSlug" element={<StorefrontLayout />}>
          <Route index element={<StorefrontPage />} />
          <Route path=":poSlug" element={<PoOrderPage />} />
          <Route path=":poSlug/pesanan" element={<OrderConfirmationPage />} />
        </Route>

        <Route element={<AuthShell />}>
          <Route element={<GuestRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="store" element={<StorePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/new" element={<ProductEditPage />} />
              <Route path="products/:productId" element={<ProductEditPage />} />
              <Route path="po" element={<PurchaseOrdersPage />} />
              <Route path="po/new" element={<PurchaseOrderEditPage />} />
              <Route path="po/:poId" element={<PurchaseOrderEditPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="payments" element={<PaymentsPage />} />
              <Route path="fulfillment" element={<OrdersPage mode="shipping" />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
