import { ImageOff } from 'lucide-react'
import { Badge } from '../ui'
import { formatRupiah } from '../../lib/format'
import { maxQtyFor } from '../../lib/pricing'
import { QtyStepper } from './QtyStepper'

export function ProductCard({ product, qty, totalQty, remainingQuota, canOrder, onChange }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-green-900/10 bg-white shadow-card">
      {product.images.length > 0 ? (
        <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto bg-slate-100" tabIndex={0} aria-label={`Foto ${product.name}`}>
          {product.images.map((src) => (
            <img key={src} src={src} alt={product.name} loading="lazy" decoding="async" className="aspect-square w-full shrink-0 snap-center object-cover sm:aspect-[4/3]" />
          ))}
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center bg-slate-100 text-slate-300">
          <ImageOff className="size-8" aria-hidden="true" />
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-extrabold text-slate-900">{product.name}</h3>
        {product.description && <p className="mt-1 text-sm whitespace-pre-line text-slate-600">{product.description}</p>}

        <ul className="mt-3 divide-y divide-slate-100">
          {product.options.map((option) => {
            const current = qty[option.itemId] ?? 0
            const max = maxQtyFor(option, { remainingQuota, othersQty: totalQty - current })
            const label = option.name ? `${product.name} ${option.name}` : product.name
            return (
              <li key={option.itemId} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  {option.name && <p className="text-sm font-medium text-slate-800">{option.name}</p>}
                  <p className="text-base font-extrabold text-brand-700">{formatRupiah(option.price)}</p>
                  {option.stock !== null && !option.soldOut && option.stock <= 5 && (
                    <p className="mt-0.5 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">Sisa {option.stock}</p>
                  )}
                </div>
                {option.soldOut ? (
                  <Badge>Habis</Badge>
                ) : (
                  <QtyStepper value={current} max={max} label={label} disabled={!canOrder} onChange={(v) => onChange(option.itemId, v)} />
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </article>
  )
}
