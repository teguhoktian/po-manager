import { Link } from 'react-router-dom'
import { CalendarClock, LogIn, Package, Share2, ShoppingBag, Store, Truck, Wallet, BarChart3, Users, HelpCircle, Lightbulb } from 'lucide-react'
import { Button, Card, CardBody } from '../../components/ui'
import { SITE } from '../../config/site'

const B = ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>

function Steps({ children }) {
  return (
    <ol className="mt-4 space-y-3">
      {children.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800" aria-hidden="true">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1 text-slate-700">{step}</div>
        </li>
      ))}
    </ol>
  )
}

function Tip({ title = 'Perlu diingat', children }) {
  return (
    <div className="mt-5 flex gap-3 rounded-xl bg-amber-50 p-3.5 text-sm text-amber-900">
      <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">{title}</p>
        <div className="mt-1 space-y-1">{children}</div>
      </div>
    </div>
  )
}

function Section({ id, n, icon: Icon, title, intro, children, to, toLabel }) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">
              {n && <span className="text-brand-700">{n}. </span>}
              {title}
            </h2>
          </div>
          {intro && <p className="mt-3 text-slate-600">{intro}</p>}
          {children}
          {to && (
            <Button to={to} variant="secondary" className="mt-5">
              {toLabel}
            </Button>
          )}
        </CardBody>
      </Card>
    </section>
  )
}

