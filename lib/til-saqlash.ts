import { STANDART_TIL, tilmi, type Til } from './i18n'

/**
 * Interfeys tilini qurilmada saqlash.
 *
 * Nega localStorage, faqat baza emas:
 *  - Til darhol almashishi kerak. Bazaga yozish tarmoqqa bog'liq —
 *    internet sekin bo'lsa, odam tugmani bosib, hech narsa
 *    o'zgarmayotganini ko'rib turadi.
 *  - Baza ustuni bo'lmasa ham (migratsiya hali qo'llanmagan bo'lishi
 *    mumkin) ilova ishlayverishi kerak. Avval til faqat
 *    `profiles.lang` ga yozilardi va ustun yo'qligi sababli tanlov
 *    umuman saqlanmasdi — foydalanuvchi "Saqlab bo'lmadi" xatosini
 *    ko'rardi, sababini bilmay.
 *
 * Baza esa qurilmalar orasida sinxronlash uchun: ustun mavjud bo'lsa,
 * tanlov u yerga ham yoziladi va boshqa qurilmada o'sha til ochiladi.
 */

export const TIL_KALITI = 'samara-til'

const tinglovchilar = new Set<() => void>()

export function tilniOqi(): Til | null {
  if (typeof window === 'undefined') return null
  try {
    const q = window.localStorage.getItem(TIL_KALITI)
    return tilmi(q) ? q : null
  } catch {
    // Maxfiy rejimda localStorage taqiqlangan bo'lishi mumkin
    return null
  }
}

export function tilniSaqla(til: Til) {
  try {
    window.localStorage.setItem(TIL_KALITI, til)
  } catch {
    // Saqlay olmasak ham joriy sessiyada ishlayversin
  }
  tinglovchilar.forEach((fn) => fn())
}

export function tilgaObuna(fn: () => void) {
  tinglovchilar.add(fn)
  return () => {
    tinglovchilar.delete(fn)
  }
}

/** `useSyncExternalStore` serverda shu qiymatni oladi */
export function serverTili(): Til {
  return STANDART_TIL
}
