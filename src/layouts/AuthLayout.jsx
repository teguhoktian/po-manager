import { Outlet } from 'react-router-dom'
import { PageTransition } from '../components/layout/PageTransition'
import { Logo } from '../components/layout/Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-dots bg-canvas px-4 pt-[calc(env(safe-area-inset-top)+2rem)] pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:justify-center">
      <Logo className="mb-6" />
      <div className="w-full max-w-md rounded-3xl border border-green-900/10 bg-white p-5 shadow-lift sm:p-7">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </div>
  )
}
