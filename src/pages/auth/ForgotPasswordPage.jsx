import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { Button, Input } from '../../components/ui'
import { forgotPasswordSchema } from '../../schemas/auth'
import { requestPasswordReset } from '../../services/authService'

export default function ForgotPasswordPage() {
  const [formError, setFormError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: '' } })

  const onSubmit = async ({ email }) => {
    setFormError('')
    try {
      await requestPasswordReset(email)
      setSentTo(email)
    } catch (error) {
      setFormError(error.message)
    }
  }

  if (sentTo) {
    return (
      <div className="space-y-4">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cek email kamu</h1>
          <p className="mt-1 text-sm text-slate-600">
            Jika <span className="font-semibold break-all text-slate-900">{sentTo}</span> terdaftar, kami sudah mengirim tautan untuk membuat kata sandi baru.
          </p>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Email bisa butuh beberapa menit. Periksa juga folder spam.</li>
          <li>Kalau kamu mendaftar dengan Google, masuk saja dengan tombol Google.</li>
        </ul>
        <Button to="/login" fullWidth size="lg">
          Kembali ke halaman masuk
        </Button>
        <button type="button" onClick={() => setSentTo('')} className="block w-full text-center text-sm font-semibold text-brand-700 hover:underline">
          Salah alamat email? Ubah
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Lupa kata sandi</h1>
        <p className="mt-1 text-sm text-slate-500">Masukkan email akunmu. Kami kirim tautan untuk membuat kata sandi baru.</p>
      </div>

      {formError && (
        <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {formError}
        </p>
      )}

      <Input label="Email" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} {...register('email')} />

      <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
        Kirim tautan
      </Button>

      <p className="text-center text-sm text-slate-600">
        Ingat kata sandimu?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:underline">
          Masuk
        </Link>
      </p>
    </form>
  )
}
