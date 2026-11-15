/** Map Firebase/Firestore error codes to actionable, user-safe messages (code appended for support). */
const HINTS = {
  'permission-denied': 'Akses ditolak oleh aturan Firestore. Pastikan firestore.rules sudah di-deploy ke project Firebase ini.',
  'not-found': 'Database Firestore belum dibuat. Buat database di Firebase Console (Build > Firestore Database).',
  unavailable: 'Tidak bisa terhubung ke Firestore. Periksa internet, pemblokir iklan/privasi, dan pastikan database sudah dibuat.',
  unauthenticated: 'Sesi login tidak valid. Coba keluar lalu masuk lagi.',
  'failed-precondition': 'Firestore menolak permintaan (kemungkinan App Check diwajibkan tetapi belum dikonfigurasi di aplikasi).',
  'resource-exhausted': 'Kuota Firebase terlampaui. Coba lagi nanti.',
}

export function describeFirebaseError(error, fallback = 'Terjadi kesalahan.') {
  const raw = typeof error?.code === 'string' ? error.code : ''
  const code = raw.replace(/^(firestore|storage|auth)\//, '')
  const hint = HINTS[code] ?? fallback
  return raw ? `${hint} (kode: ${raw})` : hint
}
