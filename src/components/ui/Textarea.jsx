import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

export const Textarea = forwardRef(function Textarea({ label, hint, error, className, id, rows = 3, ...props }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined

  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-xl border bg-white px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400',
          'transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
          error ? 'border-red-400' : 'border-slate-300',
        )}
        {...props}
      />
      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
