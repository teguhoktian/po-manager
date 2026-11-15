import { NavLink } from 'react-router-dom'
import { DASHBOARD_NAV } from '../../config/navigation'
import { Logo } from './Logo'
import { cn } from '../../lib/cn'

const ITEM = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'

/** Desktop-only sidebar (hidden below lg). */
export function DashboardSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-green-900/10 bg-white lg:flex">
      <div className="flex h-16 items-center px-5">
        <Logo to="/dashboard" />
      </div>
      <nav aria-label="Menu utama" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {DASHBOARD_NAV.map(({ key, label, to, icon: Icon, enabled, end }) =>
          enabled ? (
            <NavLink
              key={key}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(ITEM, isActive ? 'bg-brand-600 font-bold text-white shadow-[0_8px_16px_-8px_rgb(22_163_74/0.8)]' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-800')
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          ) : (
            <div key={key} aria-disabled="true" className={cn(ITEM, 'cursor-not-allowed text-slate-400')}>
              <Icon className="size-5" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Segera
              </span>
            </div>
          ),
        )}
      </nav>
    </aside>
  )
}
