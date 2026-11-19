# Panduan Deploy PO Hub

Urutan ini penting: ikuti dari atas ke bawah. Jangan pernah commit `.env` atau kunci service account.

## 1. Firebase (sekali saja)
1. Buat project Firebase. Aktifkan **Authentication** (metode login yang dipakai aplikasi), **Firestore** (mode production, region `asia-southeast2` Jakarta), (paket gratis Spark cukup; **Firebase Storage tidak dipakai lagi**, gambar ada di Supabase, lihat bagian 1b).
2. Daftarkan **Web app** → salin config ke variabel `VITE_FIREBASE_*` (lihat `.env.example`).
3. **Project settings → Service accounts → Generate new private key** → isi `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
4. Authentication → Settings → **Authorized domains**: tambahkan domain Vercel dan domain kustom `pohub.web.id` (dan `www.pohub.web.id` bila dipakai). Daftarkan juga `pohub.web.id` di pengaturan domain reCAPTCHA/App Check.

## 1a. Metode login dan email reset kata sandi
1. Authentication → Sign-in method → aktifkan **Email/Password**.
2. Aktifkan juga **Google**: pilih Google, ketuk Enable, isi *Project support email*, simpan. Tanpa ini tombol "Masuk dengan Google" menampilkan pesan bahwa Google belum diaktifkan.
3. Login Google memakai jendela pop-up ke domain di `VITE_FIREBASE_AUTH_DOMAIN`. Domain aplikasi (`pohub.web.id`) wajib ada di **Authorized domains** (langkah 4 di atas), kalau tidak muncul pesan "Domain ini belum diizinkan".
4. Authentication → Templates → **Password reset**: ubah bahasa ke Indonesia dan sesuaikan nama pengirim/subjek bila mau. Email reset dikirim Firebase dari alamat bawaan proyek (`noreply@<project>.firebaseapp.com`); cek folder spam saat mencoba pertama kali.
5. Halaman `/lupa-password` mengirim email lewat Firebase. Tidak ada endpoint server tambahan dan jumlah fungsi Vercel tetap 9/12.
6. Content-Security-Policy di `vercel.json` sudah mengizinkan `https://apis.google.com` (skrip yang dibutuhkan login pop-up Google). Jangan dihapus.

## 1c. SEO dan Google Search Console
Perintah `npm run build` sekarang juga membuat HTML statis untuk halaman publik (beranda, cara pakai, kontak, syarat, privasi), `sitemap.xml`, `404.html`, dan `app.html` (cangkang aplikasi untuk login, dashboard, dan halaman toko). Pengaturan Vercel tidak perlu diubah: build command bawaan memakai `npm run build`, output `dist`.
1. Di Vercel → Domains, tambahkan `pohub.web.id` **dan** `www.pohub.web.id`. Aturan di `vercel.json` mengalihkan `www` ke `pohub.web.id` secara permanen.
2. Buka search.google.com/search-console → tambah properti **Domain** `pohub.web.id` → verifikasi lewat DNS TXT.
3. Sitemaps → kirim `https://pohub.web.id/sitemap.xml`.
4. URL Inspection → periksa `https://pohub.web.id/` → **Request indexing**. Ulangi untuk `/cara-pakai`.
5. Setelah deploy, cek pratinjau link di WhatsApp dengan mengirim `https://pohub.web.id` ke diri sendiri. Kalau pratinjau lama masih muncul, itu cache WhatsApp; coba lagi nanti atau tambahkan `?v=2` ke link untuk pengujian.
6. Halaman toko (`/po/...`), dashboard, dan API sengaja tidak diindeks (`robots.txt`). Halaman login, daftar, dan cek pesanan memakai `noindex`.
7. Menambah halaman publik baru: daftarkan di `SEO_PAGES` (`src/config/seo.js`) supaya ikut diprerender dan masuk sitemap, dan tambahkan rute statisnya jika bukan halaman publik biasa (lihat `rewrites` di `vercel.json`).

## 1b. Supabase Storage (gambar, sekali saja)
1. Buat project di supabase.com (paket gratis, tanpa kartu). Catat **Project URL** (`https://xxxx.supabase.co`).
2. Storage → **New bucket**, buat dua bucket dengan nama persis:
   - `po-public` → centang **Public bucket** (logo toko dan foto produk).
   - `po-private` → **jangan** dipublikkan (bukti pembayaran; hanya diakses lewat link bertanda tangan 5 menit dari server).
