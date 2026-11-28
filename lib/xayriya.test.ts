import { describe, expect, it } from 'vitest'
import { clickHavolasi, paymeHavolasi, summaTogrimi } from './xayriya'

const ID = '11111111-2222-4333-8444-555555555555'
const QAYTISH = 'https://samarali-kun.uz/qollab-quvvatlash?rahmat=1'

describe('paymeHavolasi', () => {
  it('parametrlarni base64 qilib, summani tiyinda yozadi', () => {
    const h = paymeHavolasi({ merchantId: 'M1', test: false }, ID, 25_000, QAYTISH)
    expect(h.startsWith('https://checkout.paycom.uz/')).toBe(true)
    expect(atob(h.split('/').pop()!)).toBe(
      `m=M1;ac.xayriya_id=${ID};a=2500000;c=${QAYTISH};l=uz`
    )
  })

  it('test rejimida sandbox manziliga yuboradi', () => {
    const h = paymeHavolasi({ merchantId: 'M1', test: true }, ID, 1000, QAYTISH)
    expect(h.startsWith('https://checkout.test.paycom.uz/')).toBe(true)
  })
})

describe('clickHavolasi', () => {
  it('xizmat, summa va xayriya ID’sini uzatadi', () => {
    const h = new URL(clickHavolasi({ serviceId: '12', merchantId: '34' }, ID, 50_000, QAYTISH))
    expect(h.origin + h.pathname).toBe('https://my.click.uz/services/pay')
    expect(Object.fromEntries(h.searchParams)).toEqual({
      service_id: '12',
      merchant_id: '34',
      amount: '50000',
      transaction_param: ID,
      return_url: QAYTISH,
    })
  })
})

describe('summaTogrimi', () => {
  it('chegaralarni tekshiradi', () => {
    expect(summaTogrimi(1000)).toBe(true)
    expect(summaTogrimi(10_000_000)).toBe(true)
    expect(summaTogrimi(999)).toBe(false)
    expect(summaTogrimi(10_000_001)).toBe(false)
    expect(summaTogrimi(1500.5)).toBe(false)
    expect(summaTogrimi(Number.NaN)).toBe(false)
  })
})
