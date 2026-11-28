import { createHash } from 'node:crypto'
import { beforeEach, describe, expect, it } from 'vitest'
import { PAYME_MUDDAT_MS, paymeRuxsatTogrimi, paymeSorovi } from './payme.ts'
import { clickSorovi } from './click.ts'
import type { Xayriya, XayriyaOmbori } from './xayriya-ombori.ts'

// ---------------------------------------------------------------
// Xotiradagi soxta ombor
// ---------------------------------------------------------------
function soxtaOmbor(boshlangich: Xayriya[]) {
  const yozuvlar = new Map(boshlangich.map((x) => [x.id, { ...x }]))
  const ombor: XayriyaOmbori = {
    async idBoyicha(id) {
      const x = yozuvlar.get(id)
      return x ? { ...x } : null
    },
    async paymeTxBoyicha(txId) {
      const x = [...yozuvlar.values()].find((y) => y.payme_tx_id === txId)
      return x ? { ...x } : null
    },
    async yangila(id, ozgarish, shart = {}) {
      const x = yozuvlar.get(id)
      if (!x) return null
      for (const [k, v] of Object.entries(shart)) {
        if (x[k as keyof Xayriya] !== v) return null
      }
      Object.assign(x, ozgarish)
      return { ...x }
    },
    async paymeDavrda(dan, gacha) {
      return [...yozuvlar.values()].filter(
        (x) => x.payme_tx_id && x.payme_time! >= dan && x.payme_time! <= gacha
      )
    },
  }
  return { ombor, yozuvlar }
}

const ID = '11111111-2222-4333-8444-555555555555'
const ID2 = '66666666-7777-4888-9999-aaaaaaaaaaaa'

function xayriya(qoshimcha: Partial<Xayriya> = {}): Xayriya {
  return {
    id: ID,
    raqam: 7,
    summa_tiyin: 2_500_000,
    tizim: 'payme',
    holat: 'kutilmoqda',
    tolandi_at: null,
    payme_tx_id: null,
    payme_time: null,
    payme_create_time: null,
    payme_perform_time: 0,
    payme_cancel_time: 0,
    payme_state: null,
    payme_reason: null,
    click_trans_id: null,
    click_paydoc_id: null,
    ...qoshimcha,
  }
}

// ---------------------------------------------------------------
// Payme
// ---------------------------------------------------------------
describe('paymeRuxsatTogrimi', () => {
  const sarlavha = (s: string) => `Basic ${btoa(s)}`

  it('to‘g‘ri kalitni qabul qiladi', () => {
    expect(paymeRuxsatTogrimi(sarlavha('Paycom:sir'), ['sir', ''])).toBe(true)
  })
  it('test kalitini ham qabul qiladi', () => {
    expect(paymeRuxsatTogrimi(sarlavha('Paycom:test'), ['sir', 'test'])).toBe(true)
  })
  it('noto‘g‘ri kalit, login yoki sarlavhani rad etadi', () => {
    expect(paymeRuxsatTogrimi(sarlavha('Paycom:boshqa'), ['sir'])).toBe(false)
    expect(paymeRuxsatTogrimi(sarlavha('Admin:sir'), ['sir'])).toBe(false)
    expect(paymeRuxsatTogrimi(null, ['sir'])).toBe(false)
    expect(paymeRuxsatTogrimi('Bearer x', ['sir'])).toBe(false)
  })
  it('bo‘sh kalit sozlanmagan test kassasini ochib qo‘ymaydi', () => {
    expect(paymeRuxsatTogrimi(sarlavha('Paycom:'), ['sir', ''])).toBe(false)
  })
})

