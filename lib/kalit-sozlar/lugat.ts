import type { Til } from '@/lib/i18n'

/**
 * Kalit so'zlar lug'ati — har til uchun.
 *
 * Nega lug'at alohida: parser mantiqi uchala tilda bir xil, faqat
 * so'zlar boshqa. Yangi til qo'shilsa, shu yerga bitta yozuv
 * qo'shiladi va parser o'zgarmaydi.
 *
 * Hamma so'zlar KICHIK harfda va BUTUN so'z sifatida solishtiriladi.
 * Shu sababli "seshanba" ichidagi "se" yoki "duo" dagi "du" alohida
 * tanilmaydi.
 */
export type Lugat = {
  /** "har" / "every" / "каждый" */
  har: string[]
  bugun: string[]
  ertaga: string[]
  indinga: string[]
  /** 0 = dushanba ... 6 = yakshanba. Qisqa shakllar */
  kunQisqa: string[][]
  /** Shu tartibda, to'liq nomlar (yolg'iz ham tanilаdi) */
  kunToliq: string[][]
  /** "ish kunlari" / "weekday" / "по будням" — bir yoki ikki so'z */
  ishKunlari: string[][]
  birlik: {
    kun: string[]
    hafta: string[]
    oy: string[]
    yil: string[]
  }
  /** 0 = yanvar ... 11 = dekabr */
  oylar: string[][]
  /** "soat" / "at" / "в" */
  soat: string[]
  /** "va" / "and" / "и" */
  va: string[]
}

const uz: Lugat = {
  har: ['har'],
  bugun: ['bugun'],
  ertaga: ['ertaga'],
  indinga: ['indinga'],
  kunQisqa: [['du'], ['se'], ['chor'], ['pay'], ['ju'], ['sha'], ['yak']],
  kunToliq: [
    ['dushanba'],
    ['seshanba'],
    ['chorshanba'],
    ['payshanba'],
    ['juma'],
    ['shanba'],
    ['yakshanba'],
  ],
  ishKunlari: [['ish', 'kunlari'], ['ishkunlari']],
  birlik: {
    kun: ['kun', 'kuni', 'kunda'],
    hafta: ['hafta', 'haftada', 'haftasi'],
    oy: ['oy', 'oyda', 'oyning'],
    yil: ['yil', 'yilda', 'yili'],
  },
  oylar: [
    ['yanvar'],
    ['fevral'],
    ['mart'],
    ['aprel'],
    ['may'],
    ['iyun'],
    ['iyul'],
    ['avgust'],
    ['sentabr', 'sentyabr'],
    ['oktabr', 'oktyabr'],
    ['noyabr'],
    ['dekabr'],
  ],
  soat: ['soat'],
  va: ['va'],
}

const en: Lugat = {
  har: ['every', 'each'],
  bugun: ['today'],
  ertaga: ['tomorrow'],
  indinga: [],
  kunQisqa: [
    ['mon'],
    ['tue', 'tues'],
    ['wed'],
    ['thu', 'thur', 'thurs'],
    ['fri'],
    ['sat'],
    ['sun'],
  ],
  kunToliq: [
    ['monday'],
    ['tuesday'],
    ['wednesday'],
    ['thursday'],
    ['friday'],
    ['saturday'],
    ['sunday'],
  ],
  ishKunlari: [['weekday'], ['weekdays']],
  birlik: {
    kun: ['day', 'days'],
    hafta: ['week', 'weeks'],
    oy: ['month', 'months'],
    yil: ['year', 'years'],
  },
  oylar: [
    ['jan', 'january'],
    ['feb', 'february'],
    ['mar', 'march'],
    ['apr', 'april'],
    ['may'],
    ['jun', 'june'],
    ['jul', 'july'],
    ['aug', 'august'],
    ['sep', 'sept', 'september'],
    ['oct', 'october'],
    ['nov', 'november'],
    ['dec', 'december'],
  ],
  soat: ['at'],
  va: ['and'],
}

const ru: Lugat = {
  har: ['каждое', 'каждый', 'каждые', 'каждую'],
  bugun: ['сегодня'],
  ertaga: ['завтра'],
  indinga: ['послезавтра'],
  kunQisqa: [['пн'], ['вт'], ['ср'], ['чт'], ['пт'], ['сб'], ['вс']],
  kunToliq: [
    ['понедельник'],
    ['вторник'],
    ['среда', 'среду'],
    ['четверг'],
    ['пятница', 'пятницу'],
    ['суббота', 'субботу'],
    ['воскресенье'],
  ],
  ishKunlari: [['по', 'будням'], ['будням']],
  birlik: {
    kun: ['день', 'дня', 'дней'],
    hafta: ['неделя', 'неделю', 'недели', 'недель'],
    oy: ['месяц', 'месяца', 'месяцев'],
    yil: ['год', 'года', 'лет'],
  },
  oylar: [
    ['январь', 'января', 'янв'],
    ['февраль', 'февраля', 'фев'],
    ['март', 'марта', 'мар'],
    ['апрель', 'апреля', 'апр'],
    ['май', 'мая'],
    ['июнь', 'июня'],
    ['июль', 'июля'],
    ['август', 'августа', 'авг'],
    ['сентябрь', 'сентября', 'сен'],
    ['октябрь', 'октября', 'окт'],
    ['ноябрь', 'ноября', 'ноя'],
    ['декабрь', 'декабря', 'дек'],
  ],
  soat: ['в'],
  va: ['и'],
}

export const LUGATLAR: Record<Til, Lugat> = { uz, en, ru }
