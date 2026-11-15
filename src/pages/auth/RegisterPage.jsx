import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Checkbox, Input } from '../../components/ui'
import { registerSchema } from '../../schemas/auth'
import { registerWithEmail } from '../../services/authService'

export default function RegisterPage() {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '', acceptTerms: false },
  })

  const onSubmit = async ({ displayName, email, password }) => {
    setFormError('')
    try {
      await registerWithEmail({ displayName, email, password })
    } catch (error) {
      setFormError(error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Buat akun</h1>
        <p className="mt-1 text-sm text-slate-500">Mulai terima pre-order dalam hitungan menit.</p>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Input label="Nama" autoComplete="name" error={errors.displayName?.message} {...register('displayName')} />
      <Input label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />
      <Input
        label="Kata sandi"
        type="password"
        autoComplete="new-password"
        hint="Minimal 8 karakter."
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Ulangi kata sandi"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />

      <div>
        <Checkbox
          label={
            <>
              Saya setuju dengan{' '}
              <Link to="/syarat-ketentuan" target="_blank" className="font-semibold text-brand-700 underline">
                Syarat &amp; Ketentuan
              </Link>{' '}
              dan{' '}
              <Link to="/kebijakan-privasi" target="_blank" className="font-semibold text-brand-700 underline">
                Kebijakan Privasi
              </Link>
            </>
          }
          {...register('acceptTerms')}
        />
        {errors.acceptTerms && <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>}
      </div>

      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
        Daftar
      </Button>

      <p className="text-center text-sm text-slate-600">
        Sudah punya akun?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  )
}
