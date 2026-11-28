/**
 * Click Shop API — xayriyalar uchun.
 *
 * Click to'lov paytida `click` Edge funksiyamizga ikki marta murojaat
 * qiladi (form-urlencoded POST):
 *
 *   action=0  Prepare  — "shu xayriyaga to'lasa bo'ladimi?"
 *   action=1  Complete — pul yechildi (yoki `error < 0` — bo'lmadi)
 *
 * Har so'rov `sign_string` bilan imzolanadi:
 *   md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id
 *       [+ merchant_prepare_id — faqat Complete'da] + amount + action + sign_time)
 *
 * `merchant_trans_id` — bizning xayriya ID'miz (to'lov havolasidagi
 * `transaction_param`), `merchant_prepare_id` — xayriyaning `raqam`i.
 *
 * Hujjat: https://docs.click.uz/click-api-request/
 */

import { uuidmi, type XayriyaOmbori } from './xayriya-ombori.ts'

export const CLICK_XATO = {
  muvaffaqiyat: [0, 'Success'],
  imzo: [-1, 'SIGN CHECK FAILED!'],
  summa: [-2, 'Incorrect parameter amount'],
  amal: [-3, 'Action not found'],
  tolangan: [-4, 'Already paid'],
  topilmadi: [-5, 'User does not exist'],
  tranzaksiyaYoq: [-6, 'Transaction does not exist'],
  yangilanmadi: [-7, 'Failed to update user'],
  sorov: [-8, 'Error in request from click'],
  bekor: [-9, 'Transaction cancelled'],
} as const

type XatoTuri = keyof typeof CLICK_XATO

export type ClickJavob = {
  click_trans_id: string
  merchant_trans_id: string
  merchant_prepare_id?: number
  merchant_confirm_id?: number
  error: number
  error_note: string
}

export type ClickSozlama = {
  serviceId: string
  sirKalit: string
  md5: (matn: string) => Promise<string> | string
}

const KERAKLI = [
  'click_trans_id',
  'service_id',
  'merchant_trans_id',
  'amount',
  'action',
  'sign_time',
  'sign_string',
] as const

export async function clickSorovi(
  p: Record<string, string | undefined>,
  ombor: XayriyaOmbori,
  sozlama: ClickSozlama,
  hozir: number = Date.now()
): Promise<ClickJavob> {
  const javob = (turi: XatoTuri, qoshimcha: Partial<ClickJavob> = {}): ClickJavob => ({
    click_trans_id: p.click_trans_id ?? '',
    merchant_trans_id: p.merchant_trans_id ?? '',
    ...qoshimcha,
    error: CLICK_XATO[turi][0],
    error_note: CLICK_XATO[turi][1],
  })

  if (KERAKLI.some((k) => !p[k])) return javob('sorov')
  if (p.action !== '0' && p.action !== '1') return javob('amal')
  const tayyorlash = p.action === '0'
  if (!tayyorlash && !p.merchant_prepare_id) return javob('sorov')

  // Imzo — hamma narsadan oldin: soxta so'rov bazaga yetib bormasin
  const imzoManbasi =
    p.click_trans_id! +
    p.service_id! +
    sozlama.sirKalit +
    p.merchant_trans_id! +
    (tayyorlash ? '' : p.merchant_prepare_id!) +
    p.amount! +
    p.action! +
    p.sign_time!
  const kutilgan = (await sozlama.md5(imzoManbasi)).toLowerCase()
  if (kutilgan !== p.sign_string!.toLowerCase()) return javob('imzo')
  if (p.service_id !== sozlama.serviceId) return javob('sorov')

  const clickTransId = Number(p.click_trans_id)
  const summaTiyin = Math.round(Number(p.amount) * 100)
  if (!Number.isSafeInteger(clickTransId) || !Number.isFinite(summaTiyin)) {
    return javob('sorov')
  }

  if (!uuidmi(p.merchant_trans_id)) return javob('topilmadi')
  const x = await ombor.idBoyicha(p.merchant_trans_id)
  if (!x || x.tizim !== 'click') return javob('topilmadi')

  if (tayyorlash) {
    if (x.holat === 'tolandi') return javob('tolangan')
    if (x.holat === 'bekor') return javob('bekor')
    if (x.summa_tiyin !== summaTiyin) return javob('summa')
    // Boshqa Click tranzaksiyasi allaqachon bog'langan
    if (x.click_trans_id !== null && x.click_trans_id !== clickTransId) {
      return javob('tolangan')
    }

    if (x.click_trans_id === null) {
      const bogland = await ombor.yangila(
        x.id,
        {
          click_trans_id: clickTransId,
          click_paydoc_id: p.click_paydoc_id ? Number(p.click_paydoc_id) : null,
        },
        { click_trans_id: null, holat: 'kutilmoqda' }
      )
      if (!bogland) return javob('tolangan')
    }
    return javob('muvaffaqiyat', { merchant_prepare_id: x.raqam })
  }

  // ---- Complete ----
  if (String(x.raqam) !== p.merchant_prepare_id || x.click_trans_id !== clickTransId) {
    return javob('tranzaksiyaYoq')
  }
  if (x.holat === 'tolandi') return javob('tolangan')
  if (x.holat === 'bekor') return javob('bekor')
  if (x.summa_tiyin !== summaTiyin) return javob('summa')

  // Click to'lov o'tmaganini aytmoqda (masalan, kartada pul yetmadi)
  if (Number(p.error ?? 0) < 0) {
    await ombor.yangila(x.id, { holat: 'bekor' }, { holat: 'kutilmoqda' })
    return javob('bekor')
  }

  const tolandi = await ombor.yangila(
    x.id,
    { holat: 'tolandi', tolandi_at: new Date(hozir).toISOString() },
    { holat: 'kutilmoqda' }
  )
  if (!tolandi) {
    const joriy = await ombor.idBoyicha(x.id)
    if (joriy?.holat === 'tolandi') return javob('tolangan')
    if (joriy?.holat === 'bekor') return javob('bekor')
    return javob('yangilanmadi')
  }
  return javob('muvaffaqiyat', { merchant_confirm_id: x.raqam })
}