3. Project Settings → API → salin **service_role key** (rahasia, melewati semua aturan akses) → isi `SUPABASE_SERVICE_ROLE_KEY` hanya di Vercel dan `.env` lokal. Isi `SUPABASE_URL` dan `VITE_SUPABASE_URL` dengan Project URL yang sama.
4. Uji koneksi dari komputermu: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/storageSmoke.mjs` (unggah, buat link bertanda tangan, hapus). Harus mencetak `OK`.
5. Catatan paket gratis Supabase: project dijeda otomatis bila tidak ada aktivitas sekitar seminggu (data aman, tinggal diaktifkan lagi dari dashboard), dan ada batas ruang simpan. Cek halaman harga Supabase untuk angka terbarunya.

## 2. Uji rules (di komputermu, butuh Java)
```
npm ci
npm run test:rules
```
Tes ini belum pernah dijalankan di lingkungan pengembangan (emulator tidak bisa diunduh di sana). **Semua tes harus lolos sebelum deploy.**

## 3. Deploy rules dan index
```
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <id-project>
```

## 4. Firestore TTL (hapus data sementara otomatis)
Console → Firestore → **TTL** → buat dua kebijakan, field `expiresAt`:
- collection group `idempotency_keys`
- collection group `rate_limits`

## 5. Vercel
1. Import repo, framework **Vite** (build `npm run build`, output `dist`).
2. Isi semua variabel di `.env.example`. `CRON_SECRET` = string acak (`openssl rand -hex 32`).
   Tanpa `CRON_SECRET`, endpoint cron menolak semua panggilan.
3. Batas paket Hobby: 12 fungsi (sekarang 8, cek dengan `npm run check:functions`) dan cron **sekali sehari**.
   `vercel.json` menjadwalkan `/api/cron/po-sweep` pukul 17:00 UTC (00:00 WIB). Cron hanya merapikan status PO di database. Pembeli selalu melihat status yang benar
   (buka/tutup menurut jadwal dihitung saat halaman dan checkout diakses), jadi jeda sampai 24 jam tidak berdampak pada pesanan.

## 6. App Check (urutan penting)
1. Firebase console → App Check → daftarkan web app dengan **reCAPTCHA v3** → isi `VITE_FIREBASE_APPCHECK_SITE_KEY`. Deploy ulang.
2. Buka beberapa halaman dashboard, lalu cek App Check → **Metrics**: permintaan Firestore harus berstatus *verified*.
3. Baru aktifkan **Enforce** untuk Firestore, dan set `APPCHECK_ENFORCE=true` di Vercel (API bertoken login ikut memeriksa App Check).
4. Halaman publik (toko, PO, checkout) sengaja tidak memuat Firebase di browser, jadi tidak memakai App Check. Perlindungannya: batas permintaan per IP/WhatsApp, kolom jebakan (honeypot), validasi ketat, dan cache CDN 15 detik untuk data publik.

## 7. Uji asap setelah deploy
- Daftar, buat toko, buat produk **dengan foto** (cek di Supabase → Storage → `po-public` bahwa file berformat WebP berukuran ≲200 KB).
- Buat PO, publikasikan, buka link publik di HP, checkout, unggah bukti bayar.
- Verifikasi pembayaran, proses → kirim → selesai, lalu lihat Laporan.
- Panggil cron tanpa header → harus 401: `curl -i https://<domain>/api/cron/po-sweep`.
- Cek Vercel → Logs tidak ada error, dan Firebase → Usage (reads) dan Supabase → Storage wajar.

## 8. Batasan yang diketahui
- Laporan dihitung di browser (maks. 500 pesanan dan 2000 baris per PO).
- Pembeli tidak mendapat notifikasi otomatis; penjual memakai tombol WhatsApp (click-to-chat).

## Menambah artikel

1. Buat file baru di `content/articles/`, misalnya `judul-artikel.md`. Nama file menjadi alamat: `/artikel/judul-artikel`.
2. Awali dengan frontmatter:

```
---
title: Judul artikel (usahakan di bawah 60 karakter)
description: Ringkasan satu kalimat, maksimal 160 karakter.
date: 2026-11-19
urutan: 6
---
```

3. Tulis isinya dengan Markdown (`##` untuk subjudul, tabel, daftar, tautan). Jangan pakai `#`, karena judul sudah dibuat dari `title`.
4. Commit dan push. Halaman, sitemap, dan data terstruktur dibuat otomatis saat build. Setelah live, kirim URL baru lewat Inspeksi URL di Search Console.
