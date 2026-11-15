import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { SITE } from '../../config/site'
import { cn } from '../../lib/cn'

export function Logo({ to = '/', className }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-2.5 font-bold text-slate-900', className)}>
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_6px_12px_-6px_rgb(22_163_74/0.9)]">
        <ShoppingBag className="size-5" aria-hidden="true" />
        <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-amber-400" aria-hidden="true" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">{SITE.name}</span>
    </Link>
  )
}
