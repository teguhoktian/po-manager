import { SearchX } from 'lucide-react'
import { Button, EmptyState } from '../../components/ui'

export default function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Halaman tidak ditemukan"
      description="Alamat yang kamu buka tidak tersedia atau sudah dipindahkan."
      action={<Button to="/">Kembali ke beranda</Button>}
      className="py-24"
    />
  )
}
