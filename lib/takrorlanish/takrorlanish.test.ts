import { describe, expect, it } from 'vitest'
import { keyingiSana, oyQoshish } from './hisob'
import {
  HAR_KUNI,
  ISH_KUNLARI,
  OXIRGI_KUN,
  kunlardanRrule,
  matndanQoida,
  qoidaniMatnga,
  rruleKunlari,
  soddalashtir,
  BOSH_QOIDA,
} from './qoida'
import { eskidanRrule, rruleEskiga } from './eski'

/** Qisqa chaqiruv: qoida, boshlanish va asos ko'pincha bir xil */
function keyingi(
  rrule: string,
  boshlanish: string,
  asos = boshlanish,
  bugun?: string,
  bajarilgandan = false
) {
  return keyingiSana({ rrule, boshlanish, asos, bugun, bajarilgandan })
}

describe('oyQoshish — qisqa oyga qisqarish', () => {
  it('31-yanvarga bir oy: 28-fevral (oddiy yil)', () => {
    expect(oyQoshish('2026-01-31', 1)).toBe('2026-02-28')
  })

  it('31-yanvarga bir oy: 29-fevral (kabisa yili)', () => {
    expect(oyQoshish('2028-01-31', 1)).toBe('2028-02-29')
  })

  it('zanjirga emas, boshlanishga bog‘lanadi — 31 saqlanadi', () => {
    expect(oyQoshish('2026-01-31', 2)).toBe('2026-03-31')
    expect(oyQoshish('2026-01-31', 3)).toBe('2026-04-30')
  })

  it('yil chegarasidan o‘tadi', () => {
    expect(oyQoshish('2026-12-15', 1)).toBe('2027-01-15')
  })

  it('29-fevraldan bir yil keyin 28-fevral', () => {
    expect(oyQoshish('2028-02-29', 12)).toBe('2029-02-28')
  })
})

describe('keyingiSana — tayyor variantlar', () => {
  it('har kuni', () => {
    expect(keyingi(HAR_KUNI, '2026-11-20')).toBe('2026-11-21')
  })

  it('har 3 kunda', () => {
    expect(keyingi('FREQ=DAILY;INTERVAL=3', '2026-11-20')).toBe('2026-11-23')
  })

  it('ish kunlari: jumadan keyin dushanba', () => {
    expect(keyingi(ISH_KUNLARI, '2026-03-13')).toBe('2026-03-16')
  })

  it('har hafta', () => {
    expect(keyingi('FREQ=WEEKLY', '2026-11-20')).toBe('2026-11-27')
  })

  it('har oy', () => {
    expect(keyingi('FREQ=MONTHLY', '2026-11-20')).toBe('2026-12-20')
  })

  it('har oy — 31-sanadan keyin oyning oxirgi kuni', () => {
    expect(keyingi('FREQ=MONTHLY', '2026-01-31')).toBe('2026-02-28')
  })

  it('har yili', () => {
    expect(keyingi('FREQ=YEARLY', '2026-11-20')).toBe('2027-11-20')
  })
})

describe('keyingiSana — hafta kunlari', () => {
  it('tanlangan kunlar: seshanba va payshanba', () => {
    const q = 'FREQ=WEEKLY;BYDAY=TU,TH'
    // 2026-11-20 — juma, keyingisi seshanba (24-noyabr)
    expect(keyingi(q, '2026-11-17', '2026-11-20')).toBe('2026-11-24')
  })

  it('har 2 haftada seshanba', () => {
    expect(
      keyingi('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU', '2026-11-17', '2026-11-20')
    ).toBe('2026-12-01')
  })
})

describe('keyingiSana — oylik tafsilotlar', () => {
  it('oyning 15-sanasi', () => {
    expect(keyingi('FREQ=MONTHLY;BYMONTHDAY=15', '2026-11-20')).toBe(
      '2026-12-15'
    )
  })

  it('oyning oxirgi kuni (BYMONTHDAY=-1)', () => {
    expect(keyingi('FREQ=MONTHLY;BYMONTHDAY=-1', '2026-01-31')).toBe(
      '2026-02-28'
    )
  })

  it('31-sana: qisqa oyda oxirgi kunga tushadi', () => {
    // BYSETPOS=-1 bilan: "28..31 dan oyda mavjud bo‘lgan oxirgisi"
    expect(
      keyingi('FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1', '2026-01-31')
    ).toBe('2026-02-28')
  })

  it('oyning 2-seshanbasi', () => {
    expect(keyingi('FREQ=MONTHLY;BYDAY=2TU', '2026-11-20')).toBe('2026-12-08')
  })

  it('oyning oxirgi jumasi', () => {
    expect(keyingi('FREQ=MONTHLY;BYDAY=-1FR', '2026-11-20')).toBe('2026-11-27')
  })

  it('bir nechta sana: 1 va 15', () => {
    expect(keyingi('FREQ=MONTHLY;BYMONTHDAY=1,15', '2026-11-01')).toBe(
      '2026-11-15'
    )
  })
})

