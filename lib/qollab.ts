/**
 * "Loyihani qo'llab-quvvatlash" sahifasidagi o'zgaruvchan ma'lumotlar.
 *
 * Hammasi shu yerda — yangi xarajat yoki to'lov usuli qo'shilsa,
 * sahifa kodiga tegmasdan shu faylni tahrirlash kifoya.
 *
 * Summalar ataylab yo'q: maqsad — odamga qanday xarajatlar borligini
 * tushuntirish, hisobot berish emas. Kurs va tariflar o'zgarganda
 * eskirib qoladigan raqamlarni kuzatib borish ham shart bo'lmaydi.
 */

export type Xarajat = {
  /** Odam tushunadigan nom: "Server", "Domen" */
  nom: string
  /** Bu nima uchun kerak — texnik so'zlarsiz */
  izoh: string
  davr: 'oy' | 'yil' | 'bir marta'
}

export const XARAJATLAR: Xarajat[] = [
  {
    nom: 'Server va ma’lumotlar bazasi',
    izoh: 'Vazifalaringiz, papkalaringiz va muhokamalar saqlanadigan joy. Telefon yo‘qolsa ham ma’lumotingiz shu yerda butun turadi.',
    davr: 'oy',
  },
  {
    nom: 'Sayt xostingi',
    izoh: 'samarali-kun.uz saytini kecha-kunduz ishlab turishini ta’minlaydi.',
    davr: 'oy',
  },
  {
    nom: 'Domen (samarali-kun.uz)',
    izoh: 'Sayt manzili. Har yili uzaytirib turiladi, aks holda sayt ochilmay qoladi.',
    davr: 'yil',
  },
  {
    nom: 'Google Play hisobi',
    izoh: 'Ilovani Play Market’ga joylash uchun Google’ga to‘lanadi.',
    davr: 'bir marta',
  },
  {
    nom: 'Apple dasturchi hisobi',
    izoh: 'iPhone uchun App Store’ga chiqish uchun.',
    davr: 'yil',
  },
]

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
