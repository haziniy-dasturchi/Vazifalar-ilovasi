import { describe, expect, it } from 'vitest'
import { kalitSozlarniAjrat } from './parse'
import type { Til } from '@/lib/i18n'

/**
 * Sinov uchun qat'iy "bugun": 2026-yil 20-noyabr, JUMA.
 * Shu sana testlarni kundan kunga o'zgarmas qiladi.
 */
const BUGUN = '2026-11-20'

function p(matn: string, til: Til = 'uz', bekorlar?: string[]) {
  return kalitSozlarniAjrat(matn, { til, bugun: BUGUN, bekorlar })
}

// =============================================================
// 1. Hech narsa tanilmasligi kerak bo'lgan holatlar — eng muhimi
// =============================================================
describe('yolg‘iz sonlar sana yoki vaqt emas', () => {
  it('"Ahror akani 7 ta kitobi" o‘zgarmaydi', () => {
    const n = p('Ahror akani 7 ta kitobini hisoblash')
    expect(n.nom).toBe('Ahror akani 7 ta kitobini hisoblash')
    expect(n.sana).toBeNull()
    expect(n.vaqt).toBeNull()
    expect(n.belgilar).toHaveLength(0)
  })

  it('"4 mln pulni berish" o‘zgarmaydi', () => {
    const n = p('Kalitlarni va 4 mln pulni Murodjon akaga berib qo‘yish')
    expect(n.nom).toBe('Kalitlarni va 4 mln pulni Murodjon akaga berib qo‘yish')
    expect(n.vaqt).toBeNull()
  })

  it('"3 ta surani 30 martadan o‘qish" o‘zgarmaydi', () => {
    const n = p('Har bir 3 ta surani kamida 30 martadan o‘qish')
    expect(n.sana).toBeNull()
    expect(n.vaqt).toBeNull()
  })

  it('"10 kishi" — son + birlikka o‘xshamaydi, tanilmaydi', () => {
    const n = p('10 kishiga xabar berish')
    expect(n.nom).toBe('10 kishiga xabar berish')
    expect(n.rrule).toBeNull()
  })
})

describe('kalit so‘z faqat butun so‘z sifatida', () => {
  it('"seshanba" ichidagi "se" alohida tanilmaydi', () => {
    const n = p('Seshanba kuni darsga borish')
    // "seshanba" to'liq nom sifatida tanilаdi, lekin "se" emas
    expect(n.sana).toBe('2026-11-24')
    expect(n.nom).toBe('kuni darsga borish')
  })

  it('"duo" so‘zi hafta kuni deb tanilmaydi', () => {
    const n = p('Duo qilishni unutmaslik')
    expect(n.nom).toBe('Duo qilishni unutmaslik')
    expect(n.sana).toBeNull()
  })

  it('qisqa kun nomi yolg‘iz tanilmaydi', () => {
    const n = p('Du kelishi kerak')
    expect(n.nom).toBe('Du kelishi kerak')
    expect(n.rrule).toBeNull()
  })
})

// =============================================================
// 2. Sana
// =============================================================
describe('sana — o‘zbekcha', () => {
  it('bugun', () => {
    const n = p('Hisobot yozish bugun')
    expect(n.sana).toBe(BUGUN)
    expect(n.nom).toBe('Hisobot yozish')
  })

  it('ertaga', () => {
    expect(p('Ertaga uchrashuv').sana).toBe('2026-11-21')
  })

  it('indinga', () => {
    expect(p('Indinga borish').sana).toBe('2026-11-22')
  })

  it('to‘liq hafta kuni — keyingi shu kun', () => {
    // Bugun juma; keyingi payshanba 26-noyabr
    expect(p('Payshanba yig‘ilish').sana).toBe('2026-11-26')
  })

  it('bugungi hafta kuni yozilsa — keyingi haftaga', () => {
    // Bugun juma -> keyingi juma 27-noyabr
    expect(p('Juma hisobot').sana).toBe('2026-11-27')
  })

  it('25-noyabr', () => {
    const n = p('To‘lov 25-noyabr')
    expect(n.sana).toBe('2026-11-25')
    expect(n.nom).toBe('To‘lov')
  })

  it('25.11', () => {
    expect(p('To‘lov 25.11').sana).toBe('2026-11-25')
  })

  it('o‘tib ketgan sana keyingi yilga o‘tadi', () => {
    expect(p('Bayram 1-mart').sana).toBe('2027-03-01')
  })

  it('bo‘lmagan sana tanilmaydi', () => {
    const n = p('Topshiriq 31.02')
    expect(n.sana).toBeNull()
    expect(n.nom).toBe('Topshiriq 31.02')
  })
})

