import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { Button } from '../ui'
import { waLink } from './waLink'

export function StoreHeader({ store, to, compact = false }) {
  const full = !compact
  const initial = (store.name?.[0] ?? '?').toUpperCase()
  const body = (
    <>
      {store.logoUrl ? (
        <img src={store.logoUrl} alt="" decoding="async" className={compact ? 'size-10 rounded-xl object-cover' : 'size-16 rounded-2xl bg-white object-cover ring-2 ring-white/40'} />
      ) : (
        <span
          aria-hidden="true"
          className={`flex shrink-0 items-center justify-center font-extrabold ${compact ? 'size-10 rounded-xl bg-brand-600 text-white' : 'size-16 rounded-2xl bg-white text-2xl text-brand-700'}`}
        >
          {initial}
        </span>
      )}
      <span className="min-w-0">
        <span className={`block truncate font-extrabold ${compact ? 'text-base text-slate-900' : 'text-xl text-white'}`}>{store.name}</span>
        {!compact && store.description && <span className="mt-0.5 block text-sm text-brand-50/90">{store.description}</span>}
      </span>
    </>
  )

  return (
    <div
      className={`flex items-center justify-between gap-3 ${full ? 'rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-4 shadow-lift sm:p-5' : ''}`}
    >
      {to ? (
        <Link to={to} className="flex min-w-0 items-center gap-3">
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 items-center gap-3">{body}</div>
      )}
      {store.whatsappNumber && (
        <Button
          href={waLink(store.whatsappNumber, `Halo ${store.name}, saya ingin bertanya soal pre-order.`)}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          size="sm"
          aria-label="Tanya penjual via WhatsApp"
          className="shrink-0"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Tanya</span>
        </Button>
      )}
    </div>
  )
}
