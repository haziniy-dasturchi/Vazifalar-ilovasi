/**
 * Payme Merchant API — xayriyalar uchun.
 *
 * Payme to'lov paytida bizning `payme` Edge funksiyamizga JSON-RPC
 * so'rovlar yuboradi. Bu yerda o'sha so'rovlarga javob beriladi:
 *
 *   CheckPerformTransaction — "shu xayriyaga to'lasa bo'ladimi?"
 *   CreateTransaction       — tranzaksiya ochildi (pul hali yechilmagan)
 *   PerformTransaction      — pul yechildi -> xayriya "tolandi"
 *   CancelTransaction       — bekor qilindi yoki qaytarildi
 *   CheckTransaction        — holatini so'rash
 *   GetStatement            — davr bo'yicha ro'yxat (solishtirish uchun)
 *
 * Hujjat: https://developer.help.paycom.uz/metody-merchant-api/
 *
 * Qoidalar: javob HAR DOIM HTTP 200, xato `error` ichida qaytadi;
 * summa tiyinda; bitta xayriya — bitta Payme tranzaksiyasi.
 */

import { uuidmi, type Xayriya, type XayriyaOmbori } from './xayriya-ombori.ts'

/** Hisob maydoni — kassa sozlamalarida ham aynan shu nom bo'lishi SHART */
export const PAYME_HISOB_MAYDONI = 'xayriya_id'

/** Ochilgan, lekin yakunlanmagan tranzaksiya 12 soatdan keyin eskiradi */
export const PAYME_MUDDAT_MS = 12 * 60 * 60 * 1000

const HOLAT = { yaratildi: 1, bajarildi: 2, bekorYaratilgan: -1, bekorBajarilgan: -2 } as const

type Xabar = { uz: string; ru: string; en: string }

const XATOLAR = {
  avtorizatsiya: { kod: -32504, xabar: { uz: 'Ruxsat yo‘q', ru: 'Недостаточно привилегий', en: 'Insufficient privileges' } },
  sorov: { kod: -32600, xabar: { uz: 'Noto‘g‘ri so‘rov', ru: 'Неверный запрос', en: 'Invalid request' } },
  usul: { kod: -32601, xabar: { uz: 'Usul topilmadi', ru: 'Метод не найден', en: 'Method not found' } },
  tahlil: { kod: -32700, xabar: { uz: 'JSON xato', ru: 'Ошибка разбора JSON', en: 'Parse error' } },
  summa: { kod: -31001, xabar: { uz: 'Summa noto‘g‘ri', ru: 'Неверная сумма', en: 'Incorrect amount' } },
  tranzaksiyaYoq: { kod: -31003, xabar: { uz: 'Tranzaksiya topilmadi', ru: 'Транзакция не найдена', en: 'Transaction not found' } },
  bajarilmaydi: { kod: -31008, xabar: { uz: 'Amalni bajarib bo‘lmaydi', ru: 'Невозможно выполнить операцию', en: 'Unable to perform operation' } },
  xayriyaYoq: { kod: -31050, xabar: { uz: 'Xayriya topilmadi', ru: 'Пожертвование не найдено', en: 'Donation not found' } },
  xayriyaBand: { kod: -31099, xabar: { uz: 'Bu xayriya allaqachon to‘langan yoki bekor qilingan', ru: 'Пожертвование уже оплачено или отменено', en: 'Donation is already paid or cancelled' } },
} satisfies Record<string, { kod: number; xabar: Xabar }>

type XatoTuri = keyof typeof XATOLAR

class PaymeXato extends Error {
  constructor(public turi: XatoTuri, public maydon?: string) {
    super(turi)
  }
}

type JsonRpcId = string | number | null

export type PaymeJavob =
  | { jsonrpc: '2.0'; id: JsonRpcId; result: unknown }
  | {
      jsonrpc: '2.0'
      id: JsonRpcId
      error: { code: number; message: Xabar; data?: string }
    }

function xatoJavob(id: JsonRpcId, turi: XatoTuri, maydon?: string): PaymeJavob {
  const x = XATOLAR[turi]
  return {
    jsonrpc: '2.0',
    id,
    error: { code: x.kod, message: x.xabar, ...(maydon ? { data: maydon } : {}) },
  }
}

/**
 * `Authorization: Basic base64("Paycom:<kalit>")`.
 * Bir nechta kalit qabul qilinadi — ishlab turgan va test kassasi.
 */
export function paymeRuxsatTogrimi(sarlavha: string | null, kalitlar: string[]): boolean {
  if (!sarlavha?.startsWith('Basic ')) return false
  let ochiq: string
  try {
    ochiq = atob(sarlavha.slice(6).trim())
  } catch {
    return false
  }
  const ikkiNuqta = ochiq.indexOf(':')
  if (ikkiNuqta < 0) return false
  const login = ochiq.slice(0, ikkiNuqta)
  const parol = ochiq.slice(ikkiNuqta + 1)
  return login === 'Paycom' && kalitlar.some((k) => k.length > 0 && k === parol)
}

