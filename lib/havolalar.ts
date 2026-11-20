/**
 * Oddiy matn ichidan havolalarni topish.
 *
 * Nega qo'lda, kutubxonasiz: bizga faqat ikki narsa kerak — matnni
 * bo'laklarga ajratish va xavfsiz manzilni qaytarish. Tayyor
 * kutubxonalar odatda HTML yasab beradi, bu esa `dangerouslySet…`
 * ni talab qiladi va XSS yo'lini ochadi. Bu yerda HTML umuman
 * yasalmaydi: React o'zi matnni ekranlaydi.
 */

/**
 * `http(s)://…` yoki `www.…` ko'rinishidagi manzillar.
 *
 * Oxiridagi tinish belgilari ataylab havoladan tashqarida qoladi
 * ("sayt.uz/sahifa." dagi nuqta manzilning bir qismi emas).
 */
const HAVOLA = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi

/** Havola oxiridan tushib qoladigan belgilar */
const OXIRGI_BELGILAR = /[.,;:!?)\]}'"»]+$/

export type MatnBolagi =
  | { tur: 'matn'; matn: string }
  | { tur: 'havola'; matn: string; manzil: string }

/**
 * Matnni oddiy bo'laklar va havolalarga ajratadi.
 * Havola topilmasa — bitta matn bo'lagi qaytadi.
 */
export function havolalarniAjrat(matn: string): MatnBolagi[] {
  const natija: MatnBolagi[] = []
  let oxirgi = 0

  for (const moslik of matn.matchAll(HAVOLA)) {
    const boshi = moslik.index ?? 0
    let topilgan = moslik[0]

    // Oxiridagi tinish belgilarini havoladan chiqarib tashlaymiz
    const ortiqcha = topilgan.match(OXIRGI_BELGILAR)?.[0] ?? ''
    if (ortiqcha) topilgan = topilgan.slice(0, -ortiqcha.length)
    if (!topilgan) continue

    if (boshi > oxirgi) {
      natija.push({ tur: 'matn', matn: matn.slice(oxirgi, boshi) })
    }

    natija.push({
      tur: 'havola',
      matn: topilgan,
      // `www.` bilan boshlangan manzilga protokol qo'shiladi, aks
      // holda brauzer uni joriy sahifaga nisbatan yo'l deb o'qiydi
      manzil: topilgan.startsWith('www.') ? `https://${topilgan}` : topilgan,
    })

    oxirgi = boshi + topilgan.length
  }

  if (oxirgi < matn.length) {
    natija.push({ tur: 'matn', matn: matn.slice(oxirgi) })
  }

  return natija
}
