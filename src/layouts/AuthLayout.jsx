import { Outlet } from 'react-router-dom'
import { Logo } from '../components/layout/Logo'

export function AuthLayout() {
  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col items-center bg-dots bg-canvas px-4 py-8 sm:justify-center">
      <Logo className="mb-6" />
      <div className="w-full max-w-md rounded-3xl border border-green-900/10 bg-white p-5 shadow-lift sm:p-7">
        <Outlet />
      </div>
    </div>
  )
}
