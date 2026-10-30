/**
 * Muhit o'zgaruvchilari.
 *
 * Funksiya ko'rinishida — shunda `next build` paytida emas, balki
 * haqiqatda ishlatilganda tekshiriladi va xato aniq ko'rinadi.
 */

function talab(nom: string, qiymat: string | undefined): string {
  if (!qiymat) {
    throw new Error(
      `${nom} topilmadi. .env.local faylini to'ldiring (namuna: .env.example).`
    )
  }
  return qiymat
}

export function supabaseUrl(): string {
  return talab(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )
}

export function supabaseAnonKey(): string {
  return talab(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
