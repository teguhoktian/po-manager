import {
  BarChart3,
  CalendarClock,
  Check,
  ClipboardList,
  Link2,
  MessageCircle,
  ReceiptText,
  Truck,
  Wallet,
} from 'lucide-react'
import { Button } from '../../components/ui'

const STEPS = [
  { icon: ClipboardList, title: 'Buat PO', text: 'Pilih produk, atur kuota dan tanggal tutup. Cukup beberapa ketukan.' },
  { icon: Link2, title: 'Bagikan link', text: 'Tempel satu link di WhatsApp Group. Pembeli tidak perlu membuat akun.' },
  { icon: MessageCircle, title: 'Terima pesanan', text: 'Pesanan masuk lengkap dengan nomor pesanan, bukti bayar, dan status.' },
]

const FEATURES = [
  { icon: CalendarClock, tone: 'bg-green-100 text-green-700', title: 'Kuota dan batas waktu', text: 'PO ditutup otomatis saat kuota penuh atau waktu habis.' },
  { icon: Wallet, tone: 'bg-amber-100 text-amber-700', title: 'Lunas atau DP', text: 'Pembeli unggah bukti transfer, kamu terima atau tolak dari satu halaman.' },
  { icon: Truck, tone: 'bg-sky-100 text-sky-700', title: 'Resi dan status kirim', text: 'Pembeli melihat tahap pesanan dan nomor resi tanpa perlu bertanya.' },
  { icon: ReceiptText, tone: 'bg-rose-100 text-rose-700', title: 'Cek pesanan tanpa akun', text: 'Satu link rahasia per pesanan. Tidak ada kata sandi yang perlu diingat.' },
  { icon: BarChart3, tone: 'bg-violet-100 text-violet-700', title: 'Laporan per PO', text: 'Omzet, piutang, dan laba kotor tiap PO terlihat jelas.' },
  { icon: MessageCircle, tone: 'bg-emerald-100 text-emerald-700', title: 'Tetap lewat WhatsApp', text: 'Kamu yang menekan tombol kirim. Tanpa bot, tanpa risiko akun diblokir.' },
]

/** Static picture of the product's real job: a PO announced in a group, and the order slip that comes back. */
function ChatMock() {
  return (
    <div
      role="img"
      aria-label="Contoh pengumuman PO di WhatsApp Group dan nota pesanan"
      className="relative mx-auto w-full max-w-sm select-none"
    >
      <div className="rounded-[2rem] border border-green-900/10 bg-[#dfeadc] p-3 shadow-lift">
        <div className="flex items-center gap-2 rounded-2xl bg-brand-800 px-3 py-2 text-white">
          <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold">DK</span>
          <div className="leading-tight">
            <p className="text-sm font-bold">Dapur Kita (grup)</p>
            <p className="text-[11px] text-brand-100">128 anggota</p>
          </div>
        </div>

        <div className="space-y-2 px-1 py-3">
          <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-white p-2.5 text-sm shadow-sm">
            <p className="font-bold text-slate-900">PO Brownies Panggang dibuka!</p>
            <p className="mt-0.5 text-slate-700">Tutup Jumat jam 20.00. Pesan lewat link di bawah ya.</p>
            <div className="mt-2 rounded-xl border-l-4 border-brand-600 bg-brand-50 p-2">
              <p className="text-xs font-bold text-brand-800">pohub.web.id/po/dapurkita</p>
              <p className="text-xs text-slate-600">Sisa kuota 18 · mulai Rp 85.000</p>
            </div>
            <p className="mt-1 text-right text-[10px] text-slate-400">09.12</p>
          </div>
          <div className="ml-auto w-fit max-w-[70%] rounded-2xl rounded-tr-md bg-[#d9fdd3] px-3 py-1.5 text-sm text-slate-800 shadow-sm">
            Sudah order kak, 2 box 🙏
            <p className="text-right text-[10px] text-slate-500">09.14</p>
          </div>
        </div>
      </div>

      <div className="nota-edge relative z-10 mx-auto -mt-2 w-[88%] bg-white px-4 pt-4 shadow-lift">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Nomor pesanan</p>
            <p className="font-mono text-sm font-bold text-slate-900">DAPURK-0042</p>
          </div>
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-green-600/20 ring-inset">Lunas</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-dashed border-slate-300 pt-3 text-sm">
          <span className="text-slate-700">Brownies Panggang × 2</span>
          <span className="font-semibold text-slate-900">Rp 170.000</span>
        </div>
        <ol className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-500" aria-hidden="true">
          {['Diterima', 'Dikemas', 'Dikirim'].map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={`flex size-4 items-center justify-center rounded-full ${i < 2 ? 'bg-brand-600 text-white' : 'bg-slate-200'}`}>
                {i < 2 && <Check className="size-2.5" />}
              </span>
              <span className={i < 2 ? 'text-slate-800' : ''}>{s}</span>
              {i < 2 && <span className="h-px w-3 bg-slate-300" />}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <>
      <section className="bg-dots bg-canvas">
        <div className="mx-auto grid max-w-5xl items-center gap-12 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance text-brand-950 sm:text-5xl">
              Pre-order di WhatsApp Group, tanpa catatan yang berantakan
            </h1>
            <p className="mt-4 max-w-md text-lg text-slate-600">
              Bagikan satu link. Pesanan, bukti bayar, dan pengiriman tercatat rapi di satu tempat.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/register" size="lg">
                Buka PO pertamamu
              </Button>
              <Button href="#cara-kerja" size="lg" variant="secondary">
                Lihat cara kerja
              </Button>
            </div>
            <p className="mt-4 text-sm text-slate-500">Gratis untuk dicoba. Pembeli tidak perlu mendaftar.</p>
          </div>
          <ChatMock />
        </div>
      </section>

      <section id="cara-kerja" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Dari PO sampai paket tiba</h2>
        <ol className="relative mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="relative rounded-3xl border border-green-900/10 bg-white p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-[0_8px_16px_-8px_rgb(22_163_74/0.8)]">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="text-3xl font-extrabold text-brand-200" aria-hidden="true">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-green-900/10 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="max-w-lg text-2xl font-extrabold tracking-tight text-balance text-slate-900 sm:text-3xl">Semua yang dibutuhkan penjual PO</h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, tone, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${tone}`}>
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-950 px-6 py-10 text-white shadow-lift sm:px-12 sm:py-14">
          <h2 className="max-w-lg text-2xl font-extrabold tracking-tight text-balance sm:text-3xl">Siap membuka PO berikutnya dengan lebih tenang?</h2>
          <p className="mt-2 max-w-md text-brand-100">Buat toko, tambahkan produk, lalu bagikan link-nya ke grup.</p>
          <Button to="/register" size="lg" variant="secondary" className="mt-6 !border-white !text-brand-800">
            Daftar sekarang
          </Button>
        </div>
      </section>
    </>
  )
}
