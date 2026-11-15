import { COMPANY, SITE } from '../../../config/site'
import { LegalDocument } from './LegalDocument'

const P = COMPANY.name

const SECTIONS = [
  {
    title: 'Definisi',
    body: [
      { list: [
        `"Penyedia" adalah ${P}, beralamat di ${COMPANY.address}, yang mengoperasikan ${SITE.name}.`,
        `"Layanan" adalah perangkat lunak berbasis web ${SITE.name} beserta seluruh fitur, halaman, dan antarmuka pemrograman yang disediakan Penyedia, yaitu alat bantu bagi Penjual untuk mengelola pre-order (PO).`,
        '"Penjual" adalah orang atau badan usaha yang mendaftar dan memakai Layanan untuk menjalankan usahanya.',
        '"Pembeli" adalah orang yang membuat pesanan kepada Penjual melalui halaman toko atau PO yang dibuat Penjual.',
        '"Pengguna" adalah Penjual dan/atau Pembeli.',
        '"Transaksi" adalah jual beli barang atau jasa antara Penjual dan Pembeli.',
      ] },
    ],
  },
  {
    title: 'Penerimaan Ketentuan',
    body: [
      'Dengan mendaftar, mengakses, atau menggunakan Layanan, Pengguna menyatakan telah membaca, memahami, dan menyetujui Syarat & Ketentuan ini serta Kebijakan Privasi, yang bersama-sama merupakan perjanjian yang mengikat secara hukum antara Pengguna dan Penyedia sebagaimana dimaksud Pasal 1320 dan 1338 Kitab Undang-Undang Hukum Perdata serta ketentuan kontrak elektronik dalam Undang-Undang Informasi dan Transaksi Elektronik.',
      'Pengguna yang tidak setuju dengan ketentuan ini wajib berhenti menggunakan Layanan.',
    ],
  },
  {
    title: 'Peran Penyedia: hanya penyedia teknologi',
    body: [
      'Penyedia hanya menyediakan alat bantu teknologi. Penyedia bukan penjual, bukan agen, bukan perantara pembayaran, bukan jasa pengiriman, dan bukan pihak dalam Transaksi antara Penjual dan Pembeli.',
      { list: [
        'Penyedia tidak memiliki, menyimpan, memeriksa, atau menjamin barang, harga, ketersediaan, mutu, keamanan, keaslian, atau legalitas barang yang dijual Penjual.',
        'Penyedia tidak menerima, menyimpan, atau menyalurkan uang Pembeli. Pembayaran dilakukan langsung dari Pembeli ke Penjual di luar Layanan. Penyedia bukan penyelenggara sistem pembayaran maupun rekening bersama (escrow).',
        'Pengiriman, pengembalian barang, pengembalian dana, garansi, dan penyelesaian keluhan sepenuhnya menjadi tanggung jawab Penjual kepada Pembeli.',
        'Status pembayaran dan pengiriman yang tampil di Layanan merupakan data yang dimasukkan atau diverifikasi oleh Penjual, bukan verifikasi atau jaminan dari Penyedia.',
      ] },
    ],
  },
  {
    title: 'Akun Penjual',
    body: [
      { list: [
        'Penjual harus cakap hukum menurut hukum Indonesia (berusia minimal 18 tahun atau telah menikah, atau diwakili wali/badan usaha yang sah).',
        'Penjual wajib memberikan data yang benar, lengkap, dan terkini, serta bertanggung jawab atas keamanan kata sandi dan seluruh aktivitas yang terjadi di akunnya.',
        'Penjual wajib segera memberi tahu Penyedia bila mengetahui akunnya dipakai tanpa izin. Penyedia tidak bertanggung jawab atas kerugian akibat kelalaian Penjual menjaga akunnya.',
        'Satu akun hanya untuk satu toko. Dilarang memperjualbelikan atau mengalihkan akun tanpa persetujuan tertulis Penyedia.',
      ] },
    ],
  },
  {
    title: 'Kewajiban dan Tanggung Jawab Penjual',
    body: [
      'Penjual bertindak sebagai pelaku usaha dan bertanggung jawab penuh atas usahanya. Penjual menjamin bahwa:',
      { list: [
        'ia berhak menjual barang atau jasa yang ditawarkan, dan barang tersebut sah, aman, serta tidak melanggar hak pihak ketiga, termasuk hak kekayaan intelektual;',
        'informasi produk, harga, kuota, tanggal PO, biaya, estimasi pengiriman, dan syarat pembatalan yang ia tampilkan benar dan tidak menyesatkan, sesuai Undang-Undang Perlindungan Konsumen dan peraturan perdagangan melalui sistem elektronik;',
        'ia memenuhi seluruh kewajiban hukumnya sendiri, antara lain perizinan usaha, perpajakan, label dan standar produk, serta ketentuan khusus untuk barang yang diatur (misalnya makanan olahan, kosmetik, obat);',
        'ia memproses pesanan, pembayaran, pengiriman, dan keluhan Pembeli secara patut dan tepat waktu, serta menyediakan sarana komunikasi yang dapat dihubungi;',
        'ia memperlakukan data pribadi Pembeli sesuai hukum dan hanya memakainya untuk keperluan memproses pesanan.',
      ] },
      'Penjual dilarang menawarkan barang atau jasa yang melanggar hukum, termasuk narkotika, senjata, barang palsu atau bajakan, barang curian, pornografi, perjudian, produk hewan atau tumbuhan yang dilindungi, serta barang lain yang dilarang peraturan perundang-undangan.',
    ],
  },
  {
    title: 'Ketentuan bagi Pembeli',
    body: [
      { list: [
        'Pembeli memahami bahwa Transaksi terjadi antara Pembeli dan Penjual. Penyedia bukan pihak dalam Transaksi tersebut.',
        'Pembeli wajib memberikan data pemesanan yang benar (nama, nomor WhatsApp, alamat) dan membaca informasi PO, harga, estimasi waktu, serta syarat Penjual sebelum memesan.',
        'Pembeli membayar langsung kepada Penjual sesuai petunjuk Penjual dan menanggung sendiri risiko pembayaran ke rekening yang dicantumkan Penjual. Pembeli disarankan memastikan identitas Penjual sebelum mentransfer.',
        'Pre-order berarti barang dipesan atau diproduksi setelah pesanan terkumpul. Waktu pengerjaan dan pengiriman mengikuti keterangan Penjual.',
        'Pengajuan pembatalan, pengembalian dana, penukaran, atau komplain diajukan langsung kepada Penjual. Hak Pembeli sebagai konsumen terhadap Penjual berdasarkan hukum yang berlaku tetap berlaku.',
        'Link pesanan bersifat rahasia. Siapa pun yang memegang link tersebut dapat melihat status pesanan. Pembeli bertanggung jawab menjaganya.',
      ] },
    ],
  },
  {
    title: 'Biaya',
    body: [
      'Penyedia dapat menyediakan Layanan secara gratis, berbayar, atau dengan paket tertentu. Biaya, jika ada, akan diumumkan dalam Layanan sebelum berlaku. Penyedia berhak mengubah harga, paket, dan batas pemakaian dengan pemberitahuan wajar. Biaya yang telah dibayar tidak dapat dikembalikan, kecuali ditentukan lain secara tertulis atau diwajibkan peraturan perundang-undangan.',
    ],
  },
  {
    title: 'Larangan Penggunaan',
    body: [
      'Pengguna dilarang:',
      { list: [
        'memakai Layanan untuk penipuan, pencucian uang, penyebaran konten melawan hukum, atau tindakan yang melanggar peraturan perundang-undangan;',
        'mengunggah konten yang melanggar hak pihak ketiga, mengandung perangkat lunak berbahaya, atau bukti pembayaran yang dipalsukan;',
        'mencoba menembus, menguji celah, mengganggu, membebani secara berlebihan, memindai otomatis, atau merekayasa balik Layanan, termasuk menebak kode atau link pesanan;',
        'mengakses data milik Penjual lain, atau memakai data Pembeli untuk tujuan di luar pemrosesan pesanan;',
        'mengirim pesan massal yang tidak diminta (spam) atau memakai otomatisasi tidak resmi pada WhatsApp.',
      ] },
    ],
  },
  {
    title: 'Konten Pengguna dan Hak Kekayaan Intelektual',
    body: [
      'Seluruh hak atas Layanan, termasuk perangkat lunak, desain, merek, dan dokumentasi, adalah milik Penyedia atau pemberi lisensinya. Pengguna hanya memperoleh hak terbatas, tidak eksklusif, tidak dapat dialihkan, dan dapat dicabut untuk menggunakan Layanan sesuai ketentuan ini.',
      'Penjual tetap memiliki konten yang ia unggah (nama toko, foto, deskripsi produk). Penjual memberi Penyedia lisensi non-eksklusif untuk menyimpan, memproses, menampilkan, dan mengubah ukuran konten tersebut semata-mata untuk menjalankan Layanan. Penjual bertanggung jawab penuh atas konten dan menjamin bahwa konten tersebut tidak melanggar hak pihak mana pun.',
    ],
  },
  {
    title: 'Ketersediaan Layanan dan Data',
    body: [
      'Layanan disediakan "sebagaimana adanya" (as is) dan "sebagaimana tersedia" (as available). Penyedia berupaya menjaga Layanan tetap berjalan, tetapi tidak menjamin Layanan bebas gangguan, kesalahan, keterlambatan, kehilangan data, atau tersedia setiap saat, termasuk karena pemeliharaan, gangguan jaringan, gangguan penyedia infrastruktur pihak ketiga, atau serangan siber.',
      'Penjual bertanggung jawab menyimpan salinan data pentingnya sendiri (misalnya catatan pesanan dan bukti pembayaran). Penyedia dapat mengubah, menambah, atau menghentikan fitur dengan pemberitahuan yang wajar.',
    ],
  },
  {
    title: 'Pelepasan Jaminan',
    body: [
      'Sejauh diizinkan hukum, Penyedia tidak memberikan jaminan apa pun, tersurat maupun tersirat, termasuk jaminan kelayakan untuk tujuan tertentu, ketepatan perhitungan atau laporan, serta tidak adanya pelanggaran hak pihak ketiga. Pengguna wajib memeriksa sendiri ketepatan harga, total, dan laporan sebelum mengandalkannya untuk keputusan usaha, pajak, atau pembukuan.',
    ],
  },
  {
    title: 'Pembatasan Tanggung Jawab',
    body: [
      'Sejauh diizinkan peraturan perundang-undangan:',
      { list: [
        'Penyedia tidak bertanggung jawab atas kerugian yang timbul dari Transaksi antara Penjual dan Pembeli, termasuk barang tidak sesuai, tidak dikirim, terlambat, rusak, penipuan oleh salah satu pihak, sengketa pembayaran, atau pengembalian dana;',
        'Penyedia tidak bertanggung jawab atas kerugian tidak langsung, khusus, atau konsekuensial, termasuk hilangnya keuntungan, pendapatan, peluang usaha, reputasi, atau data;',
        'total tanggung jawab Penyedia kepada seorang Pengguna atas seluruh klaim yang berkaitan dengan Layanan dibatasi paling banyak sebesar biaya yang telah dibayarkan Pengguna tersebut kepada Penyedia dalam 3 (tiga) bulan sebelum kejadian yang menjadi dasar klaim; apabila Layanan dipakai tanpa biaya, tanggung jawab Penyedia dibatasi hingga jumlah yang paling rendah yang diperbolehkan hukum.',
      ] },
      'Pembatasan di atas tidak berlaku sejauh hukum yang berlaku tidak mengizinkannya, antara lain untuk kerugian akibat perbuatan sengaja atau kelalaian berat Penyedia yang dinyatakan dalam putusan pengadilan yang berkekuatan hukum tetap, serta hak yang tidak dapat dikesampingkan berdasarkan peraturan perlindungan konsumen.',
    ],
  },
  {
    title: 'Ganti Rugi dan Pembebasan oleh Penjual',
    body: [
      'Penjual setuju untuk membela, membebaskan, dan mengganti kerugian Penyedia beserta pengurus, pegawai, dan mitranya dari setiap tuntutan, gugatan, denda, kerugian, dan biaya yang wajar (termasuk biaya penasihat hukum) yang timbul dari: (a) barang, jasa, konten, atau praktik usaha Penjual; (b) pelanggaran Penjual terhadap ketentuan ini atau peraturan perundang-undangan; (c) sengketa antara Penjual dengan Pembeli atau pihak ketiga; dan (d) pelanggaran hak pihak ketiga oleh Penjual.',
    ],
  },
  {
    title: 'Pelaporan, Penangguhan, dan Penghentian',
    body: [
      'Penyedia berhak, dengan atau tanpa pemberitahuan terlebih dahulu bila diperlukan untuk mencegah kerugian atau pelanggaran hukum, untuk menyembunyikan konten, menangguhkan, atau menghentikan akun dan akses ke Layanan apabila: terdapat dugaan pelanggaran ketentuan ini atau hukum, permintaan dari aparat atau instansi berwenang, risiko keamanan, atau akun tidak aktif dalam waktu lama.',
      'Penjual dapat berhenti memakai Layanan kapan saja. Setelah penghentian, Penyedia dapat menghapus atau menganonimkan data sesuai Kebijakan Privasi dan kewajiban retensi menurut hukum. Pasal yang menurut sifatnya tetap berlaku setelah penghentian (misalnya tanggung jawab, ganti rugi, hak kekayaan intelektual, dan penyelesaian sengketa) tetap berlaku.',
      'Laporan konten melanggar hukum, penipuan, atau penyalahgunaan dapat disampaikan melalui kontak di bawah. Penyedia akan menindaklanjutinya sesuai kemampuan dan peraturan yang berlaku.',
    ],
  },
  {
    title: 'Keadaan Memaksa',
    body: [
      'Penyedia tidak bertanggung jawab atas kegagalan atau keterlambatan pelaksanaan kewajiban yang disebabkan keadaan di luar kendali wajar, termasuk bencana alam, perang, kerusuhan, pemogokan, pembatasan atau kebijakan pemerintah, gangguan listrik, internet, atau layanan pihak ketiga (misalnya penyedia hosting, basis data, dan penyimpanan), serta serangan siber.',
    ],
  },
  {
    title: 'Data Pribadi',
    body: [
      'Pelindungan data pribadi diatur dalam Kebijakan Privasi yang merupakan bagian tidak terpisah dari ketentuan ini. Terhadap data pribadi Pembeli yang dimasukkan melalui halaman toko Penjual, Penjual bertindak sebagai pengendali data pribadi, dan Penyedia bertindak sebagai prosesor yang memproses data atas nama dan sesuai instruksi Penjual melalui fitur Layanan.',
    ],
  },
  {
    title: 'Perubahan Ketentuan',
    body: [
      'Penyedia dapat mengubah Syarat & Ketentuan ini sewaktu-waktu. Versi terbaru diumumkan di halaman ini dengan tanggal pembaruan. Penggunaan Layanan setelah perubahan berlaku berarti Pengguna menyetujui perubahan tersebut. Bila tidak setuju, Pengguna wajib berhenti memakai Layanan.',
    ],
  },
  {
    title: 'Hukum yang Berlaku dan Penyelesaian Sengketa',
    body: [
      'Ketentuan ini diatur oleh hukum Republik Indonesia. Perselisihan antara Pengguna dan Penyedia diselesaikan terlebih dahulu secara musyawarah untuk mufakat dalam 30 (tiga puluh) hari sejak pemberitahuan tertulis. Bila tidak tercapai kesepakatan, para pihak memilih domisili hukum yang tetap pada Pengadilan Negeri Kuningan, tanpa mengurangi hak konsumen untuk menempuh upaya penyelesaian sengketa melalui Badan Penyelesaian Sengketa Konsumen atau lembaga lain yang diatur peraturan perundang-undangan.',
      'Jika suatu ketentuan dinyatakan tidak sah atau tidak dapat dilaksanakan, ketentuan lainnya tetap berlaku penuh. Tidak dilaksanakannya suatu hak oleh Penyedia bukan merupakan pelepasan hak tersebut.',
    ],
  },
  {
    title: 'Kontak',
    body: [`${P}, ${COMPANY.address}. WhatsApp ${COMPANY.whatsappDisplay}. Email ${COMPANY.email}.`],
  },
]

export default function TermsPage() {
  return (
    <LegalDocument
      title="Syarat & Ketentuan"
      intro={`Dokumen ini mengatur penggunaan ${SITE.name}. Harap dibaca dengan saksama sebelum memakai Layanan.`}
      sections={SECTIONS}
    />
  )
}
