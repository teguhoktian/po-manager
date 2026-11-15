import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '../ui'
import { storeCreateSchema } from '../../schemas/store'
import { createStore } from '../../services/storeService'

export function StoreCreateForm({ onCreated }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(storeCreateSchema),
    defaultValues: { name: '', slug: '', description: '', whatsappNumber: '' },
  })

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await createStore(values)
      await onCreated()
    } catch (error) {
      if (/alamat/i.test(error.message)) setError('slug', { message: error.message })
      else setFormError(error.message)
    }
  }

  return (
    <Card>
      <CardHeader title="Buat toko kamu" description="Isi data dasar. Kamu bisa mengubahnya nanti." />
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              {formError}
            </p>
          )}
          <Input label="Nama toko" error={errors.name?.message} {...register('name')} />
          <Input
            label="Alamat toko"
            hint="Huruf kecil, angka, dan tanda hubung. Contoh: dapur-bunda"
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.slug?.message}
            {...register('slug')}
          />
          <Textarea label="Deskripsi (opsional)" error={errors.description?.message} {...register('description')} />
          <Input
            label="Nomor WhatsApp"
            type="tel"
            inputMode="tel"
            placeholder="0812xxxxxxx"
            error={errors.whatsappNumber?.message}
            {...register('whatsappNumber')}
          />
          <Button type="submit" fullWidth size="lg" loading={isSubmitting}>
            Buat toko
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
