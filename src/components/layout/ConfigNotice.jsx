import { SettingsIcon } from 'lucide-react'
import { EmptyState } from '../ui'

/** Shown instead of auth screens when VITE_FIREBASE_* variables are missing. */
export function ConfigNotice() {
  return (
    <EmptyState
      icon={SettingsIcon}
      title="Firebase belum dikonfigurasi"
      description="Salin .env.example menjadi .env, isi nilai VITE_FIREBASE_*, lalu jalankan ulang server dev."
      className="min-h-dvh justify-center"
    />
  )
}
