import { useState } from 'react'
import { Check, Copy, MessageCircle } from 'lucide-react'
import { Button, Card, CardBody, CardHeader } from '../ui'

export function StoreLinkCard({ store }) {
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}/po/${store.slug}`
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Pre-order di ${store.name}: ${url}`)}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be blocked; the URL stays visible for manual copy.
    }
  }

  return (
    <Card>
      <CardHeader title="Link toko" description="Bagikan link ini ke pembeli di WhatsApp Group." />
      <CardBody className="space-y-3">
        <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm break-all text-slate-700">{url}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={copy} className="sm:flex-1">
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? 'Tersalin' : 'Salin link'}
          </Button>
          <Button href={shareUrl} target="_blank" rel="noopener noreferrer" className="sm:flex-1">
            <MessageCircle className="size-4" aria-hidden="true" />
            Bagikan ke WhatsApp
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
