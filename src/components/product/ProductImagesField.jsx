import { useRef, useState } from 'react'
import { ImagePlus, Star, Trash2 } from 'lucide-react'
import { StorageImage } from './StorageImage'
import { validateImageFile } from '../../services/imageService'
import { cn } from '../../lib/cn'

export const MAX_IMAGES = 5

/**
 * Controlled image list. Items are `{ key, path }` (stored) or `{ key, file, preview }` (new, not uploaded yet).
 * The first image is the cover.
 */
export function ProductImagesField({ images, onChange }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')

  const addFiles = (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError('')
    const room = MAX_IMAGES - images.length
    if (files.length > room) setError(`Maksimal ${MAX_IMAGES} gambar.`)

    const added = []
    for (const file of files.slice(0, Math.max(room, 0))) {
      try {
        validateImageFile(file)
        added.push({ key: `new-${crypto.randomUUID()}`, file, preview: URL.createObjectURL(file) })
      } catch (err) {
        setError(err.message)
      }
    }
    if (added.length) onChange([...images, ...added])
  }

  const remove = (index) => {
    const target = images[index]
    if (target.preview) URL.revokeObjectURL(target.preview)
    setError('')
    onChange(images.filter((_, i) => i !== index))
  }

  const makeCover = (index) => onChange([images[index], ...images.filter((_, i) => i !== index)])

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">Gambar produk</span>
        <span className="text-xs text-slate-500">
          {images.length}/{MAX_IMAGES} · JPG, PNG, WebP · otomatis dikecilkan
        </span>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {images.map((image, index) => (
          <li key={image.key} className="relative">
            {image.preview ? (
              <img src={image.preview} alt="" className="aspect-square w-full rounded-xl object-cover" />
            ) : (
              <StorageImage path={image.path} className="aspect-square w-full rounded-xl" />
            )}
            {index === 0 && (
              <span className="absolute top-1 left-1 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-semibold text-white">Utama</span>
            )}
            <div className="mt-1 flex gap-1">
              <button
                type="button"
                onClick={() => makeCover(index)}
                disabled={index === 0}
                aria-label="Jadikan gambar utama"
                className={cn('flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50', index === 0 && 'opacity-40')}
              >
                <Star className="size-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Hapus gambar"
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-slate-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}

        {images.length < MAX_IMAGES && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 hover:border-brand-500 hover:text-brand-700"
            >
              <ImagePlus className="size-6" aria-hidden="true" />
              <span className="text-xs font-medium">Tambah</span>
            </button>
          </li>
        )}
      </ul>

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addFiles} aria-label="Pilih gambar produk" />
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
