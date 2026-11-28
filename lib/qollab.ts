/**
 * "Loyihani qo'llab-quvvatlash" sahifasidagi o'zgaruvchan ma'lumotlar.
 *
 * To'lov tizimlari (Payme/Click) sozlamasi bu yerda emas — muhit
 * o'zgaruvchilarida (`lib/xayriya.ts`, `.env.example`).
 *
 * Summalar ataylab yo'q: maqsad — odamga qanday xarajatlar borligini
 * tushuntirish, hisobot berish emas. Kurs va tariflar o'zgarganda
 * eskirib qoladigan raqamlarni kuzatib borish ham shart bo'lmaydi.
 */

export type Xarajat = {
  /** Odam tushunadigan nom: "Server", "Domen" */
  nom: string
  /** Bir necha so'zda — nima uchun kerak */
  izoh: string
}

export const XARAJATLAR: Xarajat[] = [
  { nom: 'Server', izoh: 'ma’lumotlaringiz saqlanadigan joy' },
  { nom: 'Domen', izoh: 'samarali-kun.uz manzili' },
  { nom: 'Xosting', izoh: 'sayt kecha-kunduz ishlashi uchun' },
  { nom: 'Play Market va App Store', izoh: 'ilovani do‘konlarga joylash' },
]

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
