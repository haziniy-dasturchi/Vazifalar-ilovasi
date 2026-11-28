/**
 * Xayriya to'lov havolalari — Payme va Click.
 *
 * Oqim: ilova avval `xayriya_yarat` RPC'si bilan yozuv ochadi, keyin
 * shu yerdagi funksiya to'lov sahifasi manzilini yasaydi va odam o'sha
 * sahifaga o'tadi. Payme/Click ilovasi o'rnatilgan bo'lsa, telefon
 * uni o'zi ochadi — bitta teginishda to'lov.
 *
 * To'lov tasdig'i bu yerda EMAS: uni Payme/Click server orqali
 * (`supabase/functions/payme`, `click`) beradi.
 */

export type TolovTizimi = 'payme' | 'click'

/** Tayyor summalar (so'm) — tugmalar */
export const TAYYOR_SUMMALAR = [10_000, 25_000, 50_000, 100_000] as const
export const ENG_KAM_SUMMA = 1_000
export const ENG_KOP_SUMMA = 10_000_000

/** Kassa sozlamalarida ham shu nom — `supabase/functions/_shared/payme.ts` */
const PAYME_HISOB_MAYDONI = 'xayriya_id'

export type TolovSozlamasi = {
  payme?: { merchantId: string; test: boolean }
  click?: { serviceId: string; merchantId: string }
}

/**
 * Muhit o'zgaruvchilaridan. `NEXT_PUBLIC_*` qiymatlari build paytida
 * kodga yoziladi — shuning uchun har biri to'liq nomi bilan.
 * Sozlanmagan tizim tugmasi ko'rinmaydi.
 */
export function tolovSozlamasi(): TolovSozlamasi {
  const paymeId = process.env.NEXT_PUBLIC_PAYME_MERCHANT_ID
  const clickService = process.env.NEXT_PUBLIC_CLICK_SERVICE_ID
  const clickMerchant = process.env.NEXT_PUBLIC_CLICK_MERCHANT_ID
  return {
    payme: paymeId
      ? { merchantId: paymeId, test: process.env.NEXT_PUBLIC_PAYME_TEST === '1' }
      : undefined,
    click:
      clickService && clickMerchant
        ? { serviceId: clickService, merchantId: clickMerchant }
        : undefined,
  }
}

export function summaTogrimi(som: number): boolean {
  return Number.isInteger(som) && som >= ENG_KAM_SUMMA && som <= ENG_KOP_SUMMA
}

/**
 * Payme checkout: `https://checkout.paycom.uz/<base64(parametrlar)>`.
 * Summa tiyinda (`a`), hisob maydoni `ac.xayriya_id`.
 */
export function paymeHavolasi(
  sozlama: NonNullable<TolovSozlamasi['payme']>,
  xayriyaId: string,
  som: number,
  qaytish: string
): string {
  const parametrlar = [
    `m=${sozlama.merchantId}`,
    `ac.${PAYME_HISOB_MAYDONI}=${xayriyaId}`,
    `a=${som * 100}`,
    `c=${qaytish}`,
    'l=uz',
  ].join(';')
  const asos = sozlama.test ? 'https://checkout.test.paycom.uz' : 'https://checkout.paycom.uz'
  return `${asos}/${btoa(parametrlar)}`
}

/** Click: `my.click.uz/services/pay` — summa so'mda */
export function clickHavolasi(
  sozlama: NonNullable<TolovSozlamasi['click']>,
  xayriyaId: string,
  som: number,
  qaytish: string
): string {
  const q = new URLSearchParams({
    service_id: sozlama.serviceId,
    merchant_id: sozlama.merchantId,
    amount: String(som),
    transaction_param: xayriyaId,
    return_url: qaytish,
  })
  return `https://my.click.uz/services/pay?${q}`
}
