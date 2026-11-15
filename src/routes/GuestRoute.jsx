import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { FullPageLoader } from '../components/layout/FullPageLoader'
import { ConfigNotice } from '../components/layout/ConfigNotice'
import { useAuth } from '../hooks/useAuth'
import { safeRedirectPath } from '../lib/safeRedirect'

/** Login/register only for signed-out visitors. */
export function GuestRoute() {
  const { user, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (!isConfigured) return <ConfigNotice />
  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={safeRedirectPath(location.state?.from)} replace />
  return <Outlet />
}
