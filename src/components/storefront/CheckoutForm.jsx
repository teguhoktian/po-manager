import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Textarea } from '../ui'
import { checkoutFormSchema } from '../../schemas/order'

/** Buyer details. `onSubmit` must throw an Error with a user-facing message on failure. */
export function CheckoutForm({ onSubmit, onBack }) {
  const [serverError, setServerError] = useState(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(checkoutFormSchema), defaultValues: { name: '', whatsapp: '', address: '' } })

  const submit = handleSubmit(async (customer, event) => {
    setServerError(null)
    const honeypot = new FormData(event.target).get('website') ?? ''
    try {
      await onSubmit(customer, honeypot)
    } catch (error) {
      for (const [path, message] of Object.entries(error.fields ?? {})) {
        const field = path.replace(/^customer\./, '')
        if (['name', 'whatsapp', 'address'].includes(field)) setError(field, { message })
      }
      setServerError(error.message)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <Input label="Nama penerima" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Nomor WhatsApp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08123456789"
          hint="Penjual menghubungi Anda lewat nomor ini."
          error={errors.whatsapp?.message}
          {...register('whatsapp')}
        />
        <Textarea label="Alamat lengkap" autoComplete="street-address" rows={3} error={errors.address?.message} {...register('address')} />
        {/* Honeypot: invisible to people, tempting to bots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          Dengan membuat pesanan, kamu menyetujui{' '}
          <a href="/syarat-ketentuan" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
            Syarat &amp; Ketentuan
          </a>{' '}
          dan{' '}
          <a href="/kebijakan-privasi" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">
            Kebijakan Privasi
          </a>
          . Data pesananmu dikirim ke penjual untuk diproses.
        </p>
        {serverError && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        )}
      </div>
      <div className="flex gap-2 border-t border-slate-100 px-5 pt-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]">
        <Button variant="secondary" size="lg" onClick={onBack} disabled={isSubmitting}>
          Kembali
        </Button>
        <Button type="submit" size="lg" className="flex-1" loading={isSubmitting}>
          Buat pesanan
        </Button>
      </div>
    </form>
  )
}