/** Ruxsat xatosi — HTTP so'rov bosqichida, tanani o'qimasdan */
export function paymeRuxsatXatosi(id: JsonRpcId = null): PaymeJavob {
  return xatoJavob(id, 'avtorizatsiya')
}

export function paymeTahlilXatosi(): PaymeJavob {
  return xatoJavob(null, 'tahlil')
}

type Parametrlar = Record<string, unknown>

function sonMi(q: unknown): q is number {
  return typeof q === 'number' && Number.isFinite(q)
}

function hisobdanXayriyaId(p: Parametrlar): string {
  const hisob = p.account as Record<string, unknown> | undefined
  const id = hisob?.[PAYME_HISOB_MAYDONI]
  if (!uuidmi(id)) throw new PaymeXato('xayriyaYoq', PAYME_HISOB_MAYDONI)
  return id
}

/** Xayriyaga hozir to'lasa bo'ladimi — Check va Create uchun umumiy */
async function xayriyaniTekshir(ombor: XayriyaOmbori, p: Parametrlar): Promise<Xayriya> {
  const id = hisobdanXayriyaId(p)
  if (!sonMi(p.amount)) throw new PaymeXato('summa')

  const x = await ombor.idBoyicha(id)
  if (!x || x.tizim !== 'payme') throw new PaymeXato('xayriyaYoq', PAYME_HISOB_MAYDONI)
  if (x.summa_tiyin !== p.amount) throw new PaymeXato('summa')
  if (x.holat !== 'kutilmoqda') throw new PaymeXato('xayriyaBand', PAYME_HISOB_MAYDONI)
  return x
}

function tranzaksiyaHolati(x: Xayriya) {
  return {
    create_time: x.payme_create_time ?? 0,
    perform_time: x.payme_perform_time,
    cancel_time: x.payme_cancel_time,
    transaction: x.id,
    state: x.payme_state,
    reason: x.payme_reason,
  }
}

async function tranzaksiyaniOl(ombor: XayriyaOmbori, p: Parametrlar): Promise<Xayriya> {
  if (typeof p.id !== 'string' || !p.id) throw new PaymeXato('tranzaksiyaYoq')
  const x = await ombor.paymeTxBoyicha(p.id)
  if (!x) throw new PaymeXato('tranzaksiyaYoq')
  return x
}

/** Muddati o'tgan ochiq tranzaksiyani bekor qiladi (sabab 4 — vaqt tugadi) */
async function eskirganiniBekorQil(ombor: XayriyaOmbori, x: Xayriya, hozir: number) {
  await ombor.yangila(
    x.id,
    {
      payme_state: HOLAT.bekorYaratilgan,
      payme_cancel_time: hozir,
      payme_reason: 4,
      holat: 'bekor',
    },
    { payme_state: HOLAT.yaratildi }
  )
}

const USULLAR: Record<
  string,
  (ombor: XayriyaOmbori, p: Parametrlar, hozir: number) => Promise<unknown>
