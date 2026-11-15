import { Loader2 } from 'lucide-react'

export function FullPageLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-dvh items-center justify-center bg-slate-50">
      <Loader2 className="size-8 animate-spin text-brand-600" aria-hidden="true" />
      <span className="sr-only">Memuat…</span>
    </div>
  )
}
