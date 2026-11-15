import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '../ui'
import { storeCreateSchema } from '../../schemas/store'
import { createStore } from '../../services/storeService'
import { randomCode, storeSlugFrom } from '../../lib/slugify'

export function StoreCreateForm({ onCreated }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(storeCreateSchema),
    defaultValues: { name: '', slug: '', description: '', whatsappNumber: '' },
  })

  // The link follows the name (plus a random code, so two stores with the same name never clash) until the seller edits it.
  const code = useRef(randomCode())
  const slugTouched = useRef(false)

  const nameField = register('name')
  const slugField = register('slug')

  const onSubmit = async (values) => {
    setFormError('')
    try {
      await createStore(values)
      await onCreated()
    } catch (error) {
      if (/link toko/i.test(error.message)) setError('slug', { message: error.message })
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
          <Input
            label="Nama toko"
            error={errors.name?.message}
            {...nameField}
            onChange={(e) => {
              nameField.onChange(e)
              if (!slugTouched.current) setValue('slug', storeSlugFrom(e.target.value, code.current), { shouldValidate: Boolean(errors.slug) })
            }}
          />
          <Input
            label="Link toko"
            hint="Dibuat otomatis dari nama toko dan kode unik. Boleh diubah: huruf kecil, angka, dan tanda hubung."
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.slug?.message}
            {...slugField}
            onChange={(e) => {
              slugTouched.current = true
              slugField.onChange(e)
            }}
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
