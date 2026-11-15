import { useEffect, useId, useRef } from 'react'
import { Button } from './Button'

/**
 * Accessible confirmation dialog built on the native <dialog> element.
 * Renders as a bottom sheet on mobile and a centered modal on larger screens.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  destructive = false,
  children,
  confirmDisabled = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault()
        if (!loading) onCancel?.()
      }}
      onClick={(e) => {
        if (e.target === ref.current && !loading) onCancel?.()
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-3xl bg-white p-0 backdrop:bg-slate-900/50 sm:m-auto sm:max-w-md sm:rounded-3xl"
    >
      <div className="p-5 pb-safe sm:p-6">
        <h2 id={titleId} className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {description && <p className="mt-2 text-sm text-slate-600">{description}</p>}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
