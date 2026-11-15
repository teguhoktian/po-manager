import { Link, Outlet } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui'
import { SITE } from '../config/site'

const YEAR = new Date().getFullYear()

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="pt-safe sticky top-0 z-20 border-b border-green-900/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button to="/login" size="sm" variant="ghost">
              Masuk
            </Button>
            <Button to="/register" size="sm">
              Daftar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="pb-safe border-t border-green-900/10 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {YEAR} {SITE.name}
          </p>
          <Link to="/" className="hover:text-slate-700">
            {SITE.tagline}
          </Link>
        </div>
      </footer>
    </div>
  )
}
