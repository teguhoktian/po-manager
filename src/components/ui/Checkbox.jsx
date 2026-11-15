import { forwardRef, useId } from 'react'

export const Checkbox = forwardRef(function Checkbox({ label, hint, id, ...props }, ref) {
  const autoId = useId()
  const fieldId = id ?? autoId
  return (
    <label htmlFor={fieldId} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
      <input
        ref={ref}
        id={fieldId}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 rounded border-slate-300 accent-brand-600"
        {...props}
      />
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-sm text-slate-500">{hint}</span>}
      </span>
    </label>
  )
})
