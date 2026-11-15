import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Store } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '../ui'
import { getLogoUrl, uploadStoreLogo, validateLogoFile } from '../../services/storeService'

export function StoreLogoUploader({ store, onUploaded }) {
  const inputRef = useRef(null)
  const [url, setUrl] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!store.logoPath) return undefined
    getLogoUrl(store.logoPath)
      .then((next) => !cancelled && setUrl(next))
      .catch(() => !cancelled && setUrl(null))
    return () => {
      cancelled = true
    }
  }, [store.logoPath])

  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    try {
      validateLogoFile(file)
      setUploading(true)
      await uploadStoreLogo(store.id, file, store.logoPath)
      await onUploaded()
    } catch (err) {
      setError(err.message || 'Gagal mengunggah logo.')
    } finally {
      setUploading(false)
    }
  }

  const shownUrl = store.logoPath ? url : null

  return (
    <Card>
      <CardHeader title="Logo toko" description="JPG, PNG, atau WebP. Otomatis dikecilkan sebelum diunggah." />
      <CardBody className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-50 text-brand-600">
          {shownUrl ? <img src={shownUrl} alt={`Logo ${store.name}`} className="size-full object-cover" /> : <Store className="size-8" aria-hidden="true" />}
        </div>
        <div className="min-w-0">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} aria-label="Pilih logo" />
          <Button variant="secondary" loading={uploading} onClick={() => inputRef.current?.click()}>
            <ImagePlus className="size-4" aria-hidden="true" />
            {store.logoPath ? 'Ganti logo' : 'Unggah logo'}
          </Button>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}
