import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../../lib/cn'

export function ErrorState({ title = 'Terjadi kesalahan', description = 'Silakan coba lagi sebentar lagi.', onRetry, className }) {
  return (
    <div role="alert" className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}