describe('sana — inglizcha va ruscha', () => {
  it('today / tomorrow', () => {
    expect(p('Report today', 'en').sana).toBe(BUGUN)
    expect(p('Call tomorrow', 'en').sana).toBe('2026-11-21')
  })

  it('25 nov va nov 25', () => {
    expect(p('Payment 25 nov', 'en').sana).toBe('2026-11-25')
    expect(p('Payment nov 25', 'en').sana).toBe('2026-11-25')
  })

  it('monday', () => {
    expect(p('Meeting monday', 'en').sana).toBe('2026-11-23')
  })

  it('сегодня / завтра / послезавтра', () => {
    expect(p('Отчёт сегодня', 'ru').sana).toBe(BUGUN)
    expect(p('Звонок завтра', 'ru').sana).toBe('2026-11-21')
    expect(p('Встреча послезавтра', 'ru').sana).toBe('2026-11-22')
  })

  it('25 ноября va 25.11', () => {
    expect(p('Оплата 25 ноября', 'ru').sana).toBe('2026-11-25')
    expect(p('Оплата 25.11', 'ru').sana).toBe('2026-11-25')
  })
})

// =============================================================
// 3. Takrorlanish
// =============================================================
describe('takrorlanish — oddiy', () => {
  it('har kuni', () => {
    const n = p('Gimnastika har kuni')
    expect(n.rrule).toBe('FREQ=DAILY')
    expect(n.nom).toBe('Gimnastika')
  })

  it('har hafta / har oy / har yil', () => {
    expect(p('Yig‘ilish har hafta').rrule).toBe('FREQ=WEEKLY')
    expect(p('Hisobot har oy').rrule).toBe('FREQ=MONTHLY')
    expect(p('Soliq har yil').rrule).toBe('FREQ=YEARLY')
  })

  it('ish kunlari', () => {
    expect(p('Yugurish ish kunlari').rrule).toBe(
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    )
  })

  it('every day / every week / every weekday', () => {
    expect(p('Walk every day', 'en').rrule).toBe('FREQ=DAILY')
    expect(p('Review every week', 'en').rrule).toBe('FREQ=WEEKLY')
    expect(p('Standup every weekday', 'en').rrule).toBe(
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    )
  })

  it('каждый день / по будням', () => {
    expect(p('Зарядка каждый день', 'ru').rrule).toBe('FREQ=DAILY')
    expect(p('Планёрка по будням', 'ru').rrule).toBe(
      'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
    )
  })
})

describe('takrorlanish — oyning sanasida', () => {
  it('"har 1" — oyning 1-sanasi', () => {
    const n = p('To‘lov qilganda sms yuborish har 1')
    expect(n.rrule).toBe('FREQ=MONTHLY;BYMONTHDAY=1')
    expect(n.nom).toBe('To‘lov qilganda sms yuborish')
  })

  it('"har 15"', () => {
    expect(p('Hisob har 15').rrule).toBe('FREQ=MONTHLY;BYMONTHDAY=15')
  })

  it('"har 31" — qisqa oyda oxirgi kun', () => {
    expect(p('Yakun har 31').rrule).toBe(
      'FREQ=MONTHLY;BYMONTHDAY=28,29,30,31;BYSETPOS=-1'
    )
  })

  it('every 1 / каждое 15', () => {
    expect(p('Invoice every 1', 'en').rrule).toBe('FREQ=MONTHLY;BYMONTHDAY=1')
    expect(p('Счёт каждое 15', 'ru').rrule).toBe('FREQ=MONTHLY;BYMONTHDAY=15')
  })

  it('"har 45" — oy kuni emas, tanilmaydi', () => {
    const n = p('Mashq har 45')
    expect(n.rrule).toBeNull()
    expect(n.nom).toBe('Mashq har 45')
  })
})