describe('paymeSorovi', () => {
  let ombor: XayriyaOmbori
  let yozuvlar: Map<string, Xayriya>
  const T = 1_800_000_000_000

  beforeEach(() => {
    ;({ ombor, yozuvlar } = soxtaOmbor([xayriya()]))
  })

  const chaqir = (method: string, params: object, hozir = T) =>
    paymeSorovi({ jsonrpc: '2.0', id: 1, method, params }, ombor, hozir)
  const hisob = { xayriya_id: ID }
  const xatoKodi = (j: Awaited<ReturnType<typeof chaqir>>) =>
    'error' in j ? j.error.code : null

  it('CheckPerformTransaction: to‘g‘ri xayriyaga ruxsat beradi', async () => {
    const j = await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: hisob })
    expect(j).toMatchObject({ result: { allow: true } })
  })

  it('CheckPerformTransaction: summa, ID va holat xatolari', async () => {
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 100, account: hisob }))).toBe(-31001)
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: { xayriya_id: ID2 } }))).toBe(-31050)
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: { xayriya_id: 'yomon' } }))).toBe(-31050)
    yozuvlar.get(ID)!.holat = 'tolandi'
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: hisob }))).toBe(-31099)
  })

  it('Click xayriyasini Payme orqali to‘latmaydi', async () => {
    yozuvlar.get(ID)!.tizim = 'click'
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: hisob }))).toBe(-31050)
  })

  it('to‘liq oqim: Create -> Perform -> Check', async () => {
    const yarat = await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob })
    expect(yarat).toMatchObject({ result: { transaction: ID, state: 1, create_time: T } })

    // Takroriy Create — o'sha javob
    expect(await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob }))
      .toMatchObject({ result: { transaction: ID, state: 1 } })

    const bajar = await chaqir('PerformTransaction', { id: 'tx1' }, T + 5000)
    expect(bajar).toMatchObject({ result: { transaction: ID, state: 2, perform_time: T + 5000 } })
    expect(yozuvlar.get(ID)!.holat).toBe('tolandi')

    // Takroriy Perform — o'sha vaqt bilan
    expect(await chaqir('PerformTransaction', { id: 'tx1' }, T + 9000))
      .toMatchObject({ result: { state: 2, perform_time: T + 5000 } })

    expect(await chaqir('CheckTransaction', { id: 'tx1' })).toMatchObject({
      result: { create_time: T, perform_time: T + 5000, cancel_time: 0, state: 2, reason: null },
    })
  })

  it('ikkinchi tranzaksiya band xayriyaga ochilmaydi', async () => {
    await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob })
    const j = await chaqir('CreateTransaction', { id: 'tx2', time: T, amount: 2_500_000, account: hisob })
    expect(xatoKodi(j)).toBe(-31099)
    expect(xatoKodi(await chaqir('CheckPerformTransaction', { amount: 2_500_000, account: hisob }))).toBe(-31099)
  })

  it('12 soatdan keyin Perform qilinmaydi va bekor bo‘ladi', async () => {
    await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob })
    const j = await chaqir('PerformTransaction', { id: 'tx1' }, T + PAYME_MUDDAT_MS + 1)
    expect(xatoKodi(j)).toBe(-31008)
    expect(yozuvlar.get(ID)).toMatchObject({ payme_state: -1, payme_reason: 4, holat: 'bekor' })
  })

  it('CancelTransaction: ochiq tranzaksiya -1, bajarilgani -2', async () => {
    await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob })
    expect(await chaqir('CancelTransaction', { id: 'tx1', reason: 3 }, T + 1))
      .toMatchObject({ result: { state: -1, cancel_time: T + 1 } })
    // Takroriy bekor — o'sha javob
    expect(await chaqir('CancelTransaction', { id: 'tx1', reason: 3 }, T + 99))
      .toMatchObject({ result: { state: -1, cancel_time: T + 1 } })
    expect(xatoKodi(await chaqir('PerformTransaction', { id: 'tx1' }))).toBe(-31008)

    ;({ ombor, yozuvlar } = soxtaOmbor([xayriya()]))
    await chaqir('CreateTransaction', { id: 'tx9', time: T, amount: 2_500_000, account: hisob })
    await chaqir('PerformTransaction', { id: 'tx9' })
    expect(await chaqir('CancelTransaction', { id: 'tx9', reason: 5 }, T + 2))
      .toMatchObject({ result: { state: -2 } })
    expect(yozuvlar.get(ID)).toMatchObject({ holat: 'bekor', payme_reason: 5 })
  })

  it('noma’lum tranzaksiya va usul', async () => {
    expect(xatoKodi(await chaqir('PerformTransaction', { id: 'yoq' }))).toBe(-31003)
    expect(xatoKodi(await chaqir('CheckTransaction', { id: 'yoq' }))).toBe(-31003)
    expect(xatoKodi(await chaqir('Nimadir', {}))).toBe(-32601)
    expect(xatoKodi(await paymeSorovi(null, ombor))).toBe(-32600)
  })

  it('GetStatement davrdagi tranzaksiyalarni qaytaradi', async () => {
    await chaqir('CreateTransaction', { id: 'tx1', time: T, amount: 2_500_000, account: hisob })
    const j = await chaqir('GetStatement', { from: T - 1, to: T + 1 })
    expect(j).toMatchObject({
      result: {
        transactions: [{ id: 'tx1', time: T, amount: 2_500_000, account: hisob, transaction: ID, state: 1 }],
      },
    })
    expect(await chaqir('GetStatement', { from: 0, to: T - 1 }))
      .toMatchObject({ result: { transactions: [] } })
  })
})

