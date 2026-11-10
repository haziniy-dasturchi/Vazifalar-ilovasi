/**
 * Digital Asset Links — Android ilovasini shu domen bilan bog'laydi.
 *
 * Play Market'dagi ilova TWA (Trusted Web Activity) bo'ladi: ichida
 * aynan shu sayt ochiladi. Android ilovani ishga tushirganda shu
 * faylni o'qiydi va imzo barmoq izini solishtiradi. Mos kelmasa,
 * ilova yuqorida brauzer manzil satrini ko'rsatadi — ya'ni "ilova"
 * emas, oddiy brauzer bo'lib qoladi.
 *
 * Barmoq izi ilova imzolanganda paydo bo'ladi. Google Play App
 * Signing ishlatilsa (tavsiya etiladi), Play Console o'zi kalit
 * yaratadi va SHA-256 ni "Setup -> App integrity" bo'limida
 * ko'rsatadi. O'sha qiymatni ANDROID_SHA256 muhit o'zgaruvchisiga
 * yozish kerak.
 *
 * Bir nechta barmoq izi bo'lishi mumkin (masalan, Play'niki va
 * mahalliy sinov kalitiniki) — vergul bilan ajratiladi.
 */

const PAKET_NOMI = process.env.ANDROID_PAKET ?? 'uz.samaralikun.samara'

export const dynamic = 'force-static'

export function GET() {
  const barmoqIzlari = (process.env.ANDROID_SHA256 ?? '')
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)

  const javob =
    barmoqIzlari.length === 0
      ? []
      : [
          {
            relation: ['delegate_permission/common.handle_all_urls'],
            target: {
              namespace: 'android_app',
              package_name: PAKET_NOMI,
              sha256_cert_fingerprints: barmoqIzlari,
            },
          },
        ]

  return new Response(JSON.stringify(javob, null, 2), {
    headers: {
      'content-type': 'application/json',
      // Barmoq izi o'zgarsa tez yoyilsin
      'cache-control': 'public, max-age=3600',
    },
  })
}
