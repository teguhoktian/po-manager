import { cn } from '../../lib/cn'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-card border border-green-900/10 bg-white shadow-card', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 p-4 pb-0 sm:p-5 sm:pb-0', className)}>
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>
}
