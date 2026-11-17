import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { loginWithGoogle } from '../../services/authService'

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

/**
 * "atau" divider, Google button, and the consent line. Google sign-in also creates accounts,
 * so the terms are stated here for people who never see the sign-up checkbox.
 * Redirect after success is handled by GuestRoute once auth state updates.
 */
export function GoogleSignIn({ label = 'Lanjutkan dengan Google' }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onClick = async () => {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-xs text-slate-400" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        atau
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="button" variant="secondary" size="lg" fullWidth loading={busy} onClick={onClick}>
        {!busy && <GoogleLogo />}
        {label}
      </Button>

      <p className="text-center text-xs text-slate-500">
        Dengan melanjutkan, kamu setuju dengan{' '}
        <Link to="/syarat-ketentuan" target="_blank" className="font-semibold text-brand-700 underline">
          Syarat &amp; Ketentuan
        </Link>{' '}
        dan{' '}
        <Link to="/kebijakan-privasi" target="_blank" className="font-semibold text-brand-700 underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </div>
  )
}
