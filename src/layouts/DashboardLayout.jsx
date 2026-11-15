import { Outlet, useLocation } from 'react-router-dom'
import { PageTransition } from '../components/layout/PageTransition'
import { DashboardSidebar } from '../components/layout/DashboardSidebar'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { MobileBottomNav } from '../components/layout/MobileBottomNav'
import { DASHBOARD_NAV } from '../config/navigation'

export function DashboardLayout() {
  const { pathname } = useLocation()
  const current = DASHBOARD_NAV.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)))

  return (
    <div className="min-h-dvh bg-canvas">
      <DashboardSidebar />
      <div className="lg:pl-64">
        <DashboardHeader title={current?.label ?? 'Dashboard'} />
        <main className="mx-auto max-w-6xl px-4 pt-5 pb-24 sm:px-6 lg:pb-10">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
