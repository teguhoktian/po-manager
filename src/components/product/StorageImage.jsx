import { ImageIcon } from 'lucide-react'
import { useStorageUrl } from '../../hooks/useStorageUrl'
import { cn } from '../../lib/cn'

/** Image from a Storage path with a neutral placeholder while loading or when there is no image. */
export function StorageImage({ path, alt = '', className }) {
  const url = useStorageUrl(path)
  return url ? (
    <img src={url} alt={alt} loading="lazy" className={cn('object-cover', className)} />
  ) : (
    <div className={cn('flex items-center justify-center bg-slate-100 text-slate-400', className)} aria-hidden="true">
      <ImageIcon className="size-6" />
    </div>
  )
}
