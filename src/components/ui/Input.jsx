import { forwardRef, useId } from 'react'
import { cn } from '../../lib/cn'

/** Labelled text input with hint and error support. */
export const Input = forwardRef(function Input({ label, hint, error, className, id, ...props }, ref) {
  const autoId = useId()
  const inputId = id ?? autoId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'h-12 w-full rounded-xl border bg-white px-3.5 text-slate-900 placeholder:text-slate-400',
          'transition-colors focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20',
          error ? 'border-red-400' : 'border-slate-300',
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
