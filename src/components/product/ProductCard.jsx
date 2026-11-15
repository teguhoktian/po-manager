import { Link } from 'react-router-dom'
import { StorageImage } from './StorageImage'
import { Badge } from '../ui'
import { CATALOG_STATUS } from '../../constants/statuses'
import { calcMargin, formatRupiah } from '../../lib/format'

export function ProductCard({ product }) {
  const margin = calcMargin(product.sellingPrice, product.purchaseCost)
  return (
    <Link
      to={`/dashboard/products/${product.id}`}
      className="flex gap-3 rounded-card border border-slate-200/80 bg-white p-3 shadow-card transition-colors hover:border-brand-300"
    >
      <StorageImage path={product.imagePaths?.[0]} alt="" className="size-20 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold text-slate-900">{product.name}</h3>
          {product.status === CATALOG_STATUS.ARCHIVED && <Badge>Arsip</Badge>}
        </div>
        <p className="mt-0.5 text-sm font-medium text-slate-900">{formatRupiah(product.sellingPrice)}</p>
        <p className="text-xs text-slate-500">
          Margin {formatRupiah(margin.amount)}
          {margin.percent !== null && ` (${margin.percent}%)`}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge tone={product.trackStock ? 'info' : 'neutral'}>{product.trackStock ? `Stok ${product.stock}` : 'Stok tidak dilacak'}</Badge>
          {product.hasVariants && <Badge tone="brand">Varian</Badge>}
        </div>
      </div>
    </Link>
  )
}