describe('takrorlanish — hafta kunlari', () => {
  it('har se', () => {
    const n = p('Dars har se')
    expect(n.rrule).toBe('FREQ=WEEKLY;BYDAY=TU')
    expect(n.nom).toBe('Dars')
  })

  it('har du va pay', () => {
    const n = p('Mashg‘ulot har du va pay')
    expect(n.rrule).toBe('FREQ=WEEKLY;BYDAY=MO,TH')
    expect(n.nom).toBe('Mashg‘ulot')
  })

  it('every tue', () => {
    expect(p('Class every tue', 'en').rrule).toBe('FREQ=WEEKLY;BYDAY=TU')
  })

  it('every mon and fri', () => {
    expect(p('Gym every mon and fri', 'en').rrule).toBe(
      'FREQ=WEEKLY;BYDAY=MO,FR'
    )
  })

  it('каждый вт', () => {
    expect(p('Урок каждый вт', 'ru').rrule).toBe('FREQ=WEEKLY;BYDAY=TU')
  })

  it('каждый пн и пт', () => {
    expect(p('Зал каждый пн и пт', 'ru').rrule).toBe('FREQ=WEEKLY;BYDAY=MO,FR')
  })

  it('hamma kun tanlansa — har kuni', () => {
    expect(p('Ish har du va se va chor va pay va ju va sha va yak').rrule).toBe(
      'FREQ=DAILY'
    )
  })
})

describe('takrorlanish — interval', () => {
  it('har 2 kunda', () => {
    const n = p('Suv quyish har 2 kunda')
    expect(n.rrule).toBe('FREQ=DAILY;INTERVAL=2')
    expect(n.nom).toBe('Suv quyish')
  })

  it('har 3 haftada', () => {
    expect(p('Tekshiruv har 3 haftada').rrule).toBe('FREQ=WEEKLY;INTERVAL=3')
  })

  it('every 2 days / every 3 weeks', () => {
    expect(p('Water every 2 days', 'en').rrule).toBe('FREQ=DAILY;INTERVAL=2')
    expect(p('Report every 3 weeks', 'en').rrule).toBe('FREQ=WEEKLY;INTERVAL=3')
  })

  it('каждые 2 дня / каждые 3 недели', () => {
    expect(p('Полив каждые 2 дня', 'ru').rrule).toBe('FREQ=DAILY;INTERVAL=2')
    expect(p('Отчёт каждые 3 недели', 'ru').rrule).toBe(
      'FREQ=WEEKLY;INTERVAL=3'
    )
  })
})

// =============================================================
// 4. Vaqt
// =============================================================
describe('vaqt', () => {
  it('12:00', () => {
    const n = p('Uchrashuv 12:00')
    expect(n.vaqt).toBe('12:00')
    expect(n.nom).toBe('Uchrashuv')
  })

  it('9:30', () => {
    expect(p('Dars 9:30').vaqt).toBe('09:30')
  })

  it('soat 12', () => {
    const n = p('Qo‘ng‘iroq soat 12')
    expect(n.vaqt).toBe('12:00')
    expect(n.nom).toBe('Qo‘ng‘iroq')
  })

  it('at 9 / 12pm', () => {
    expect(p('Call at 9', 'en').vaqt).toBe('09:00')
    expect(p('Lunch 12pm', 'en').vaqt).toBe('12:00')
  })

  it('в 12', () => {
    expect(p('Звонок в 12', 'ru').vaqt).toBe('12:00')
  })

  it('noto‘g‘ri vaqt tanilmaydi', () => {
    const n = p('Kod 99:99')
    expect(n.vaqt).toBeNull()
    expect(n.nom).toBe('Kod 99:99')
  })
})

