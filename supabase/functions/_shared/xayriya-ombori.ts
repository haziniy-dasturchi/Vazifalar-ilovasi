/**
 * Xayriya yozuvi va unga kirish interfeysi.
 *
 * Payme/Click mantig'i bazaga to'g'ridan-to'g'ri emas, shu interfeys
 * orqali murojaat qiladi — testda uni xotiradagi soxta ombor bilan
 * almashtirish uchun (`xayriya.test.ts`). Haqiqiy ombor Supabase
 * service role orqali ishlaydi (`supabase-ombor.ts`).
 *
 * Bu fayl Deno'ga ham, Node'ga (vitest) ham mos: hech qanday import
 * va platformaga xos global yo'q.
 */

export type XayriyaHolati = 'kutilmoqda' | 'tolandi' | 'bekor'

export type Xayriya = {
  id: string
  raqam: number
  summa_tiyin: number
  tizim: 'payme' | 'click'
  holat: XayriyaHolati
  tolandi_at: string | null

  payme_tx_id: string | null
  payme_time: number | null
  payme_create_time: number | null
  payme_perform_time: number
  payme_cancel_time: number
  payme_state: number | null
  payme_reason: number | null

  click_trans_id: number | null
  click_paydoc_id: number | null
}

export type XayriyaOmbori = {
  idBoyicha(id: string): Promise<Xayriya | null>
  paymeTxBoyicha(txId: string): Promise<Xayriya | null>
  /**
   * Shartli yangilash: yozuv `shart` dagi barcha maydonlarga mos
   * kelsagina o'zgaradi (`null` — "bo'sh" degani). Yangilangan yozuv
   * yoki, shart bajarilmasa, `null` qaytadi.
   *
   * Payme bir tranzaksiyani bir vaqtda ikki marta yuborishi mumkin —
   * shart tufayli faqat bittasi o'tadi.
   */
  yangila(
    id: string,
    ozgarish: Partial<Xayriya>,
    shart?: Partial<Xayriya>
  ): Promise<Xayriya | null>
  /** Payme `GetStatement`: shu oraliqda (Payme vaqti, ms) yaratilganlar */
  paymeDavrda(dan: number, gacha: number): Promise<Xayriya[]>
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Tashqaridan kelgan ID bazaga yuborishdan oldin tekshiriladi */
export function uuidmi(qiymat: unknown): qiymat is string {
  return typeof qiymat === 'string' && UUID.test(qiymat)
}
