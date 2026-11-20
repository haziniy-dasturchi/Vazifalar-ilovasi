/**
 * Loyihalarni holati bo'yicha uchta guruhga ajratish.
 *
 * Tartib ataylab shunday: jarayondagilar tepada, bajarilganlar
 * pastda. Tugallanmagan ish ko'z oldida turishi kerak (Zeygarnik
 * effekti) — tugagan loyihalar esa faqat tarix, ular ro'yxatni
 * uzaytirib, kerakligini pastga surib yuborardi.
 */

export const LOYIHA_HOLATLARI = ['jarayonda', 'rejada', 'bajarilgan'] as const
export type LoyihaHolati = (typeof LOYIHA_HOLATLARI)[number]

export type LoyihaHisobi = {
  /** Loyihadagi barcha vazifalar soni */
  jami: number
  /** Ulardan bajarilganlari */
  bajarilgan: number
}

/**
 * Loyiha qaysi guruhga tushadi.
 *
 * MUHIM: guruh yaxlitlangan foiz bo'yicha emas, vazifalar SONI
 * bo'yicha aniqlanadi. 300 ta ishdan 1 tasi bajarilgan loyihada
 * yaxlitlangan foiz 0% bo'lib chiqadi — lekin ish allaqachon
 * boshlangan va uni "Rejada" deb ko'rsatish noto'g'ri bo'lardi.
 */
export function loyihaHolati({ jami, bajarilgan }: LoyihaHisobi): LoyihaHolati {
  // Ichida vazifasi yo'q loyiha ham reja bosqichida
  if (jami === 0) return 'rejada'
  if (bajarilgan >= jami) return 'bajarilgan'
  if (bajarilgan <= 0) return 'rejada'
  return 'jarayonda'
}

export type Guruhlar<T> = Record<LoyihaHolati, T[]>

/**
 * Ro'yxatni uchta guruhga bo'ladi.
 *
 * Guruh ICHIDAGI tartib tegilmaydi — kiruvchi ro'yxat qanday
 * tartibda kelsa, shundayligicha qoladi. Shu sababli foydalanuvchi
 * qo'lda tartiblagan bo'lsa, u buzilmaydi.
 */
export function loyihalarniGuruhla<T>(
  loyihalar: readonly T[],
  hisob: (loyiha: T) => LoyihaHisobi
): Guruhlar<T> {
  const natija: Guruhlar<T> = { jarayonda: [], rejada: [], bajarilgan: [] }
  for (const loyiha of loyihalar) {
    natija[loyihaHolati(hisob(loyiha))].push(loyiha)
  }
  return natija
}
