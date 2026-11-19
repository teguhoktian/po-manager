import { Link, Outlet } from 'react-router-dom'
import { PageTransition } from '../components/layout/PageTransition'
import { Logo } from '../components/layout/Logo'
import { Button } from '../components/ui'
import { COMPANY, SITE } from '../config/site'

const YEAR = new Date().getFullYear()

export function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="pt-safe sticky top-0 z-20 border-b border-green-900/10 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo tiny />
          <div className="flex items-center gap-2">
            <Button to="/cara-pakai" size="sm" variant="ghost" className="max-sm:hidden">
              Cara pakai
            </Button>
            <Button to="/artikel" size="sm" variant="ghost" className="max-sm:hidden">
              Artikel
            </Button>
            <Button to="/cek" size="sm" variant="ghost" className="max-sm:hidden">
              Cek pesanan
            </Button>
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
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="pb-safe border-t border-green-900/10 bg-white">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-slate-600 sm:grid-cols-[1.4fr_1fr] sm:px-6">
          <div>
            <Logo />
            <p className="mt-3 max-w-xs">{SITE.tagline}</p>
            <p className="mt-4 font-semibold text-slate-800">{COMPANY.name}</p>
            <p>{COMPANY.address}</p>
            <p>
              WhatsApp {COMPANY.whatsappDisplay} · {COMPANY.email}
            </p>
          </div>
          <nav aria-label="Tautan" className="flex flex-col gap-2 sm:items-end">
            <Link to="/cara-pakai" className="font-medium hover:text-brand-700">
              Cara pakai
            </Link>
            <Link to="/artikel" className="font-medium hover:text-brand-700">
              Artikel
            </Link>
            <Link to="/cek" className="font-medium hover:text-brand-700">
              Cek pesanan
            </Link>
            <Link to="/syarat-ketentuan" className="font-medium hover:text-brand-700">
              Syarat &amp; Ketentuan
            </Link>
            <Link to="/kebijakan-privasi" className="font-medium hover:text-brand-700">
              Kebijakan Privasi
            </Link>
            <Link to="/kontak" className="font-medium hover:text-brand-700">
              Kontak
            </Link>
          </nav>
        </div>
        <p className="border-t border-slate-100 px-4 py-4 text-center text-xs text-slate-500">
          © {YEAR} {COMPANY.name}. Seluruh hak dilindungi.
        </p>
      </footer>
    </div>
  )
}
