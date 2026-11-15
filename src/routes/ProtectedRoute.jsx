import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '../components/layout/FullPageLoader'
import { ConfigNotice } from '../components/layout/ConfigNotice'
import { useAuth } from '../hooks/useAuth'

/** Gate for dashboard routes. Real data protection still lives in Firestore rules and server checks. */
export function ProtectedRoute() {
  const { user, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (!isConfigured) return <ConfigNotice />
  if (loading) return <FullPageLoader />
  if (!user) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  return <Outlet />
}
