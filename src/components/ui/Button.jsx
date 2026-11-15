import { forwardRef } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/cn'

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-[0_8px_16px_-8px_rgb(22_163_74/0.8)] hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-white text-slate-800 border border-slate-200 shadow-sm hover:border-brand-300 hover:bg-brand-50 active:bg-brand-100',
  ghost: 'text-slate-700 hover:bg-brand-50 active:bg-brand-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
}

const SIZES = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

/** Touch-friendly button. `to` renders a router link, `href` a plain anchor (e.g. in-page #hash). */
export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, fullWidth = false, to, href, className, children, disabled, type = 'button', ...props },
  ref,
) {
  const classes = cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap transition-[color,background-color,border-color,transform] active:scale-[0.98]',
    'disabled:pointer-events-none disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  )

  if (href) {
    return (
      <a ref={ref} href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  if (to) {
    return (
      <Link ref={ref} to={to} className={classes} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})