describe('keyingiSana — tugash shartlari', () => {
  it('UNTIL: shu sana ham kiradi', () => {
    expect(keyingi('FREQ=DAILY;UNTIL=20261121', '2026-11-20')).toBe(
      '2026-11-21'
    )
  })

  it('UNTIL dan keyin null', () => {
    expect(keyingi('FREQ=DAILY;UNTIL=20261120', '2026-11-20')).toBeNull()
  })

  it('COUNT tugaganda null', () => {
    // 3 marta: 20, 21, 22 — undan keyin yo'q
    const q = 'FREQ=DAILY;COUNT=3'
    expect(keyingi(q, '2026-11-20', '2026-11-20')).toBe('2026-11-21')
    expect(keyingi(q, '2026-11-20', '2026-11-22')).toBeNull()
  })

  it('oylik COUNT ham hisoblanadi', () => {
    const q = 'FREQ=MONTHLY;COUNT=2'
    expect(keyingi(q, '2026-11-20', '2026-11-20')).toBe('2026-12-20')
    expect(keyingi(q, '2026-11-20', '2026-12-20')).toBeNull()
  })
})

describe('keyingiSana — o‘tmish va bajarilgan sana', () => {
  it('tashlab ketilgan vazifa o‘tmishda qolmaydi', () => {
    // Mart boshida belgilangan kundalik vazifa, bugun 20-mart
    expect(keyingi(HAR_KUNI, '2026-03-01', '2026-03-01', '2026-03-20')).toBe(
      '2026-03-21'
    )
  })

  it('bajarilgan sanadan: kech bajarilsa, keyingisi o‘shandan sanaladi', () => {
    // Jadval bo'yicha 1-mart edi, lekin 20-martda bajarildi
    expect(
      keyingi('FREQ=DAILY;INTERVAL=7', '2026-03-01', '2026-03-01', '2026-03-20', true)
    ).toBe('2026-03-27')
  })

  it('belgilangan sanadan: jadval saqlanadi', () => {
    expect(
      keyingi('FREQ=DAILY;INTERVAL=7', '2026-03-01', '2026-03-01', '2026-03-20')
    ).toBe('2026-03-22')
  })
})

describe('qoida <-> RRULE', () => {
  it('oyning 15-sanasi', () => {
    const q = {
      ...BOSH_QOIDA,
      birlik: 'oy' as const,
      oyKunlari: [15],
    }
    expect(qoidaniMatnga(q)).toBe('FREQ=MONTHLY;BYMONTHDAY=15')
  })

  it('31-sana standart hiyla bilan yoziladi', () => {
    const q = { ...BOSH_QOIDA, birlik: 'oy' as const, oyKunlari: [31] }
    expect(qoidaniMatnga(q)).toBe(
      'FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1'
    )
  })

  it('oyning oxirgi kuni', () => {
    const q = { ...BOSH_QOIDA, birlik: 'oy' as const, oyKunlari: [OXIRGI_KUN] }
    expect(qoidaniMatnga(q)).toBe('FREQ=MONTHLY;BYMONTHDAY=-1')
  })

  it('har 2 haftada se va pay, 10 marta', () => {
    const q = {
      ...BOSH_QOIDA,
      birlik: 'hafta' as const,
      interval: 2,
      kunlar: [4, 2],
      tugash: { tur: 'marta' as const, soni: 10 },
    }
    expect(qoidaniMatnga(q)).toBe('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=10')
  })

  it('oyning 2-seshanbasi, sanagacha', () => {
    const q = {
      ...BOSH_QOIDA,
      birlik: 'oy' as const,
      oyUsuli: 'haftaKuni' as const,
      haftaOrni: 2,
      oyHaftaKuni: 2,
      tugash: { tur: 'sana' as const, sana: '2027-01-01' },
    }
    expect(qoidaniMatnga(q)).toBe('FREQ=MONTHLY;BYDAY=2TU;UNTIL=20270101')
  })

  it('matndan qoidaga va qaytadan — o‘zgarmaydi', () => {
    for (const matn of [
      'FREQ=DAILY',
      'FREQ=DAILY;INTERVAL=3',
      'FREQ=WEEKLY;BYDAY=MO,WE',
      'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=10',
      'FREQ=MONTHLY;BYMONTHDAY=15',
      'FREQ=MONTHLY;BYMONTHDAY=-1',
      'FREQ=MONTHLY;BYDAY=2TU',
      'FREQ=MONTHLY;BYDAY=-1FR;UNTIL=20270101',
      'FREQ=YEARLY',
    ]) {
      const qoida = matndanQoida(matn)
      expect(qoida).not.toBeNull()
      expect(qoidaniMatnga(qoida!)).toBe(matn)
    }
  })

  it('31-sana ajratilganda bitta son bo‘lib qaytadi', () => {
    const q = matndanQoida('FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1')
    expect(q?.oyKunlari).toEqual([31])
  })

  it('noto‘g‘ri matnda null', () => {
    expect(matndanQoida('salom')).toBeNull()
    expect(matndanQoida(null)).toBeNull()
  })
})

