import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, PasswordInput } from '../../components/ui'
import { GoogleSignIn } from '../../components/auth/GoogleSignIn'
import { loginSchema } from '../../schemas/auth'
import { loginWithEmail } from '../../services/authService'

export default function LoginPage() {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } })

  // Redirect after success is handled by GuestRoute once auth state updates.
  const onSubmit = async (values) => {
    setFormError('')
    try {
      await loginWithEmail(values)
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Masuk</h1>
        <p className="mt-1 text-sm text-slate-500">Kelola PO kamu dari satu tempat.</p>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Input label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
      <div>
        <PasswordInput label="Kata sandi" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <div className="mt-2 text-right">
          <Link to="/lupa-password" className="text-sm font-semibold text-brand-700 hover:underline">
            Lupa kata sandi?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
        Masuk
      </Button>

      <GoogleSignIn label="Masuk dengan Google" />

      <p className="text-center text-sm text-slate-600">
        Belum punya akun?{' '}
        <Link to="/register" className="font-semibold text-brand-700 hover:underline">
          Daftar
        </Link>
      </p>
    </form>
  )
}
