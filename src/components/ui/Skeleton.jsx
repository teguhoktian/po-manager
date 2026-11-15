import { cn } from '../../lib/cn'

/** Pulse placeholder. Size it with className (e.g. "h-4 w-24"). */
export function Skeleton({ className }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-slate-200/80', className)} />
}
