import { createClient } from '@/lib/supabase/client'
import { googleIosClientId, googleWebClientId } from '@/lib/env'

/**
 * Dinamik import — bu plugin Capacitor native runtime'ga tayanadi va
 * faqat appda chaqiriladi. Yuqorida statik import qilinsa, veb
 * bundle'iga kerak bo'lmagan kod qo'shilib, yuklama hajmini
 * oshiradi (sinovda +12 kB `/kirish` sahifasida aniqlandi).
 */
async function socialLoginYukla() {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  return SocialLogin
}

let tayyorlanganVada: Promise<void> | null = null

function tayyorla(): Promise<void> {
  if (!tayyorlanganVada) {
    tayyorlanganVada = socialLoginYukla().then((SocialLogin) =>
      SocialLogin.initialize({
        google: {
          webClientId: googleWebClientId(),
          iOSClientId: googleIosClientId(),
          // "offline" rejimi serverAuthCode talab qiladi — bizga shart
          // emas, Supabase faqat idToken'ni ko'radi
          mode: 'online',
        },
      })
    )
  }
  return tayyorlanganVada
}

async function tasodifiyNonce(): Promise<string> {
  const baytlar = new Uint8Array(16)
  crypto.getRandomValues(baytlar)
  return Array.from(baytlar, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(matn: string): Promise<string> {
  const kodlangan = new TextEncoder().encode(matn)
  const xash = await crypto.subtle.digest('SHA-256', kodlangan)
  return Array.from(new Uint8Array(xash), (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Native Google bilan kirish (Android/iOS, WebView emas).
 *
 * Nonce IKKI shaklda ishlatiladi, bu Supabase'ning rasmiy talabi:
 *   - Google'ga XASHLANGAN (SHA-256) qiymat beriladi — shu ID token
 *     ichiga "nonce" da'vo (claim) sifatida yoziladi;
 *   - Supabase'ga esa XOM qiymat beriladi — u token ichidagi claim'ni
 *     qayta xashlab solishtiradi. Ikkisi teng kelmasa, token rad etiladi.
 * Shunday qilib so'rov aynan shu kirish urinishi uchun ekani
 * tasdiqlanadi (replay hujumidan himoya).
 */
export async function googleBilanNativeKirish(): Promise<void> {
  await tayyorla()
  const SocialLogin = await socialLoginYukla()

  const xomNonce = await tasodifiyNonce()
  const xashlanganNonce = await sha256Hex(xomNonce)

  const natija = await SocialLogin.login({
    provider: 'google',
    options: { nonce: xashlanganNonce },
  })

  // `mode: 'online'` berilgan, shuning uchun natija shu turda bo'lishi
  // kerak — lekin TypeScript buni runtime qiymatdan bilolmaydi
  if (natija.result.responseType !== 'online') {
    throw new Error('Google kirish kutilmagan javob qaytardi')
  }
  const idToken = natija.result.idToken
  if (!idToken) throw new Error('Google idToken qaytarmadi')

  const { error } = await createClient().auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
    nonce: xomNonce,
  })
  if (error) throw error
}
