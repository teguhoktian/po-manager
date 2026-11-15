import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '../ui'
import { storeProfileSchema } from '../../schemas/store'
import { updateStoreProfile } from '../../services/storeService'

export function StoreProfileForm({ store, onSaved }) {
  const [message, setMessage] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(storeProfileSchema),
    defaultValues: { name: store.name, description: store.description, whatsappNumber: store.whatsappNumber, paymentInfo: store.paymentInfo ?? '' },
  })

  const onSubmit = async (values) => {
    setMessage(null)
    try {
      await updateStoreProfile(store.id, values)
      await onSaved()
      setMessage({ type: 'success', text: 'Perubahan disimpan.' })
    } catch {
      setMessage({ type: 'error', text: 'Gagal menyimpan. Coba lagi.' })
    }
  }

  return (
    <Card>
      <CardHeader title="Profil toko" />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <Input label="Nama toko" error={errors.name?.message} {...register('name')} />
          <Textarea label="Deskripsi" error={errors.description?.message} {...register('description')} />
          <Input label="Nomor WhatsApp" type="tel" inputMode="tel" error={errors.whatsappNumber?.message} {...register('whatsappNumber')} />
          <Textarea
            label="Info pembayaran"
            rows={4}
            hint="Ditampilkan ke pembeli setelah checkout. Contoh: BCA 1234567890 a.n. Nama Anda; DANA 0812xxxx."
            error={errors.paymentInfo?.message}
            {...register('paymentInfo')}
          />
          {message && (
            <p role="status" className={message.type === 'success' ? 'text-sm text-emerald-700' : 'text-sm text-red-600'}>
              {message.text}
            </p>
          )}
          <Button type="submit" fullWidth loading={isSubmitting} disabled={!isDirty}>
            Simpan perubahan
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
