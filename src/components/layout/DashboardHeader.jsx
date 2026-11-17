import { useState } from 'react'
import { CircleHelp, LogOut } from 'lucide-react'
import { Logo } from './Logo'
import { ConfirmDialog } from '../ui'
import { useAuth } from '../../hooks/useAuth'
import { logout } from '../../services/authService'

/** Compact top bar: logo on mobile, page title on desktop, avatar + logout. */
export function DashboardHeader({ title }) {
  const { user } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const initial = (user?.displayName || user?.email || 'P').trim().charAt(0).toUpperCase()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      // ProtectedRoute redirects to /login once auth state clears.
      await logout()
    } finally {
      setLoggingOut(false)
      setConfirming(false)
    }
  }

  return (
    <header className="pt-safe sticky top-0 z-20 border-b border-green-900/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:h-16">
        <Logo to="/dashboard" className="lg:hidden" />
        <h1 className="hidden text-lg font-extrabold text-slate-900 lg:block">{title}</h1>

        <div className="flex items-center gap-2">
          <span
            className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-bold text-white"
            title={user?.email ?? undefined}
          >
            {initial}
          </span>
          <a
            href="/cara-pakai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Cara pakai (buka di tab baru)"
          >
            <CircleHelp className="size-5" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex size-11 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Keluar"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        title="Keluar dari akun?"
        description="Kamu harus masuk lagi untuk membuka dashboard."
        confirmLabel="Keluar"
        loading={loggingOut}
        onConfirm={handleLogout}
        onCancel={() => setConfirming(false)}
      />
    </header>
  )
}
