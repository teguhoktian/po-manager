# PO Hub

SaaS pre-order (PO) untuk penjual individu via WhatsApp Group. React + Vite + Tailwind, Firebase, Vercel.

## Status
Phase 01 (fondasi UI), Phase 02 (Firebase Auth + API token), Phase 03 (Firestore/Storage rules, skema), Phase 04 (Store Management: buat toko, slug unik, profil, logo, link), Phase 05 (Product Management: produk, varian, gambar, arsip), Phase 06 (PO Management: draf, produk dalam PO, jadwal/kuota/DP, publikasi dan transisi status via server), Phase 07 (halaman pemesanan publik: `/po/:toko` dan `/po/:toko/:po`, keranjang, ringkasan DP),  Phase 08 (checkout: order dibuat server dalam satu transaksi, anti-oversell kuota/stok, idempotensi, rate limit, nomor order, konfirmasi WhatsApp), Phase 09 (manajemen pesanan: daftar, filter, cari, detail, batalkan dengan pengembalian stok/kuota, buka kembali PO), Phase 10 (pembayaran: info bayar toko, link pesanan pembeli, unggah bukti transfer, verifikasi/tolak, catat manual, refund saat batal).

## Menjalankan

```bash
npm install
cp .env.example .env     # isi nilai VITE_FIREBASE_* (Firebase Console > Project settings > Web app)
npm run dev              # http://localhost:5173
```

Tanpa `.env`, aplikasi menampilkan pesan "Firebase belum dikonfigurasi" pada halaman login/dashboard.

### Endpoint server (`/api/*`)
`npm run dev` sudah ikut melayani folder `api/` (plugin dev di `scripts/devApiPlugin.js`), jadi tidak perlu Vercel CLI.
Isi variabel server di `.env` agar endpoint bisa memverifikasi token dan menulis ke Firestore:

```
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...      # dari service account (Firebase Console > Project settings > Service accounts)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
SUPABASE_URL=...               # Project URL Supabase (gambar disimpan di Supabase Storage)
SUPABASE_SERVICE_ROLE_KEY=...  # rahasia, hanya di server/Vercel (lihat DEPLOY.md bagian 1b)
VITE_SUPABASE_URL=...          # nilai yang sama dengan SUPABASE_URL (publik)
```

Restart `npm run dev` setelah mengubah `.env`. Di produksi, isi variabel yang sama di Vercel (Project > Settings > Environment Variables).

### Setup Firebase
1. Aktifkan Authentication > Email/Password dan Google (lihat DEPLOY.md bagian 1a).
2. Tambahkan domain lokal/Vercel ke Authorized domains.
3. Buat Firestore, lalu deploy rules dan indeks:
   `npx firebase-tools deploy --only firestore:rules,firestore:indexes`
   Gambar memakai Supabase Storage: buat bucket `po-public` (publik) dan `po-private` (privat), lihat DEPLOY.md bagian 1b.
4. (Opsional) Daftarkan App Check (reCAPTCHA v3) dan isi `VITE_FIREBASE_APPCHECK_SITE_KEY`.

## Perintah
| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run lint` | Lint |
| `npm run test:rules` | Test security rules (butuh Java dan internet untuk emulator) |

Dokumentasi keamanan: `FIRESTORE_SECURITY_RULES.md`.

## Fase 11: Fulfillment

- Alur: PENDING → PROCESSING → PACKED → SHIPPED → COMPLETED (boleh mundur satu langkah, kecuali dari COMPLETED).
- Gerbang pembayaran (server): proses/kemas butuh DP atau lunas terverifikasi; kirim/selesai butuh LUNAS; pesanan harus ACTIVE.
- Kirim wajib data kurir (resi opsional), disimpan di `shipments/{orderId}` (hanya ditulis server). Pembeli melihat kurir + resi lewat `/api/public/order` setelah dikirim (catatan internal tidak ikut).
- PO baru bisa `complete` bila semua pesanan aktif sudah COMPLETED.
- Endpoint: `POST /api/orders/{fulfillment|fulfillment-bulk|shipment}`. Bulk maks 50 pesanan, hasil per pesanan.
- Fungsi Vercel digabung via `api/<grup>/[action].js` (7 dari 12 fungsi). Cek: `npm run check:functions`.

## Fase 12: Ringkasan, Pembayaran, Pengiriman, Laporan

- Ringkasan: statistik nyata (PO dibuka, pesanan aktif, penjualan, belum dibayar), daftar "perlu ditindaklanjuti", pesanan terbaru. Di layar kecil ada pintasan ke Pembayaran/Pengiriman/Laporan.
- Pembayaran (`/dashboard/payments`): bukti bayar yang perlu dicek + pesanan belum lunas. Verifikasi tetap di detail pesanan.
- Pengiriman (`/dashboard/fulfillment`): daftar pesanan per tahap (perlu diproses → selesai) dengan proses massal.
- Laporan (`/dashboard/reports`): per PO — pesanan aktif, barang, omzet, terbayar, belum dibayar, laba kotor (omzet − modal tersimpan di baris pesanan), rincian per produk/varian. Pesanan dibatalkan tidak dihitung. Dihitung di browser dari dokumen yang dibaca lewat rules (hanya milik sendiri); tanpa endpoint atau index baru.

## Fase 13: Hardening dan rilis

- Foto produk dan logo dikecilkan di browser (WebP, sisi terpanjang 1200/400 px, target ~200/60 KB) dan diunggah lewat `PUT /api/files` (server memeriksa pemilik path, isi file, dan ukuran sebelum menyimpan ke Supabase) dengan `cache-control` setahun. Bukti bayar disimpan di bucket privat dan dibuka lewat link bertanda tangan 5 menit.
- Cron harian `/api/cron/po-sweep` (dilindungi `CRON_SECRET`) membuka PO terjadwal dan menutup PO yang lewat batas waktu; audit oleh `system`.
- Panduan lengkap deploy, App Check, TTL, dan uji asap: lihat `DEPLOY.md`.

## Penyegaran UI

- Palet hijau `#16a34a` (token `brand-*` di `src/index.css`), latar `canvas` kehijauan, font Plus Jakarta Sans (di-host sendiri lewat `@fontsource`, tanpa permintaan ke pihak luar), kartu lebih membulat dengan bayangan hijau lembut.
- Halaman depan baru (contoh pengumuman PO di grup + nota pesanan), banner toko di Ringkasan, kartu statistik berwarna, bottom nav dengan penanda aktif, toko publik dengan header hijau, stepper bulat, dan keranjang melayang.
- Hanya tampilan: alur, teks tombol, dan logika tidak berubah.

## Pembaruan 15 Nov 2026
- Link toko otomatis `nama-toko-kode` (4 karakter acak) agar tidak bentrok; toko lama tetap memakai slug lama.
- `/cek`: pembeli melacak pesanan dengan kode pesanan + nomor WhatsApp (read-only; endpoint `POST /api/public/track`, rate limit per IP dan per kode).
- Halaman `/syarat-ketentuan`, `/kebijakan-privasi`, `/kontak`; data perusahaan di `src/config/site.js`. Draf hukum perlu ditinjau advokat.
- Checkbox persetujuan di pendaftaran; teks persetujuan di checkout.
- Jarak atas/bawah storefront dan tombol modal diperbaiki (safe-area).
- Animasi: transisi halaman, bottom sheet/dialog masuk-keluar (mengikuti prefers-reduced-motion).
