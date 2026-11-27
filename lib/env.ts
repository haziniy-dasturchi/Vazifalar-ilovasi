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

/**
 * Google "Web application" turidagi OAuth mijoz ID'si. Bu ID Supabase
 * Auth sozlamalarida ham, native Google kirishda ham ISHLATILADI —
 * shu sababli ikkisi bitta `audience`ga ega bo'ladi va
 * `signInWithIdToken` token'ni qabul qiladi.
 */
export function googleWebClientId(): string {
  return talab(
    'NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID',
    process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID
  )
}

/**
 * Google "iOS" turidagi OAuth mijoz ID'si. Apple Developer hisobi
 * sozlanmaguncha bo'sh qoladi — shuning uchun `talab()` ishlatilmaydi,
 * Android build'i bungasiz ham ishlashi kerak.
 */
export function googleIosClientId(): string | undefined {
  return process.env.NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined
}
