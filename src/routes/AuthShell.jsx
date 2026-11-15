import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../context/AuthProvider'

/**
 * Route-level auth boundary. Only login/register/dashboard routes render inside it, and it is lazy-loaded,
 * so public pages (landing, storefront) never download the Firebase SDK.
 */
export default function AuthShell() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
