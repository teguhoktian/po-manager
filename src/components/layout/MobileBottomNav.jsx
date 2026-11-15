import { NavLink } from 'react-router-dom'
import { DASHBOARD_NAV } from '../../config/navigation'
import { cn } from '../../lib/cn'

const ITEM = 'flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors'

/** Mobile-only bottom navigation (hidden from lg up). */
export function MobileBottomNav() {
  const items = DASHBOARD_NAV.filter((item) => item.primary)

  return (
    <nav
      aria-label="Menu utama"
      className="pb-safe fixed inset-x-0 bottom-0 z-30 flex border-t border-green-900/10 bg-white/95 shadow-[0_-8px_24px_-12px_rgb(20_83_45/0.18)] backdrop-blur lg:hidden"
    >
      {items.map(({ key, label, to, icon: Icon, enabled, end }) =>
        enabled ? (
          <NavLink
            key={key}
            to={to}
            end={end}
            className={({ isActive }) => cn(ITEM, isActive ? 'font-bold text-brand-800' : 'text-slate-500')}
          >
            {({ isActive }) => (
              <>
                <span className={cn('flex h-7 w-14 items-center justify-center rounded-full transition-colors', isActive && 'bg-brand-100')}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ) : (
          <div key={key} aria-disabled="true" className={cn(ITEM, 'cursor-not-allowed text-slate-300')}>
            <Icon className="size-6" aria-hidden="true" />
            {label}
          </div>
        ),
      )}
    </nav>
  )
}
