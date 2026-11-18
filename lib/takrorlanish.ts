import type { MatnKaliti, Tarjimon } from '@/lib/i18n'
import type { OddiyTakrorlanish, Recurrence } from '@/types/vazifalar'

/**
 * Takrorlanish qiymati bilan ishlash.
 *
 * Qiymat shakllari:
 *   'daily' | 'weekdays' | 'weekly' | 'monthly'  — tayyor variantlar
 *   'days:2,3,4'                                 — tanlangan kunlar
 *
 * Kunlar ISO tartibida: 1 = dushanba ... 7 = yakshanba. Aynan shu
 * tartib Postgres'dagi `extract(isodow)` bilan bir xil, shuning uchun
 * mijoz va server bir xil raqamlarni tushunadi.
 */

export const DUSHANBA = 1
export const YAKSHANBA = 7

/** `days:` shaklidagi qiymatmi */
export function kunlarTakrorlanishimi(r: Recurrence | null): boolean {
  return typeof r === 'string' && r.startsWith('days:')
}

/**
 * Qiymatdan kun raqamlarini ajratib oladi.
 * Shakl noto'g'ri bo'lsa bo'sh massiv — chaqiruvchi tekshirishi shart emas.
 */
export function takrorKunlari(r: Recurrence | null): number[] {
  if (!kunlarTakrorlanishimi(r)) return []
  return (r as string)
    .slice('days:'.length)
    .split(',')
    .map((q) => Number.parseInt(q, 10))
    .filter((n) => Number.isInteger(n) && n >= DUSHANBA && n <= YAKSHANBA)
}

/**
 * Kunlar ro'yxatidan qiymat yasaydi.
 *
 * Takrorlar olib tashlanadi va tartiblanadi: `days:4,2,2,3` va
 * `days:2,3,4` bir xil jadval, lekin matn sifatida boshqacha
 * bo'lsa, taqqoslash va bazadagi tekshiruv chalkashardi.
 * Bo'sh ro'yxat — takrorlanish yo'q degani.
 */
export function kunlardanTakrorlanish(kunlar: number[]): Recurrence | null {
  const toza = [...new Set(kunlar)]
    .filter((n) => Number.isInteger(n) && n >= DUSHANBA && n <= YAKSHANBA)
    .sort((a, b) => a - b)
  if (toza.length === 0) return null
  return `days:${toza.join(',')}`
}

/**
 * Tanlangan kunlar aslida tayyor variantga teng bo'lsa, o'shanisini
 * qaytaradi: "hamma kun" = `daily`, "du-ju" = `weekdays`.
 *
 * Nega kerak: ikki xil qiymat bir xil jadvalni anglatsa, vazifa
 * qatorida goh "Har kuni", goh "Du, Se, Chor, Pay, Ju, Sha, Yak" deb
 * yozilardi — foydalanuvchi uchun bu tushunarsiz tafovut.
 */
export function soddalashtir(r: Recurrence | null): Recurrence | null {
  const kunlar = takrorKunlari(r)
  if (kunlar.length === 0) return r
  const matn = kunlar.join(',')
  if (matn === '1,2,3,4,5,6,7') return 'daily'
  if (matn === '1,2,3,4,5') return 'weekdays'
  return r
}

const ODDIY_KALIT: Record<OddiyTakrorlanish, MatnKaliti> = {
  daily: 'sana.harKuni',
  weekdays: 'sana.ishKunlari',
  weekly: 'sana.harHafta',
  monthly: 'sana.harOy',
}

/**
 * Takrorlanishning o'qiladigan matni: "Har kuni" yoki "Se, Chor, Pay".
 *
 * Tanlangan kunlar uchun qisqartmalar sanab o'tiladi — shunda
 * foydalanuvchi vazifa qatorida ham, tugmada ham qanday jadval
 * qo'yganini ochmasdan ko'radi.
 */
export function takrorMatni(r: Recurrence | null, t: Tarjimon): string {
  if (!r) return ''
  const kunlar = takrorKunlari(r)
  if (kunlar.length > 0) {
    return kunlar.map((k) => t(`kun.${k}.qisqa` as MatnKaliti)).join(', ')
  }
  return t(ODDIY_KALIT[r as OddiyTakrorlanish] ?? 'sana.takrorlanish')
}