> = {
  async CheckPerformTransaction(ombor, p) {
    const x = await xayriyaniTekshir(ombor, p)
    // Boshqa tranzaksiya ochiq turgan bo'lsa — ikkinchisiga yo'l yo'q
    if (x.payme_tx_id) throw new PaymeXato('xayriyaBand', PAYME_HISOB_MAYDONI)
    return { allow: true }
  },

  async CreateTransaction(ombor, p, hozir) {
    if (typeof p.id !== 'string' || !p.id || !sonMi(p.time)) {
      throw new PaymeXato('sorov')
    }

    // Takroriy so'rov — o'sha tranzaksiya allaqachon bor
    const mavjud = await ombor.paymeTxBoyicha(p.id)
    if (mavjud) {
      if (mavjud.payme_state !== HOLAT.yaratildi) throw new PaymeXato('bajarilmaydi')
      if (hozir - (mavjud.payme_time ?? 0) > PAYME_MUDDAT_MS) {
        await eskirganiniBekorQil(ombor, mavjud, hozir)
        throw new PaymeXato('bajarilmaydi')
      }
      return {
        create_time: mavjud.payme_create_time,
        transaction: mavjud.id,
        state: mavjud.payme_state,
      }
    }

    const x = await xayriyaniTekshir(ombor, p)
    if (x.payme_tx_id) throw new PaymeXato('xayriyaBand', PAYME_HISOB_MAYDONI)

    const yangi = await ombor.yangila(
      x.id,
      {
        payme_tx_id: p.id,
        payme_time: p.time,
        payme_create_time: hozir,
        payme_state: HOLAT.yaratildi,
      },
      { payme_tx_id: null, holat: 'kutilmoqda' }
    )
    // Shu orada boshqa tranzaksiya egallab olgan
    if (!yangi) throw new PaymeXato('xayriyaBand', PAYME_HISOB_MAYDONI)

    return {
      create_time: yangi.payme_create_time,
      transaction: yangi.id,
      state: yangi.payme_state,
    }
  },

  async PerformTransaction(ombor, p, hozir) {
    const x = await tranzaksiyaniOl(ombor, p)

    if (x.payme_state === HOLAT.bajarildi) {
      return { transaction: x.id, perform_time: x.payme_perform_time, state: x.payme_state }
    }
    if (x.payme_state !== HOLAT.yaratildi) throw new PaymeXato('bajarilmaydi')

    if (hozir - (x.payme_time ?? 0) > PAYME_MUDDAT_MS) {
      await eskirganiniBekorQil(ombor, x, hozir)
      throw new PaymeXato('bajarilmaydi')
    }

    const bajarildi = await ombor.yangila(
      x.id,
      {
        payme_state: HOLAT.bajarildi,
        payme_perform_time: hozir,
        holat: 'tolandi',
        tolandi_at: new Date(hozir).toISOString(),
      },
      { payme_state: HOLAT.yaratildi }
    )
    // Parallel so'rov ulgurgan — joriy holatni qayta o'qib javob beramiz
    const natija = bajarildi ?? (await ombor.paymeTxBoyicha(x.payme_tx_id!))
    if (!natija || natija.payme_state !== HOLAT.bajarildi) throw new PaymeXato('bajarilmaydi')
    return { transaction: natija.id, perform_time: natija.payme_perform_time, state: natija.payme_state }
  },

  async CancelTransaction(ombor, p, hozir) {
    const x = await tranzaksiyaniOl(ombor, p)
    const sabab = sonMi(p.reason) ? p.reason : null

    if (x.payme_state === HOLAT.yaratildi || x.payme_state === HOLAT.bajarildi) {
      const yangiHolat =
        x.payme_state === HOLAT.yaratildi ? HOLAT.bekorYaratilgan : HOLAT.bekorBajarilgan
      // Xayriyada "yetkazilgan mahsulot" yo'q — bajarilganini ham
      // qaytarish mumkin, Payme pulni odamga qaytaradi
      const bekor = await ombor.yangila(
        x.id,
        {
          payme_state: yangiHolat,
          payme_cancel_time: hozir,
          payme_reason: sabab,
          holat: 'bekor',
        },
        { payme_state: x.payme_state }
      )
      const natija = bekor ?? (await ombor.paymeTxBoyicha(x.payme_tx_id!))
      if (!natija) throw new PaymeXato('tranzaksiyaYoq')
      return { transaction: natija.id, cancel_time: natija.payme_cancel_time, state: natija.payme_state }
    }

    // Allaqachon bekor qilingan — o'sha holatni qaytaramiz
    return { transaction: x.id, cancel_time: x.payme_cancel_time, state: x.payme_state }
  },

  async CheckTransaction(ombor, p) {
    return tranzaksiyaHolati(await tranzaksiyaniOl(ombor, p))
  },

  async GetStatement(ombor, p) {
    if (!sonMi(p.from) || !sonMi(p.to)) throw new PaymeXato('sorov')
    const royxat = await ombor.paymeDavrda(p.from, p.to)
    return {
      transactions: royxat.map((x) => ({
        id: x.payme_tx_id,
        time: x.payme_time,
        amount: x.summa_tiyin,
        account: { [PAYME_HISOB_MAYDONI]: x.id },
        ...tranzaksiyaHolati(x),
      })),
    }
  },
}

/**
 * Bitta JSON-RPC so'rovni bajaradi. Ruxsat ALLAQACHON tekshirilgan
 * bo'lishi kerak (`paymeRuxsatTogrimi`).
 */
export async function paymeSorovi(
  tana: unknown,
  ombor: XayriyaOmbori,
  hozir: number = Date.now()
): Promise<PaymeJavob> {
  const sorov = tana as { id?: JsonRpcId; method?: unknown; params?: unknown } | null
  const id = sorov && (typeof sorov.id === 'number' || typeof sorov.id === 'string') ? sorov.id : null

  if (!sorov || typeof sorov !== 'object' || typeof sorov.method !== 'string') {
    return xatoJavob(id, 'sorov')
  }
  const usul = USULLAR[sorov.method]
  if (!usul) return xatoJavob(id, 'usul')

  const parametrlar =
    sorov.params && typeof sorov.params === 'object' ? (sorov.params as Parametrlar) : {}

  try {
    return { jsonrpc: '2.0', id, result: await usul(ombor, parametrlar, hozir) }
  } catch (e) {
    if (e instanceof PaymeXato) return xatoJavob(id, e.turi, e.maydon)
    throw e
  }
}
