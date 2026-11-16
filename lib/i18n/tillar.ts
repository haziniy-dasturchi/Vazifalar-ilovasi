/**
 * Qo'llab-quvvatlanadigan tillar.
 *
 * Yangi til qo'shish: shu ro'yxatga qator qo'shiladi va
 * `lib/i18n/matnlar/<kod>.ts` yaratiladi. TypeScript qolganini o'zi
 * ushlaydi — bitta matn tarjima qilinmasa, loyiha yig'ilmaydi.
 */
export const TILLAR = [
  { kod: 'uz', nom: "O'zbekcha", nomOzTilida: 'O‘zbekcha', ogLocale: 'uz_UZ' },
  { kod: 'en', nom: 'Inglizcha', nomOzTilida: 'English', ogLocale: 'en_US' },
  { kod: 'ru', nom: 'Ruscha', nomOzTilida: 'Русский', ogLocale: 'ru_RU' },
] as const

export type Til = (typeof TILLAR)[number]['kod']

export const STANDART_TIL: Til = 'uz'

export const TIL_KODLARI = TILLAR.map((t) => t.kod) as readonly Til[]

export function tilmi(qiymat: unknown): qiymat is Til {
  return typeof qiymat === 'string' && (TIL_KODLARI as string[]).includes(qiymat)
}

export function tilMalumoti(kod: Til) {
  return TILLAR.find((t) => t.kod === kod) ?? TILLAR[0]
}

/**
 * Ochiq sahifalar uchun manzil boshlanishi.
 *
 * Standart til prefiksiz turadi (`/`), qolganlari prefiks bilan
 * (`/en`, `/ru`). Bu qidiruv tizimlari uchun tavsiya etilgan naqsh:
 * asosiy til uchun ikkita bir xil manzil (`/` va `/uz`) paydo
 * bo'lmaydi.
 */
export function tilPrefiksi(til: Til): string {
  return til === STANDART_TIL ? '' : `/${til}`
}
