import { Link, Outlet } from 'react-router-dom'
import { PageTransition } from '../components/layout/PageTransition'
import { SITE } from '../config/site'

/** Buyer-facing shell: no seller navigation, no login prompt. */
export function StorefrontLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-8">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <footer className="pt-2 pb-[calc(env(safe-area-inset-bottom)+2rem)] text-center text-xs text-slate-500">
        <Link to="/cek" className="mb-2 block font-semibold text-brand-700">
          Sudah memesan? Cek status pesanan
        </Link>
        <span className="mb-2 block">
          <Link to="/syarat-ketentuan" className="hover:text-slate-700">
            Syarat &amp; Ketentuan
          </Link>
          {' · '}
          <Link to="/kebijakan-privasi" className="hover:text-slate-700">
            Kebijakan Privasi
          </Link>
        </span>
        Dibuat dengan{' '}
        <a href="/" className="font-medium text-slate-500 hover:text-slate-700">
          {SITE.name}
        </a>
      </footer>
    </div>
  )
}