const TOC = [
  ['masuk', 'Daftar & masuk'],
  ['toko', 'Buat toko'],
  ['produk', 'Tambah produk'],
  ['po', 'Buat PO'],
  ['bagikan', 'Bagikan link'],
  ['pesanan', 'Kelola pesanan'],
  ['pembayaran', 'Pembayaran'],
  ['pengiriman', 'Pengiriman'],
  ['tutup', 'Tutup & selesaikan PO'],
  ['laporan', 'Laporan'],
  ['pembeli', 'Sisi pembeli'],
  ['masalah', 'Masalah umum'],
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Cara pakai {SITE.name}</h1>
      <p className="mt-2 max-w-xl text-slate-600">
        Panduan untuk penjual, dari daftar sampai pesanan sampai ke pembeli. Ikuti urutannya kalau baru mulai, atau langsung loncat ke bagian yang kamu butuhkan.
      </p>

      <nav aria-label="Daftar isi" className="mt-6 flex flex-wrap gap-2">
        {TOC.map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:border-brand-300 hover:bg-brand-50"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-8 space-y-5">
        <Section id="masuk" n="1" icon={LogIn} title="Daftar dan masuk">
          <Steps>
            {[
              <>Buka {SITE.domain}, lalu ketuk <B>Daftar</B>.</>,
              <>Pilih cara daftar. Paling cepat: <B>Daftar dengan Google</B>. Atau isi <B>Nama</B>, <B>Email</B>, dan <B>Kata sandi</B> (minimal 8 karakter), ulangi kata sandi, centang persetujuan, lalu ketuk <B>Daftar</B>.</>,
              <>Untuk memastikan tidak salah ketik, ketuk ikon mata di kolom kata sandi. Ketuk lagi untuk menyembunyikannya.</>,
              <>Lain kali, ketuk <B>Masuk</B> dan pakai cara yang sama seperti saat daftar.</>,
            ]}
          </Steps>
          <h3 className="mt-6 font-bold text-slate-900">Lupa kata sandi</h3>
          <Steps>
            {[
              <>Di halaman <B>Masuk</B>, ketuk <B>Lupa kata sandi?</B>.</>,
              <>Isi email akunmu, lalu ketuk <B>Kirim tautan</B>.</>,
              <>Buka email dari kami (cek folder spam bila belum ada), ketuk tautannya, dan buat kata sandi baru.</>,
              <>Kembali ke halaman <B>Masuk</B> dan masuk dengan kata sandi baru.</>,
            ]}
          </Steps>
          <Tip>
            <p>Kalau kamu mendaftar dengan Google, masuk saja dengan tombol <B>Masuk dengan Google</B>.</p>
            <p>Jendela Google tidak muncul? Izinkan pop-up untuk situs ini. Kalau kamu membuka dari dalam aplikasi lain (misalnya WhatsApp atau Instagram), buka {SITE.domain} lewat Chrome atau Safari.</p>
          </Tip>
        </Section>

        <Section id="toko" n="2" icon={Store} title="Buat toko" intro="Toko adalah halaman yang dilihat pembeli. Kamu hanya perlu membuatnya sekali." to="/dashboard/store" toLabel="Buka menu Toko">
          <Steps>
            {[
              <>Buka menu <B>Toko</B>. Kamu akan melihat <B>Buat toko kamu</B>.</>,
              <>Isi <B>Nama toko</B>. <B>Link toko</B> terisi otomatis. Kamu boleh mengubahnya: huruf kecil, angka, dan tanda hubung.</>,
              <>Isi <B>Nomor WhatsApp</B> yang dipakai pembeli untuk menghubungimu. <B>Deskripsi</B> boleh dikosongkan.</>,
              <>Ketuk <B>Buat toko</B>.</>,
              <>Di <B>Profil toko</B>, isi <B>Info pembayaran</B>, misalnya <i>BCA 1234567890 a.n. Nama Anda</i>. Info ini tampil ke pembeli setelah mereka checkout. Ketuk <B>Simpan perubahan</B>.</>,
              <>Opsional: ketuk <B>Unggah logo</B> (JPG, PNG, atau WebP; gambar persegi paling pas).</>,
            ]}
          </Steps>
          <Tip>
            <p>Mengubah link toko membuat link lama berhenti berfungsi. Kalau link sudah kamu bagikan, jangan diubah.</p>
          </Tip>
        </Section>

        <Section id="produk" n="3" icon={Package} title="Tambah produk" intro="Produk dibuat sekali, lalu bisa dipakai di banyak PO." to="/dashboard/products/new" toLabel="Tambah produk">
          <Steps>
            {[
              <>Buka menu <B>Produk</B>, ketuk <B>Tambah</B>.</>,
              <>Isi <B>Nama produk</B>. <B>Alamat produk (slug)</B> terisi otomatis. <B>Deskripsi</B> menjelaskan produk ke pembeli.</>,
              <>Tambahkan foto, maksimal 5 gambar.</>,
              <>Di <B>Harga dan stok</B>, isi <B>Harga jual</B>. <B>Harga modal</B> hanya terlihat olehmu dan dipakai untuk menghitung laba di Laporan.</>,
              <>Kalau stok terbatas, centang <B>Lacak stok</B> lalu isi <B>Jumlah stok</B>.</>,
              <>Ketuk <B>Simpan produk</B>.</>,
            ]}
          </Steps>
          <h3 className="mt-6 font-bold text-slate-900">Produk dengan varian (rasa, ukuran, warna)</h3>
          <Steps>
            {[
              <>Centang <B>Produk punya varian</B>, lalu simpan produknya dulu.</>,
              <>Di bagian <B>Varian</B>, ketuk <B>Tambah</B>. Isi <B>Nama varian</B> (contoh: Pedas, XL, Merah), harga, dan stok.</>,
              <>Ulangi untuk setiap varian. Varian yang tidak dijual lagi bisa diarsipkan lewat tombol <B>Arsipkan</B>.</>,
            ]}
          </Steps>
          <Tip>
            <p>Produk yang sudah tidak dijual: buka produknya, ketuk <B>Arsipkan</B>. Hanya produk aktif yang bisa dimasukkan ke PO. Untuk memakainya lagi, buka tab <B>Arsip</B> dan ketuk <B>Pulihkan</B>.</p>
          </Tip>
        </Section>

        <Section id="po" n="4" icon={CalendarClock} title="Buat PO" intro="PO (pre-order) adalah periode pemesanan: ada waktu buka, waktu tutup, dan kuota." to="/dashboard/po/new" toLabel="Buat PO">
          <Steps>
            {[
              <>Buka menu <B>PO</B>, ketuk <B>Buat PO</B>.</>,
              <>Di <B>Detail PO</B>, isi <B>Judul PO</B> (contoh: PO Nugget Akhir Pekan). <B>Alamat PO (slug)</B> terisi otomatis dan harus unik di antara PO yang sedang berjalan.</>,
              <>Di <B>Jadwal dan kuota</B>, isi <B>Dibuka</B> dan <B>Ditutup</B>. <B>Kuota (unit)</B> boleh dikosongkan untuk tanpa batas. <B>Minimal order per pembeli</B> mengatur jumlah barang minimum per pesanan.</>,
              <>Di <B>Pembayaran</B>, pilih <B>Lunas</B> (pembeli bayar penuh di muka) atau <B>DP</B> (bayar sebagian dulu, lalu isi <B>Persentase DP</B>).</>,
              <>Ketuk <B>Simpan draf PO</B>.</>,
              <>Di <B>Produk dalam PO</B>, ketuk <B>Tambah</B>, pilih produk (tertulis <B>Ditambahkan</B> bila sudah masuk), lalu ketuk <B>Selesai</B>. Harga di sini dipakai untuk pesanan PO ini.</>,
              <>Setelah semua siap, ketuk <B>Publikasikan</B>. PO akan terbuka sesuai jadwal. Kalau mau langsung menerima pesanan, ketuk <B>Buka sekarang</B>.</>,
            ]}
          </Steps>
          <h3 className="mt-6 font-bold text-slate-900">Status PO</h3>
          <ul className="mt-3 space-y-1.5 text-slate-700">
            <li><B>Draf</B>: masih disusun, belum terlihat pembeli.</li>
            <li><B>Terjadwal</B>: sudah dipublikasikan, menunggu waktu buka.</li>
            <li><B>Dibuka</B>: pembeli bisa memesan.</li>
            <li><B>Ditutup</B>: tidak menerima pesanan baru.</li>
            <li><B>Diproses</B>: kamu sedang menyiapkan pesanan.</li>
            <li><B>Selesai</B> atau <B>Dibatalkan</B>: sudah final.</li>
          </ul>
          <Tip>
            <p>Produk dan pengaturan PO hanya bisa diubah selagi PO berstatus Draf atau Terjadwal. Setelah dibuka, tidak bisa diubah lagi. Periksa dulu sebelum <B>Buka sekarang</B>.</p>
            <p>PO tertutup otomatis saat kuota penuh atau waktu tutup terlewati. Waktu tutup harus di masa depan saat kamu mempublikasikan.</p>
            <p>PO yang masih Draf bisa dihapus dengan <B>Hapus draf</B>.</p>
          </Tip>
        </Section>

        <Section id="bagikan" n="5" icon={Share2} title="Bagikan link ke pembeli">
          <Steps>
            {[
              <>Buka PO yang sudah dibuka. Di bagian link, ketuk <B>Salin link</B> atau <B>Bagikan ke WhatsApp</B>.</>,
              <>Tempel link ke WhatsApp Group. Pembeli membukanya, memilih barang, dan mengisi data sendiri. Mereka tidak perlu membuat akun.</>,
              <>Link tokomu (menu <B>Toko</B>, kartu <B>Link toko</B>) menampilkan daftar PO tokomu. Bagikan ini kalau kamu sering membuka PO baru.</>,
            ]}
          </Steps>
        </Section>

        <Section id="pesanan" n="6" icon={ShoppingBag} title="Kelola pesanan" to="/dashboard/orders" toLabel="Buka menu Pesanan">
          <Steps>
            {[
              <>Buka menu <B>Pesanan</B>. Tab <B>Aktif</B> berisi pesanan yang berjalan, <B>Dibatalkan</B> untuk yang batal, <B>Semua</B> untuk keduanya.</>,
              <>Persempit daftar dengan filter PO dan filter tahap: <B>Belum bayar</B>, <B>Perlu diproses</B>, <B>Diproses / dikemas</B>, <B>Dikirim</B>, <B>Selesai</B>. Kolom pencarian menerima nomor pesanan, nama, atau nomor WhatsApp.</>,
              <>Ketuk satu pesanan untuk membuka detailnya: data pemesan, isi pesanan, total, <B>Sudah dibayar</B>, dan <B>Sisa tagihan</B>.</>,
              <>Ketuk tombol WhatsApp di kartu <B>Pemesan</B> untuk menghubungi pembeli dengan pesan yang sudah terisi.</>,
            ]}
          </Steps>
          <h3 className="mt-6 font-bold text-slate-900">Membatalkan pesanan</h3>
          <p className="mt-2 text-slate-700">
            Pesanan bisa dibatalkan selama statusnya masih <B>Menunggu</B> (belum diproses). Buka pesanannya, ketuk <B>Batalkan pesanan</B>, isi alasan (opsional), lalu konfirmasi. Kalau pembeli sudah membayar, kamu perlu mencentang bahwa kamu akan mengembalikan uangnya.
          </p>
        </Section>

        <Section id="pembayaran" n="7" icon={Wallet} title="Terima dan cek pembayaran" to="/dashboard/payments" toLabel="Buka menu Pembayaran">
          <Steps>
            {[
              <>Pembeli mengunggah foto bukti transfer dari halaman pesanan mereka. Pesanan itu muncul di menu <B>Pembayaran</B>, bagian <B>Cek bukti bayar</B>.</>,
              <>Buka pesanannya dan periksa foto buktinya dengan mutasi rekeningmu.</>,
              <>Cocok: periksa kolom <B>Nominal yang diterima</B> (ubah bila pembeli mentransfer nominal lain), lalu ketuk <B>Terima</B>.</>,
              <>Tidak cocok: ketuk <B>Tolak</B>, tulis alasannya (minimal 3 karakter), lalu ketuk <B>Tolak bukti</B>. Pembeli bisa mengunggah bukti baru.</>,
              <>Pembayaran tanpa bukti, misalnya tunai atau transfer yang dikonfirmasi lewat chat: di detail pesanan ketuk <B>Catat pembayaran manual</B>.</>,
            ]}
          </Steps>
          <Tip title="Arti status pembayaran">
            <p><B>Belum bayar</B>: belum ada pembayaran terverifikasi. <B>DP dibayar</B>: sebagian sudah masuk. <B>Lunas</B>: sudah dibayar penuh.</p>
            <p>Bagian <B>Belum lunas</B> di menu Pembayaran mengumpulkan pesanan yang masih menunggu uang dari pembeli.</p>
            <p>Pembeli hanya bisa mengunggah bukti selama pesanannya masih <B>Menunggu</B>. Kalau pesanan sudah kamu proses lalu pembeli melunasi sisanya, catat lewat <B>Catat pembayaran manual</B>.</p>
          </Tip>
        </Section>

        <Section id="pengiriman" n="8" icon={Truck} title="Proses dan kirim pesanan" to="/dashboard/fulfillment" toLabel="Buka menu Pengiriman">
          <p className="mt-3 text-slate-600">Setiap pesanan melewati lima tahap: Menunggu, Diproses, Dikemas, Dikirim, Selesai. Pembeli ikut melihat tahapnya di halaman cek pesanan.</p>
          <Steps>
            {[
              <>Buka detail pesanan. Di kartu <B>Pengiriman</B>, ketuk <B>Mulai proses</B> lalu <B>Tandai dikemas</B>.</>,
              <>Ketuk <B>Kirim pesanan</B>. Pilih <B>Kurir</B> (atau <B>Ambil di tempat</B>), isi <B>Nomor resi</B> bila ada, dan <B>Catatan untuk pembeli</B> bila perlu. Simpan.</>,
              <>Ketuk <B>Kirim info resi</B> untuk mengabari pembeli lewat WhatsApp.</>,
              <>Setelah barang sampai, ketuk <B>Tandai selesai</B>.</>,
              <>Salah tekan? Ketuk <B>Kembali ke</B> tahap sebelumnya. Pesanan yang sudah <B>Selesai</B> tidak bisa diubah lagi.</>,
            ]}
          </Steps>
          <h3 className="mt-6 font-bold text-slate-900">Banyak pesanan sekaligus</h3>
          <p className="mt-2 text-slate-700">
            Di menu <B>Pengiriman</B>, pilih tahap <B>Perlu diproses</B> atau <B>Diproses / dikemas</B>. Ketuk <B>Pilih semua</B> atau pilih satu per satu, lalu ketuk <B>Tandai diproses</B> atau <B>Tandai dikemas</B>.
          </p>
          <Tip title="Syarat tiap tahap">
            <p>Diproses dan Dikemas: pembayaran harus sudah terverifikasi (DP cukup).</p>
            <p>Dikirim dan Selesai: pesanan harus <B>Lunas</B>.</p>
          </Tip>
        </Section>

        <Section id="tutup" n="9" icon={CalendarClock} title="Tutup dan selesaikan PO">
          <Steps>
            {[
              <>Saat waktu tutup tiba atau kuota penuh, PO berhenti menerima pesanan. Kamu juga bisa menutupnya sendiri dengan <B>Tutup PO</B>.</>,
              <>PO ditutup terlalu cepat? Ketuk <B>Buka kembali</B>, selama waktu tutupnya belum lewat.</>,
              <>Mulai menyiapkan barang: ketuk <B>Mulai proses</B>.</>,
              <>Kalau semua pesanan sudah beres, ketuk <B>Tandai selesai</B>. PO masuk riwayat dan tidak bisa diubah lagi.</>,
            ]}
          </Steps>
          <Tip>
            <p><B>Batalkan PO</B> tidak bisa dibatalkan, dan PO yang masih punya pesanan aktif tidak bisa dibatalkan. Batalkan atau selesaikan pesanannya lebih dulu.</p>
          </Tip>
        </Section>

        <Section id="laporan" n="10" icon={BarChart3} title="Laporan dan ringkasan" to="/dashboard/reports" toLabel="Buka menu Laporan">
          <ul className="mt-4 space-y-2 text-slate-700">
            <li><B>Ringkasan</B> (halaman utama dashboard) menunjukkan jumlah PO dibuka, pesanan aktif, total penjualan, dan yang belum dibayar. Daftar <B>Perlu ditindaklanjuti</B> memberi tahu pesanan mana yang menunggu tindakanmu.</li>
            <li><B>Laporan</B>: pilih PO untuk melihat pesanan aktif, barang terjual, omzet, sudah dibayar, belum dibayar, dan laba kasar (dihitung dari harga modal), plus rincian per produk.</li>
          </ul>
        </Section>

        <Section id="pembeli" n="11" icon={Users} title="Sisi pembeli" intro="Supaya kamu bisa membantu pembeli yang bertanya.">
          <Steps>
            {[
              <>Pembeli membuka link PO dari WhatsApp, memilih produk dan jumlahnya.</>,
              <>Mereka mengisi <B>Nama penerima</B>, <B>Nomor WhatsApp</B>, dan <B>Alamat lengkap</B>, lalu memesan.</>,
              <>Halaman konfirmasi menampilkan kode pesanan dan info pembayaran yang kamu isi. Setelah transfer, mereka mengunggah foto bukti di halaman itu.</>,
              <>Kapan pun, pembeli bisa membuka <Link to="/cek" className="font-semibold text-brand-700 underline">{SITE.domain}/cek</Link> dan memasukkan <B>Kode pesanan</B> serta <B>Nomor WhatsApp</B> untuk melihat status dan resi.</>,
            ]}
          </Steps>
          <Tip title="Saran">
            <p>Minta pembeli menyimpan kode pesanannya (misalnya dengan tangkapan layar) supaya mudah dicek lagi.</p>
          </Tip>
        </Section>

        <Section id="masalah" n="12" icon={HelpCircle} title="Masalah umum">
          <dl className="mt-4 space-y-5 text-slate-700">
            {[
              ['Email reset kata sandi tidak datang', 'Tunggu beberapa menit dan periksa folder spam. Pastikan alamatnya sama dengan yang dipakai saat daftar. Kalau kamu mendaftar dengan Google, masuk saja dengan tombol Google.'],
              ['Pembeli bilang kuota sudah penuh', 'Kuota dihitung dari barang yang sudah dipesan. Bila ada pesanan dibatalkan, kuotanya kembali. Kamu bisa menutup lalu membuka kembali PO selama waktunya belum lewat.'],
              ['Produk atau jadwal PO tidak bisa diubah', 'PO yang sudah dibuka terkunci. Pengaturan hanya bisa diubah saat Draf atau Terjadwal. Untuk PO Terjadwal, ketuk Kembalikan ke draf dulu bila perlu.'],
              ['Tombol Mulai proses atau Kirim tidak aktif', 'Cek pembayarannya. Diproses dan Dikemas butuh pembayaran terverifikasi, Dikirim dan Selesai butuh status Lunas.'],
              ['Foto produk atau logo gagal diunggah', 'Pakai JPG, PNG, atau WebP. Kalau ukurannya terlalu besar, coba foto lain yang lebih kecil.'],
              ['Link toko tiba-tiba tidak bisa dibuka', 'Mungkin link tokomu diubah. Buka menu Toko untuk melihat link terbaru dan bagikan ulang.'],
            ].map(([q, a]) => (
              <div key={q}>
                <dt className="font-semibold text-slate-900">{q}</dt>
                <dd className="mt-1">{a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-slate-700">
            Belum terjawab? <Link to="/kontak" className="font-semibold text-brand-700 underline">Hubungi kami</Link>.
          </p>
        </Section>
      </div>

      <div className="mt-8 rounded-3xl bg-brand-700 p-6 text-center text-white sm:p-8">
        <p className="text-xl font-extrabold">Siap membuka PO pertamamu?</p>
        <div className="mt-4 flex justify-center">
          <Button to="/register" size="lg" variant="secondary" className="!border-white !text-brand-800">
            Daftar sekarang
          </Button>
        </div>
      </div>
    </div>
  )
}
