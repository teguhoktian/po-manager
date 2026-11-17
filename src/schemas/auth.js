import { z } from 'zod'

const email = z.string().trim().toLowerCase().min(1, 'Email wajib diisi').max(254).pipe(z.email('Format email tidak valid'))

const password = z.string().min(8, 'Kata sandi minimal 8 karakter').max(128, 'Kata sandi terlalu panjang')

export const loginSchema = z.object({
  email,
  // Login does not enforce strength rules, only presence.
  password: z.string().min(1, 'Kata sandi wajib diisi').max(128),
})

export const forgotPasswordSchema = z.object({ email })

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(60, 'Nama maksimal 60 karakter'),
    email,
    password,
    confirmPassword: z.string(),
    acceptTerms: z.boolean().refine((v) => v === true, 'Kamu harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi kata sandi tidak cocok',
  })
