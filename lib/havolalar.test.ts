import { describe, expect, it } from 'vitest'
import { havolalarniAjrat } from './havolalar'

describe('havolalarniAjrat', () => {
  it('havolasiz matnni bitta bo‘lak qilib qaytaradi', () => {
    expect(havolalarniAjrat('Kitoblarni olib kelish')).toEqual([
      { tur: 'matn', matn: 'Kitoblarni olib kelish' },
    ])
  })

  it('https havolani ajratadi', () => {
    const b = havolalarniAjrat('Hujjat: https://samarali-kun.uz/reja')
    expect(b).toHaveLength(2)
    expect(b[1]).toEqual({
      tur: 'havola',
      matn: 'https://samarali-kun.uz/reja',
      manzil: 'https://samarali-kun.uz/reja',
    })
  })

  it('www bilan boshlangan manzilga https qo‘shadi', () => {
    const b = havolalarniAjrat('www.example.com ni och')
    expect(b[0]).toEqual({
      tur: 'havola',
      matn: 'www.example.com',
      manzil: 'https://www.example.com',
    })
    expect(b[1]).toEqual({ tur: 'matn', matn: ' ni och' })
  })

  it('oxiridagi nuqtani havolaga qo‘shmaydi', () => {
    const b = havolalarniAjrat('Manzil https://example.com/a.')
    expect(b[1]).toMatchObject({ matn: 'https://example.com/a' })
    expect(b[2]).toEqual({ tur: 'matn', matn: '.' })
  })

  it('bir nechta havolani topadi', () => {
    const b = havolalarniAjrat('https://a.uz va https://b.uz')
    expect(b.filter((x) => x.tur === 'havola')).toHaveLength(2)
  })

  it('bo‘sh matnda bo‘sh ro‘yxat qaytaradi', () => {
    expect(havolalarniAjrat('')).toEqual([])
  })

  it('oddiy nuqtali so‘zni havola deb o‘ylamaydi', () => {
    expect(havolalarniAjrat('Ertaga ertalab.')).toEqual([
      { tur: 'matn', matn: 'Ertaga ertalab.' },
    ])
  })
})
