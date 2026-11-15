import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardBody, CardHeader, Input, Textarea } from '../ui'
import { normalizePoFormValues, purchaseOrderFormSchema } from '../../schemas/purchaseOrder'
import { createPurchaseOrder, updatePurchaseOrder } from '../../services/purchaseOrderService'
import { describeFirebaseError } from '../../lib/firebaseErrors'
import { toLocalInputValue } from '../../lib/format'
import { slugify } from '../../lib/slugify'
import { cn } from '../../lib/cn'

const numberOpts = { valueAsNumber: true }
const MODES = [
  ['FULL', 'Lunas', 'Pembeli bayar penuh di muka'],
  ['DP', 'DP', 'Pembeli bayar sebagian dulu'],
]

const resolver = (values, context, options) => zodResolver(purchaseOrderFormSchema)(normalizePoFormValues(values), context, options)

export function PoForm({ uid, po, onSaved }) {
  const isNew = !po
  const [formError, setFormError] = useState('')
  const slugTouched = useRef(!isNew)

  // Computed once (lazy initial state) so Date.now() is not called on every render.
  const [defaultValues] = useState(() => ({
    title: po?.title ?? '',
    slug: po?.slug ?? '',
    description: po?.description ?? '',
    paymentMode: po?.paymentMode ?? 'FULL',
    dpPercent: po?.dpPercent ?? '',
    openAt: toLocalInputValue(po?.openAt ?? new Date()),
    closeAt: toLocalInputValue(po?.closeAt ?? new Date(Date.now() + 7 * 86_400_000)),
    quota: po?.quota ?? '',
    minOrderQty: po?.minOrderQty ?? 1,
  }))

  const {
    register, handleSubmit, setValue, control,
    formState: { errors, isSubmitting },
  } = useForm({ resolver, defaultValues })

  const mode = useWatch({ control, name: 'paymentMode' })
  const titleField = register('title')
  const slugField = register('slug')

  const onSubmit = async (values) => {
    setFormError('')
    try {
      if (isNew) onSaved(await createPurchaseOrder(uid, values), true)
      else {
        await updatePurchaseOrder(po.id, values)
        onSaved(po.id, false)
      }
    } catch (error) {
      setFormError(describeFirebaseError(error, 'Gagal menyimpan PO.'))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {formError && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{formError}</p>}

      <Card>
        <CardHeader title="Detail PO" />
        <CardBody className="space-y-4">
          <Input
            label="Judul PO"
            placeholder="Contoh: PO Nugget Akhir Pekan"
            error={errors.title?.message}
            {...titleField}
            onChange={(e) => {
              titleField.onChange(e)
              if (!slugTouched.current) setValue('slug', slugify(e.target.value))
            }}
          />
          <Input
            label="Alamat PO (slug)"
            hint="Bagian dari link PO. Harus unik di antara PO yang sedang berjalan."
            autoCapitalize="none"
            autoCorrect="off"
            error={errors.slug?.message}
            {...slugField}
            onChange={(e) => {
              slugTouched.current = true
              slugField.onChange(e)
            }}
          />
          <Textarea label="Deskripsi (opsional)" rows={3} error={errors.description?.message} {...register('description')} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Jadwal dan kuota" />
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Dibuka" type="datetime-local" error={errors.openAt?.message} {...register('openAt')} />
            <Input label="Ditutup" type="datetime-local" error={errors.closeAt?.message} {...register('closeAt')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Kuota (unit)"
              type="number" inputMode="numeric" min={1} step={1}
              hint="Kosongkan untuk tanpa batas. PO ditutup otomatis saat kuota penuh."
              error={errors.quota?.message}
              {...register('quota', numberOpts)}
            />
            <Input
              label="Minimal order per pembeli (unit)"
              type="number" inputMode="numeric" min={1} step={1}
              error={errors.minOrderQty?.message}
              {...register('minOrderQty', numberOpts)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pembayaran" />
        <CardBody className="space-y-4">
          <fieldset>
            <legend className="sr-only">Mode pembayaran</legend>
            <div className="grid grid-cols-2 gap-2">
              {MODES.map(([value, label, hint]) => (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer flex-col rounded-xl border p-3 focus-within:ring-2 focus-within:ring-brand-600/30',
                    mode === value ? 'border-brand-600 bg-brand-50' : 'border-slate-200 bg-white',
                  )}
                >
                  <input type="radio" value={value} className="sr-only" {...register('paymentMode')} />
                  <span className="text-sm font-semibold text-slate-900">{label}</span>
                  <span className="text-xs text-slate-500">{hint}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {mode === 'DP' && (
            <Input
              label="Persentase DP (%)"
              type="number" inputMode="numeric" min={1} max={99} step={1}
              error={errors.dpPercent?.message}
              {...register('dpPercent', numberOpts)}
            />
          )}
        </CardBody>
      </Card>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        {isNew ? 'Simpan draf PO' : 'Simpan perubahan'}
      </Button>
    </form>
  )
}