// ---------------------------------------------------------------
// Click
// ---------------------------------------------------------------
describe('clickSorovi', () => {
  const SIR = 'clicksir'
  const md5 = (s: string) => createHash('md5').update(s).digest('hex')
  const sozlama = { serviceId: '123', sirKalit: SIR, md5 }
  let ombor: XayriyaOmbori
  let yozuvlar: Map<string, Xayriya>

  beforeEach(() => {
    ;({ ombor, yozuvlar } = soxtaOmbor([xayriya({ tizim: 'click' })]))
  })

  function sorov(action: '0' | '1', q: Record<string, string> = {}) {
    const p: Record<string, string> = {
      click_trans_id: '555',
      service_id: '123',
      click_paydoc_id: '999',
      merchant_trans_id: ID,
      amount: '25000.00',
      action,
      error: '0',
      error_note: 'Success',
      sign_time: '2026-11-28 18:00:00',
      ...(action === '1' ? { merchant_prepare_id: '7' } : {}),
      ...q,
    }
    p.sign_string ??= md5(
      p.click_trans_id + p.service_id + SIR + p.merchant_trans_id +
      (action === '1' ? p.merchant_prepare_id : '') + p.amount + p.action + p.sign_time
    )
    return p
  }

  it('Prepare -> Complete: xayriya to‘lanadi', async () => {
    expect(await clickSorovi(sorov('0'), ombor, sozlama))
      .toMatchObject({ error: 0, merchant_prepare_id: 7, click_trans_id: '555' })
    expect(yozuvlar.get(ID)!.click_trans_id).toBe(555)

    expect(await clickSorovi(sorov('1'), ombor, sozlama))
      .toMatchObject({ error: 0, merchant_confirm_id: 7 })
    expect(yozuvlar.get(ID)!.holat).toBe('tolandi')

    // Takroriy Complete
    expect((await clickSorovi(sorov('1'), ombor, sozlama)).error).toBe(-4)
  })

  it('imzo noto‘g‘ri bo‘lsa bazaga tegmaydi', async () => {
    const j = await clickSorovi(sorov('0', { sign_string: 'yomon' }), ombor, sozlama)
    expect(j.error).toBe(-1)
    expect(yozuvlar.get(ID)!.click_trans_id).toBeNull()
  })

  it('summa, xayriya va amal xatolari', async () => {
    expect((await clickSorovi(sorov('0', { amount: '1000' }), ombor, sozlama)).error).toBe(-2)
    expect((await clickSorovi(sorov('0', { merchant_trans_id: ID2 }), ombor, sozlama)).error).toBe(-5)
    expect((await clickSorovi({ ...sorov('0'), action: '5' }, ombor, sozlama)).error).toBe(-3)
    expect((await clickSorovi(sorov('0', { service_id: '999' }), ombor, sozlama)).error).toBe(-8)
  })

  it('Prepare qilinmagan tranzaksiyani Complete qilmaydi', async () => {
    expect((await clickSorovi(sorov('1'), ombor, sozlama)).error).toBe(-6)
    await clickSorovi(sorov('0'), ombor, sozlama)
    expect((await clickSorovi(sorov('1', { merchant_prepare_id: '8' }), ombor, sozlama)).error).toBe(-6)
  })

  it('Click xato yuborsa xayriya bekor bo‘ladi', async () => {
    await clickSorovi(sorov('0'), ombor, sozlama)
    const j = await clickSorovi(sorov('1', { error: '-5017' }), ombor, sozlama)
    expect(j.error).toBe(-9)
    expect(yozuvlar.get(ID)!.holat).toBe('bekor')
    expect((await clickSorovi(sorov('0'), ombor, sozlama)).error).toBe(-9)
  })

  it('boshqa Click tranzaksiyasi band xayriyani olmaydi', async () => {
    await clickSorovi(sorov('0'), ombor, sozlama)
    expect((await clickSorovi(sorov('0', { click_trans_id: '556' }), ombor, sozlama)).error).toBe(-4)
  })

  it('Payme xayriyasini Click orqali to‘latmaydi', async () => {
    yozuvlar.get(ID)!.tizim = 'payme'
    expect((await clickSorovi(sorov('0'), ombor, sozlama)).error).toBe(-5)
  })
})