describe('soddalashtir va kunlar', () => {
  it('hamma kun — har kuni', () => {
    expect(kunlardanRrule([1, 2, 3, 4, 5, 6, 7])).toBe(HAR_KUNI)
  })

  it('du-ju — ish kunlari', () => {
    expect(kunlardanRrule([1, 2, 3, 4, 5])).toBe(ISH_KUNLARI)
  })

  it('takrorlangan kunlar tozalanadi va tartiblanadi', () => {
    expect(kunlardanRrule([4, 2, 2, 3])).toBe('FREQ=WEEKLY;BYDAY=TU,WE,TH')
  })

  it('bo‘sh ro‘yxat — takrorlanish yo‘q', () => {
    expect(kunlardanRrule([])).toBeNull()
  })

  it('rruleKunlari: har kuni — hamma kun belgilangan', () => {
    expect(rruleKunlari(HAR_KUNI)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('rruleKunlari: ish kunlari', () => {
    expect(rruleKunlari(ISH_KUNLARI)).toEqual([1, 2, 3, 4, 5])
  })

  it('soddalashtir intervalli qoidaga tegmaydi', () => {
    const q = 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,TU,WE,TH,FR'
    expect(soddalashtir(q)).toBe(q)
  })
})

describe('eski shakl bilan ko‘prik', () => {
  it('eskidan RRULE ga', () => {
    expect(eskidanRrule('daily')).toBe(HAR_KUNI)
    expect(eskidanRrule('weekdays')).toBe(ISH_KUNLARI)
    expect(eskidanRrule('weekly')).toBe('FREQ=WEEKLY')
    expect(eskidanRrule('monthly')).toBe('FREQ=MONTHLY')
    expect(eskidanRrule('days:2,4')).toBe('FREQ=WEEKLY;BYDAY=TU,TH')
    expect(eskidanRrule(null)).toBeNull()
  })

  it('RRULE dan eskiga', () => {
    expect(rruleEskiga(HAR_KUNI)).toBe('daily')
    expect(rruleEskiga(ISH_KUNLARI)).toBe('weekdays')
    expect(rruleEskiga('FREQ=WEEKLY')).toBe('weekly')
    expect(rruleEskiga('FREQ=MONTHLY')).toBe('monthly')
    expect(rruleEskiga('FREQ=WEEKLY;BYDAY=TU,TH')).toBe('days:2,4')
  })

  it('eski shaklda ifodalab bo‘lmaydiganlar null', () => {
    expect(rruleEskiga('FREQ=MONTHLY;BYMONTHDAY=15')).toBeNull()
    expect(rruleEskiga('FREQ=WEEKLY;INTERVAL=2;BYDAY=TU')).toBeNull()
    expect(rruleEskiga('FREQ=DAILY;COUNT=5')).toBeNull()
    expect(rruleEskiga('FREQ=YEARLY')).toBeNull()
  })

  it('eski qiymat ko‘chirilganda ma’no o‘zgarmaydi', () => {
    // Eski `monthly` 31-yanvardan 28-fevralga o'tardi — yangi
    // model ham aynan shunday ishlaydi
    const q = eskidanRrule('monthly')!
    expect(keyingi(q, '2026-01-31')).toBe('2026-02-28')
  })
})