describe('sana yoki takrordan keyingi yolg‘iz son — vaqt', () => {
  it('ertaga 9', () => {
    const n = p('Uchrashuv ertaga 9')
    expect(n.sana).toBe('2026-11-21')
    expect(n.vaqt).toBe('09:00')
    expect(n.nom).toBe('Uchrashuv')
  })

  it('har se 12', () => {
    const n = p('Dars har se 12')
    expect(n.rrule).toBe('FREQ=WEEKLY;BYDAY=TU')
    expect(n.vaqt).toBe('12:00')
    expect(n.nom).toBe('Dars')
  })

  it('tomorrow 9', () => {
    const n = p('Call tomorrow 9', 'en')
    expect(n.sana).toBe('2026-11-21')
    expect(n.vaqt).toBe('09:00')
  })

  it('sanadan uzoqdagi son vaqt emas', () => {
    const n = p('Ertaga Ahrorga 7 ta kitob berish')
    expect(n.sana).toBe('2026-11-21')
    expect(n.vaqt).toBeNull()
    expect(n.nom).toBe('Ahrorga 7 ta kitob berish')
  })
})

// =============================================================
// 5. Muhimlik
// =============================================================
describe('muhimlik', () => {
  it('p1 — hamma tilda', () => {
    expect(p('Shoshilinch ish p1').muhimlik).toBe(1)
    expect(p('Urgent p2', 'en').muhimlik).toBe(2)
    expect(p('Задача p3', 'ru').muhimlik).toBe(3)
    expect(p('Oddiy p4').muhimlik).toBe(4)
  })

  it('nomdan olib tashlanadi', () => {
    expect(p('Shoshilinch ish p1').nom).toBe('Shoshilinch ish')
  })

  it('p5 tanilmaydi', () => {
    const n = p('Kod p5')
    expect(n.muhimlik).toBeNull()
    expect(n.nom).toBe('Kod p5')
  })
})

// =============================================================
// 6. Aralash va chekka holatlar
// =============================================================
describe('aralash', () => {
  it('sana, vaqt va muhimlik birga', () => {
    const n = p('Shifokorga borish ertaga 14:30 p2')
    expect(n.sana).toBe('2026-11-21')
    expect(n.vaqt).toBe('14:30')
    expect(n.muhimlik).toBe(2)
    expect(n.nom).toBe('Shifokorga borish')
  })

  it('takror va muhimlik birga', () => {
    const n = p('Hisobot har 15 p1')
    expect(n.rrule).toBe('FREQ=MONTHLY;BYMONTHDAY=15')
    expect(n.muhimlik).toBe(1)
    expect(n.nom).toBe('Hisobot')
  })

  it('belgilar o‘rni to‘g‘ri', () => {
    const matn = 'Hisobot har 15'
    const n = p(matn)
    expect(n.belgilar).toHaveLength(1)
    expect(matn.slice(n.belgilar[0].boshi, n.belgilar[0].oxiri)).toBe('har 15')
  })

  it('ikkinchi marta uchragan tur e’tiborsiz qoladi', () => {
    const n = p('Ish ertaga bugun')
    expect(n.sana).toBe('2026-11-21')
  })

  it('bo‘sh matn', () => {
    const n = p('')
    expect(n.nom).toBe('')
    expect(n.belgilar).toHaveLength(0)
  })

  it('faqat kalit so‘zdan iborat matn', () => {
    const n = p('har kuni')
    expect(n.nom).toBe('')
    expect(n.rrule).toBe('FREQ=DAILY')
  })

  it('bo‘shliqlar tozalanadi', () => {
    expect(p('Kitob o‘qish ertaga kechqurun').nom).toBe('Kitob o‘qish kechqurun')
  })
})

describe('bekor qilingan belgilar', () => {
  it('bekor qilingan matn oddiy matn bo‘lib qoladi', () => {
    const n = p('Hisobot har 15', 'uz', ['har 15'])
    expect(n.rrule).toBeNull()
    expect(n.nom).toBe('Hisobot har 15')
    expect(n.belgilar).toHaveLength(0)
  })

  it('bekor qilish faqat o‘sha matnga ta’sir qiladi', () => {
    const n = p('Hisobot har 15 p1', 'uz', ['har 15'])
    expect(n.rrule).toBeNull()
    expect(n.muhimlik).toBe(1)
    expect(n.nom).toBe('Hisobot har 15')
  })
})
