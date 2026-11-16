import { STANDART_TIL, type Til } from './tillar'
import { uz, type MatnKaliti } from './matnlar/uz'
import { en } from './matnlar/en'
import { ru } from './matnlar/ru'

export type { MatnKaliti }
export { TILLAR, STANDART_TIL, TIL_KODLARI, tilmi, tilMalumoti, tilPrefiksi } from './tillar'
export type { Til } from './tillar'

const LUGATLAR: Record<Til, Record<MatnKaliti, string>> = { uz, en, ru }

/**
 * Bitta matnni oladi.
 *
 * `{nom}` ko'rinishidagi o'rinlar `qiymatlar` dan to'ldiriladi:
 *   matn('uz', 'salom', { ism: 'Ali' })
 *
 * Tarjima topilmasa o'zbekchasiga qaytadi. Amalda bu holat bo'lmaydi —
 * tiplar buni kompilyatsiya paytida ushlaydi — lekin kutilmagan
 * qiymat kelsa ham foydalanuvchi bo'sh joy ko'rmasligi kerak.
 */
export function matn(
  til: Til,
  kalit: MatnKaliti,
  qiymatlar?: Record<string, string | number>
): string {
  const lugat = LUGATLAR[til] ?? LUGATLAR[STANDART_TIL]
  let natija = lugat[kalit] ?? LUGATLAR[STANDART_TIL][kalit] ?? kalit

  if (qiymatlar) {
    for (const [nom, qiymat] of Object.entries(qiymatlar)) {
      natija = natija.replaceAll(`{${nom}}`, String(qiymat))
    }
  }
  return natija
}

/** Bitta tilga bog'langan qisqa funksiya — komponentlar uchun qulay */
export function tarjimon(til: Til) {
  return (kalit: MatnKaliti, qiymatlar?: Record<string, string | number>) =>
    matn(til, kalit, qiymatlar)
}

export type Tarjimon = ReturnType<typeof tarjimon>
