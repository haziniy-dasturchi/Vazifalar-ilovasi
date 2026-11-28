/**
 * "Loyihani qo'llab-quvvatlash" sahifasidagi o'zgaruvchan ma'lumotlar.
 *
 * Hammasi shu yerda — narx o'zgarsa yoki yangi to'lov usuli
 * qo'shilsa, sahifa kodiga tegmasdan shu faylni tahrirlash kifoya.
 *
 * TASDIQLANSIN: pastdagi summalar TAXMINIY (dollar ~12 800 so'm
 * hisobida). Haqiqiy to'lovlaringizga moslab yangilang — odamlar
 * bu raqamlarga ishonadi, shuning uchun ular rost bo'lishi shart.
 */

export type Xarajat = {
  /** Odam tushunadigan nom: "Server", "Domen" */
  nom: string
  /** Bu nima uchun kerak — texnik so'zlarsiz */
  izoh: string
  /** So'mda */
  summa: number
  davr: 'oy' | 'yil' | 'bir marta'
}

export const XARAJATLAR: Xarajat[] = [
  {
    nom: 'Server va ma’lumotlar bazasi',
    izoh: 'Vazifalaringiz, papkalaringiz va muhokamalar saqlanadigan joy. Telefon yo‘qolsa ham ma’lumotingiz shu yerda butun turadi.',
    summa: 320_000,
    davr: 'oy',
  },
  {
    nom: 'Sayt xostingi',
    izoh: 'samarali-kun.uz saytini kecha-kunduz ishlab turishini ta’minlaydi.',
    summa: 255_000,
    davr: 'oy',
  },
  {
    nom: 'Domen (samarali-kun.uz)',
    izoh: 'Sayt manzili. Har yili uzaytirib turiladi, aks holda sayt ochilmay qoladi.',
    summa: 120_000,
    davr: 'yil',
  },
  {
    nom: 'Google Play hisobi',
    izoh: 'Ilovani Play Market’ga joylash uchun Google’ga to‘lanadi.',
    summa: 320_000,
    davr: 'bir marta',
  },
  {
    nom: 'Apple dasturchi hisobi',
    izoh: 'iPhone uchun App Store’ga chiqish uchun. Har yili to‘lanadi.',
    summa: 1_270_000,
    davr: 'yil',
  },
]

/** Oylik ekvivalent: yillik — 12 ga bo'linadi, bir martalik hisobga kirmaydi */
export function oylikJami(xarajatlar: Xarajat[] = XARAJATLAR): number {
  return xarajatlar.reduce((jami, x) => {
    if (x.davr === 'oy') return jami + x.summa
    if (x.davr === 'yil') return jami + Math.round(x.summa / 12)
    return jami
  }, 0)
}

export type TolovUsuli = {
  nom: string
  /** Karta raqami yoki qisqa izoh — nusxa olish tugmasi bilan ko'rsatiladi */
  qiymat?: string
  /** Payme/Click/Tirikchilik kabi to'lov sahifasi havolasi */
  havola?: string
}

/**
 * TO'LDIRILSIN: to'lov usullari. Bo'sh qolganlari ko'rsatilmaydi.
 *
 * Misol:
 *   { nom: 'Payme', havola: 'https://payme.uz/...' },
 *   { nom: 'Humo karta', qiymat: '9860 0000 0000 0000', },
 */
export const TOLOV_USULLARI: TolovUsuli[] = []

/**
 * Android/iOS ilovasi ichida to'lov usullari ko'rsatilsinmi.
 *
 * Sukut bo'yicha YO'Q: Google Play va App Store qoidalariga ko'ra
 * ilova ichida dasturchiga pul o'tkazish (xayriya/"tip") ularning
 * o'z to'lov tizimi orqali bo'lishi kerak, tashqi kartaga yoki
 * Payme'ga yo'naltirish ilovani do'kondan olib tashlashga sabab
 * bo'lishi mumkin. Ilovada xarajatlar va pulsiz yordam usullari
 * ko'rinadi, to'lov esa faqat saytda.
 */
export const ILOVADA_TOLOV_KORSATILSIN = false
