# Panduan Deploy PO Hub

Urutan ini penting: ikuti dari atas ke bawah. Jangan pernah commit `.env` atau kunci service account.

## 1. Firebase (sekali saja)
1. Buat project Firebase. Aktifkan **Authentication** (metode login yang dipakai aplikasi), **Firestore** (mode production, region `asia-southeast2` Jakarta), (paket gratis Spark cukup; **Firebase Storage tidak dipakai lagi**, gambar ada di Supabase, lihat bagian 1b).
2. Daftarkan **Web app** → salin config ke variabel `VITE_FIREBASE_*` (lihat `.env.example`).
3. **Project settings → Service accounts → Generate new private key** → isi `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
4. Authentication → Settings → **Authorized domains**: tambahkan domain Vercel dan domain kustom `pohub.web.id` (dan `www.pohub.web.id` bila dipakai). Daftarkan juga `pohub.web.id` di pengaturan domain reCAPTCHA/App Check.

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
