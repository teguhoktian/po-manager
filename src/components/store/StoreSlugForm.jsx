import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, ConfirmDialog, Input } from '../ui'
import { storeSlugChangeSchema } from '../../schemas/store'
import { changeStoreSlug } from '../../services/storeService'

export function StoreSlugForm({ store, onChanged }) {
  const [pending, setPending] = useState(null)
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm({ resolver: zodResolver(storeSlugChangeSchema), defaultValues: { slug: store.slug } })

  const confirm = async () => {
    setSaving(true)
    try {
      await changeStoreSlug(pending.slug)
      await onChanged()
    } catch (error) {
      setError('slug', { message: error.message })
    } finally {
      setSaving(false)
      setPending(null)
    }
  }

  return (
    <Card>
      <CardHeader title="Link toko" description="Mengubah link membuat link lama berhenti berfungsi." />
      <CardBody>
        <form onSubmit={handleSubmit((values) => setPending(values))} noValidate className="space-y-4">
          <Input label="Link toko" autoCapitalize="none" autoCorrect="off" error={errors.slug?.message} {...register('slug')} />
          <Button type="submit" variant="secondary" fullWidth disabled={!isDirty}>
            Ubah link
          </Button>
        </form>
      </CardBody>
      <ConfirmDialog
        open={Boolean(pending)}
        title="Ubah link toko?"
        description="Link PO yang sudah dibagikan dengan link lama tidak akan bisa dibuka lagi."
        confirmLabel="Ya, ubah"
        loading={saving}
        onConfirm={confirm}
        onCancel={() => setPending(null)}
      />
    </Card>
  )
}
