import { COMPANY, SITE } from '../../../config/site'
import { LegalDocument } from './LegalDocument'

const SECTIONS = [
  {
    title: 'Siapa Kami dan Peran Kami',
    body: [
      `${COMPANY.name} ("Kami"), beralamat di ${COMPANY.address}, mengoperasikan ${SITE.name}. Kebijakan ini menjelaskan bagaimana data pribadi diproses sesuai Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), Undang-Undang Informasi dan Transaksi Elektronik, dan peraturan pelaksanaannya.`,
      { list: [
        'Untuk data akun dan toko Penjual, Kami bertindak sebagai pengendali data pribadi.',
        'Untuk data Pembeli yang dimasukkan lewat halaman toko atau PO milik Penjual, Penjual adalah pengendali data pribadi, dan Kami adalah prosesor yang menyimpan serta memprosesnya atas nama Penjual melalui Layanan.',
      ] },
    ],
  },
  {
    title: 'Data yang Kami Proses',
    body: [
      { list: [
        'Data Penjual: nama, alamat email, kata sandi (disimpan terenkripsi/di-hash oleh penyedia autentikasi, tidak pernah terbaca oleh Kami), pengenal akun, serta data toko (nama toko, deskripsi, nomor WhatsApp, logo, informasi pembayaran yang Penjual tulis sendiri).',
        'Data usaha Penjual: produk, foto produk, harga, PO, pesanan, pembayaran, resi pengiriman, dan laporan yang dihasilkan.',
        'Data Pembeli (diisi Pembeli): nama penerima, nomor WhatsApp, alamat lengkap, isi pesanan, dan bukti pembayaran (gambar) yang diunggah.',
        'Data teknis: alamat IP (disimpan dalam bentuk hash untuk pembatasan permintaan dan pencegahan penyalahgunaan), waktu akses, jenis peramban/perangkat, token App Check/reCAPTCHA, dan catatan aktivitas (log audit) pada tindakan penting seperti perubahan status pesanan.',
        'Data penyimpanan lokal di perangkat: sesi masuk Penjual, serta ringkasan pesanan dan tautan rahasia pesanan yang disimpan sementara di peramban Pembeli agar dapat membuka kembali halaman pesanan.',
      ] },
      'Kami tidak sengaja mengumpulkan data pribadi yang bersifat spesifik (misalnya kesehatan, biometrik, atau catatan kejahatan). Mohon tidak memasukkan data semacam itu ke kolom catatan atau deskripsi.',
    ],
  },
  {
    title: 'Tujuan Pemrosesan',
    body: [
      { list: [
        'menyediakan dan mengoperasikan Layanan: membuat akun, toko, PO, menerima dan mengelola pesanan, pembayaran, serta pengiriman;',
        'menampilkan status pesanan kepada Pembeli dan menghubungkan Pembeli dengan Penjual;',
        'menjaga keamanan, mencegah penipuan, spam, dan penyalahgunaan, serta menegakkan Syarat & Ketentuan;',
        'memperbaiki, memelihara, dan mengukur kinerja Layanan;',
        'memenuhi kewajiban hukum dan menanggapi permintaan aparat atau instansi yang berwenang sesuai hukum;',
        'berkomunikasi dengan Penjual terkait Layanan, keamanan, atau perubahan ketentuan.',
      ] },
      'Dasar pemrosesan Kami adalah persetujuan Anda, pelaksanaan perjanjian dengan Anda, pemenuhan kewajiban hukum, dan kepentingan sah Kami yang tidak mengesampingkan hak Anda.',
    ],
  },
  {
    title: 'Dengan Siapa Data Dibagikan',
    body: [
      { list: [
        'Penjual: Pembeli memahami bahwa nama, nomor WhatsApp, alamat, dan isi pesanan diberikan kepada Penjual tempat ia memesan agar pesanan dapat diproses. Penjual bertanggung jawab atas penggunaan data tersebut.',
        'Penyedia infrastruktur: Kami memakai layanan pihak ketiga untuk autentikasi, basis data, penyimpanan berkas, hosting, dan perlindungan dari bot, antara lain Google Firebase/Google Cloud, Google reCAPTCHA, dan Vercel. Mereka memproses data atas nama Kami berdasarkan perjanjian dan ketentuan keamanannya.',
        'Aparat dan instansi berwenang bila diwajibkan peraturan perundang-undangan atau putusan pengadilan.',
        'Pihak lain dalam hal penggabungan, akuisisi, atau pengalihan usaha, dengan tetap menjaga pelindungan data Anda.',
      ] },
      'Kami tidak menjual data pribadi dan tidak memakainya untuk iklan.',
    ],
  },
  {
    title: 'Transfer Data ke Luar Wilayah Indonesia',
    body: [
      'Penyedia infrastruktur Kami dapat menyimpan atau memproses data di server di luar Indonesia. Kami berupaya memastikan penerima memiliki tingkat pelindungan data yang setara atau lebih tinggi, atau menerapkan perlindungan yang memadai sesuai UU PDP. Dengan memakai Layanan, Anda menyetujui transfer tersebut.',
    ],
  },
  {
    title: 'Penyimpanan dan Penghapusan',
    body: [
      'Data disimpan selama diperlukan untuk tujuan di atas, selama akun Penjual aktif, dan selama diwajibkan hukum (misalnya untuk keperluan pembukuan, perpajakan, atau penyelesaian sengketa). Data pembatasan permintaan dan token sementara dihapus otomatis dalam waktu singkat.',
      'Setelah akun dihapus atau tujuan tercapai, Kami menghapus atau menganonimkan data dalam jangka waktu yang wajar, kecuali penyimpanan lebih lama diwajibkan hukum atau dibutuhkan untuk membela hak Kami. Salinan cadangan dapat bertahan sampai siklus penghapusannya selesai.',
    ],
  },
  {
    title: 'Keamanan',
    body: [
      'Kami menerapkan langkah teknis dan organisasi yang wajar: koneksi terenkripsi (HTTPS), aturan akses data per Penjual, verifikasi identitas pada setiap permintaan, tautan pesanan Pembeli yang rahasia dan hanya disimpan dalam bentuk hash, pembatasan permintaan, serta pencatatan aktivitas penting. Tidak ada sistem yang sepenuhnya bebas risiko; Pengguna ikut menjaga kerahasiaan kata sandi dan tautan pesanan.',
      'Bila terjadi kegagalan pelindungan data pribadi yang berdampak signifikan, Kami akan memberi tahu pihak terdampak dan lembaga yang berwenang sesuai ketentuan UU PDP.',
    ],
  },
  {
    title: 'Hak Anda sebagai Subjek Data',
    body: [
      'Sesuai UU PDP, Anda berhak untuk: mendapat informasi tentang pemrosesan data Anda; mengakses dan memperoleh salinan data; melengkapi atau memperbarui data; menghapus atau mengakhiri pemrosesan; menarik persetujuan; mengajukan keberatan atas pemrosesan otomatis tertentu; serta menggugat dan menerima ganti rugi atas pelanggaran sesuai ketentuan hukum.',
      `Permintaan dapat diajukan melalui ${COMPANY.email} atau WhatsApp ${COMPANY.whatsappDisplay} dengan menyertakan identitas yang cukup untuk verifikasi. Untuk data Pembeli, Kami dapat meneruskan permintaan kepada Penjual selaku pengendali data. Hak dapat dibatasi sejauh diizinkan hukum (misalnya untuk kepentingan penegakan hukum atau kewajiban retensi).`,
      'Penarikan persetujuan tidak berlaku surut dan dapat berarti Layanan tidak dapat dipakai lagi.',
    ],
  },
  {
    title: 'Cookie dan Penyimpanan Peramban',
    body: [
      'Kami tidak memakai cookie iklan atau pelacak lintas situs. Layanan memakai penyimpanan peramban untuk menjaga sesi masuk Penjual dan kenyamanan Pembeli. Layanan perlindungan bot dari Google (reCAPTCHA/App Check) dapat menyimpan cookie atau pengenal teknis sesuai kebijakan Google. Anda dapat menghapus data peramban kapan saja; sesi Penjual akan berakhir.',
    ],
  },
  {
    title: 'Anak-Anak',
    body: [
      'Layanan ditujukan bagi pengguna dewasa. Pembeli di bawah usia dewasa sebaiknya memesan dengan pendampingan orang tua atau wali. Kami tidak dengan sengaja mengumpulkan data anak tanpa persetujuan orang tua atau wali; hubungi Kami bila Anda yakin hal itu terjadi agar data dapat dihapus.',
    ],
  },
  {
    title: 'Perubahan Kebijakan',
    body: [
      'Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru dan tanggal pembaruannya selalu tersedia di halaman ini. Untuk perubahan yang material, Kami akan memberi pemberitahuan melalui Layanan.',
    ],
  },
  {
    title: 'Kontak',
    body: [`${COMPANY.name}, ${COMPANY.address}. WhatsApp ${COMPANY.whatsappDisplay}. Email ${COMPANY.email}.`],
  },
]

export default function PrivacyPage() {
  return <LegalDocument title="Kebijakan Privasi" intro={`Kebijakan ini menjelaskan data apa yang dikumpulkan ${SITE.name}, untuk apa, dan hak yang Anda miliki.`} sections={SECTIONS} />
}
