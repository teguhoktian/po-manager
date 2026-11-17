import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '../ui'
import { QuotaProgress } from './QuotaProgress'
import { formatDateTime } from '../../lib/format'

const CLOSE_REASONS = { MANUAL: 'Ditutup manual', DEADLINE: 'Batas waktu tercapai', QUOTA: 'Kuota penuh' }

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  )
}

export function PoSummaryCard({ po, storeSlug }) {
  const [copied, setCopied] = useState(false)
  const live = po.status === 'OPEN' || po.status === 'SCHEDULED'
  const url = storeSlug ? `${window.location.origin}/po/${storeSlug}/${po.slug}` : null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be blocked; the link stays visible.
    }
  }

  return (
    <Card>
      <CardHeader title="Ringkasan PO" />
      <CardBody className="space-y-4">
        <QuotaProgress ordered={po.orderedQty} quota={po.quota} />
        <dl className="divide-y divide-slate-100">
          <Row label="Dibuka">{formatDateTime(po.openAt)}</Row>
          <Row label="Ditutup">{formatDateTime(po.closeAt)}</Row>
          <Row label="Pembayaran">{po.paymentMode === 'DP' ? `DP ${po.dpPercent}%` : 'Lunas'}</Row>
          <Row label="Minimal order">{po.minOrderQty} unit</Row>
          <Row label="Pesanan masuk">{po.orderCount ?? 0}</Row>
          {po.closeReason && <Row label="Alasan tutup">{CLOSE_REASONS[po.closeReason] ?? po.closeReason}</Row>}
        </dl>

        {live && url && (
          <div className="space-y-2 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium text-slate-700">Link PO</p>
            <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm break-all text-slate-700">{url}</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={copy} className="sm:flex-1">
                {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                {copied ? 'Tersalin' : 'Salin link'}
              </Button>
              <Button href={`https://wa.me/?text=${encodeURIComponent(`${po.title}: ${url}`)}`} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
                <MessageCircle className="size-4" aria-hidden="true" /> Bagikan ke WhatsApp
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
