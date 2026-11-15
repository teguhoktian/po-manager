import { Mail, MapPin, MessageCircle } from 'lucide-react'
import { Button, Card, CardBody } from '../../components/ui'
import { waLink } from '../../components/storefront'
import { COMPANY, SITE } from '../../config/site'

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Kontak</h1>
      <p className="mt-2 text-slate-600">
        Pertanyaan soal {SITE.name}, laporan penyalahgunaan, atau permintaan terkait data pribadi? Hubungi kami.
      </p>

      <Card className="mt-6">
        <CardBody className="space-y-5">
          <div>
            <p className="font-bold text-slate-900">{COMPANY.name}</p>
            <p className="mt-2 flex items-start gap-3 text-slate-700">
              <MapPin className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden="true" />
              {COMPANY.address}
            </p>
            <p className="mt-2 flex items-center gap-3 text-slate-700">
              <MessageCircle className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
              WhatsApp {COMPANY.whatsappDisplay}
            </p>
            <p className="mt-2 flex items-center gap-3 text-slate-700">
              <Mail className="size-5 shrink-0 text-brand-600" aria-hidden="true" />
              <a href={`mailto:${COMPANY.email}`} className="font-medium text-brand-700 hover:underline">
                {COMPANY.email}
              </a>
            </p>
          </div>
          <Button
            href={waLink(COMPANY.whatsapp, `Halo ${COMPANY.name}, saya ingin bertanya soal ${SITE.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            size="lg"
            fullWidth
          >
            <MessageCircle className="size-5" aria-hidden="true" /> Chat via WhatsApp
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
