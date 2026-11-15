import { Outlet } from 'react-router-dom'
import { SITE } from '../config/site'

/** Buyer-facing shell: no seller navigation, no login prompt. */
export function StorefrontLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <main className="pt-safe mx-auto w-full max-w-2xl flex-1 px-4 py-5">
        <Outlet />
      </main>
      <footer className="pb-safe py-6 text-center text-xs text-slate-500">
        Dibuat dengan{' '}
        <a href="/" className="font-medium text-slate-500 hover:text-slate-700">
          {SITE.name}
        </a>
      </footer>
    </div>
  )
}
