/**
 * Tanishuv (onboarding) — yangi foydalanuvchini ilova bilan tanishtirish.
 *
 * Uch qatlam:
 *   1. Kutib olish — 30 soniyalik 3 ta jonli ekran + "nima uchun
 *      ishlatasiz?" savoli;
 *   2. Mashq papkasi — vazifalarning O'ZI dars ("Meni bajarilgan
 *      qil"). Ilova harakatni sezadi, maqtaydi va keyingisini ochadi;
 *   3. Bir martalik maslahatlar — bo'limga birinchi kirilganda.
 *
 * Nega o'qitish emas, bajartirish: odam o'z qo'li bilan 2-3 ta kichik
 * yutuqqa erishsa, ilovani "o'zimniki" deb biladi. Slayd o'qish bunday
 * tuyg'u bermaydi va 5 daqiqada unutiladi.
 */

import type { Til } from '@/lib/i18n'
import type { MatnKaliti } from '@/lib/i18n'

export const TANISHUV_VERSIYASI = 1

export type Maqsad = 'oqish' | 'ish' | 'uy' | 'jamoa' | 'sogliq' | 'shaxsiy'
export const MAQSADLAR: Maqsad[] = ['oqish', 'ish', 'uy', 'jamoa', 'sogliq', 'shaxsiy']

/**
 * "Samara haqida qayerdan eshitdingiz?" javoblari — marketing uchun.
 * Bazada `profiles.onboarding->>'manba'` orqali sanaladi.
 */
export type Manba =
  | 'telegram'
  | 'instagram'
  | 'dost'
  | 'google'
  | 'market'
  | 'youtube'
  | 'boshqa'
export const MANBALAR: Manba[] = [
  'telegram',
  'instagram',
  'dost',
  'google',
  'market',
  'youtube',
  'boshqa',
]

export type DarsKaliti =
  | 'bajar'
  | 'sana'
  | 'muhim'
  | 'takror'
  | 'yangi'
  | 'papka'
  | 'kechki'

/** Tartib muhim: oson → qiyin, har biri oldingisiga tayanadi */
export const DARSLAR: DarsKaliti[] = [
  'bajar',
  'sana',
  'muhim',
  'takror',
  'yangi',
  'papka',
  'kechki',
]

/** Mashq papkasining belgisi va uch tildagi nomi — uni qayta topish uchun */
export const MASHQ_PAPKA_BELGISI = 'goya'
export const MASHQ_PAPKA_NOMLARI = ['Tanishuv', 'Знакомство', 'Getting started']

/** Mashq papkasida o'z vazifasi bor darslar */
export const VAZIFALI_DARSLAR: DarsKaliti[] = ['bajar', 'sana', 'muhim', 'takror']

export type TanishuvHolati = {
  v?: number
  /** Ilova tanishuv paydo bo'lishidan oldin ishlatilgan hisob */
  eski?: boolean
  /** Kutib olish ekranlari ko'rildi (yoki o'tkazib yuborildi) */
  kutibOlindi?: boolean
  /** Birinchi tanlangan maqsad — misollar va papka taklifi shunga moslashadi */
  maqsad?: Maqsad
  /** Hamma tanlangan maqsadlar (bir nechta bo'lishi mumkin) */
  maqsadlar?: Maqsad[]
  /** Ilova haqida qayerdan eshitgan */
  manba?: Manba
  /** Tanishuv boshlangan vaqt (ISO) — "o'zing vazifa qo'sh" darsi uchun */
  boshlangan?: string
  papkaId?: string
  /** Dars → mashq vazifasining id'si */
  vazifalar?: Partial<Record<DarsKaliti, string>>
  bajarilgan?: DarsKaliti[]
  /** Tanishuv paneli yopildi (odam "keyinroq" dedi yoki tugatdi) */
  yopilgan?: boolean
  /** Hammasi bajarildi va tabrik ko'rsatildi */
  tugadi?: boolean
  /** Ko'rilgan bir martalik maslahatlar (yo'l kalitlari) */
  maslahatlar?: string[]
}

const LOKAL_KALIT = 'samara.tanishuv'

/** JSON'dan kelgan qiymatni xavfsiz holatga aylantiradi */
export function holatniOqi(qiymat: unknown): TanishuvHolati | null {
  if (!qiymat || typeof qiymat !== 'object' || Array.isArray(qiymat)) return null
  return qiymat as TanishuvHolati
}

export function lokalHolat(foydalanuvchiId: string): TanishuvHolati | null {
  try {
    const xom = window.localStorage.getItem(`${LOKAL_KALIT}.${foydalanuvchiId}`)
    return xom ? holatniOqi(JSON.parse(xom)) : null
  } catch {
    return null
  }
}

export function lokalSaqla(foydalanuvchiId: string, holat: TanishuvHolati) {
  try {
    window.localStorage.setItem(
      `${LOKAL_KALIT}.${foydalanuvchiId}`,
      JSON.stringify(holat)
    )
  } catch {
    // Xususiy rejim — hisobdagi nusxa baribir bor
  }
}

/**
 * Ikki nusxani birlashtiradi (qurilma va hisob).
 *
 * Har bir ro'yxat birlashtiriladi, bayroqlar esa "yoki" bilan: bitta
 * qurilmada bajarilgan dars ikkinchisida bajarilmagan bo'lib qolmasin.
 */
export function birlashtir(
  a: TanishuvHolati | null,
  b: TanishuvHolati | null
): TanishuvHolati | null {
  if (!a) return b
  if (!b) return a
  const birlik = <T,>(x?: T[], y?: T[]) =>
    Array.from(new Set([...(x ?? []), ...(y ?? [])]))
  return {
    ...b,
    ...a,
    eski: a.eski || b.eski,
    kutibOlindi: a.kutibOlindi || b.kutibOlindi,
    yopilgan: a.yopilgan || b.yopilgan,
    tugadi: a.tugadi || b.tugadi,
    papkaId: a.papkaId ?? b.papkaId,
    maqsad: a.maqsad ?? b.maqsad,
    maqsadlar: a.maqsadlar ?? b.maqsadlar,
    manba: a.manba ?? b.manba,
    boshlangan: a.boshlangan ?? b.boshlangan,
    vazifalar: { ...(b.vazifalar ?? {}), ...(a.vazifalar ?? {}) },
    bajarilgan: birlik(a.bajarilgan, b.bajarilgan),
    maslahatlar: birlik(a.maslahatlar, b.maslahatlar),
  }
}

/** Kutib olish ko'rsatilishi kerakmi */
export function kutibOlishKerak(holat: TanishuvHolati | null): boolean {
  if (!holat) return true
  return !holat.eski && !holat.kutibOlindi
}

/** Tanishuv paneli (darslar ro'yxati) ko'rinadimi */
export function panelFaol(holat: TanishuvHolati | null): boolean {
  return Boolean(holat?.kutibOlindi && holat.papkaId && !holat.yopilgan && !holat.tugadi)
}

// -------------------------------------------------------------
// Bir martalik maslahatlar
// -------------------------------------------------------------

/** Yo'l → maslahat matni. Bo'limga birinchi kirilganda bir marta chiqadi */
export const MASLAHATLAR: Record<string, { sarlavha: MatnKaliti; matn: MatnKaliti }> = {
  '/bugun': { sarlavha: 'tanishuv.maslahat.bugun.s', matn: 'tanishuv.maslahat.bugun.m' },
  '/jarayonda': { sarlavha: 'tanishuv.maslahat.jarayonda.s', matn: 'tanishuv.maslahat.jarayonda.m' },
  '/kelgusi': { sarlavha: 'tanishuv.maslahat.kelgusi.s', matn: 'tanishuv.maslahat.kelgusi.m' },
  '/korish': { sarlavha: 'tanishuv.maslahat.korish.s', matn: 'tanishuv.maslahat.korish.m' },
  '/kechki-reja': { sarlavha: 'tanishuv.maslahat.kechki.s', matn: 'tanishuv.maslahat.kechki.m' },
  '/hisobot': { sarlavha: 'tanishuv.maslahat.hisobot.s', matn: 'tanishuv.maslahat.hisobot.m' },
  '/topshiriqlar': { sarlavha: 'tanishuv.maslahat.topshiriq.s', matn: 'tanishuv.maslahat.topshiriq.m' },
}

/** Yo'lni maslahat kalitiga keltiradi (oxiridagi "/" ni olib tashlaydi) */
export function maslahatKaliti(yol: string): string | null {
  const toza = yol.length > 1 ? yol.replace(/\/+$/, '') : yol
  return MASLAHATLAR[toza] ? toza : null
}

// -------------------------------------------------------------
// Mashq papkasi matnlari
// -------------------------------------------------------------

/**
 * Mashq vazifalari matni papka yaratilgan paytdagi tilda yoziladi.
 *
 * Nega i18n kalitlari emas: bu oddiy vazifalar — odam ularni
 * tahrirlaydi, ko'chiradi. Til almashganda o'zi o'zgarib qolsa, bu
 * uning yozganini o'chirib yuborgandek tuyulardi.
 */
export function mashqMatnlari(til: Til): {
  papka: string
  vazifalar: Record<'bajar' | 'sana' | 'muhim' | 'takror', { nom: string; izoh: string }>
} {
  if (til === 'ru') {
    return {
      papka: 'Знакомство',
      vazifalar: {
        bajar: {
          nom: '👆 Отметь меня выполненной — нажми на кружок слева',
          izoh: 'Сделал дело — отметь. Так приложение считает твои успехи.',
        },
        sana: {
          nom: '📅 Поставь мне дату — нажми на меня и выбери «Завтра»',
          izoh: 'Задачи с датой сами появляются в разделах «Сегодня» и «Предстоящие».',
        },
        muhim: {
          nom: '🚩 Сделай меня важной — выбери красный флажок',
          izoh: 'Важные задачи выделяются цветом, и их невозможно пропустить.',
        },
        takror: {
          nom: '🔁 Сделай меня ежедневной — включи «Повтор»',
          izoh: 'Для привычек: спорт, чтение, лекарства. Отметишь сегодня — завтра задача вернётся сама.',
        },
      },
    }
  }
  if (til === 'en') {
    return {
      papka: 'Getting started',
      vazifalar: {
        bajar: {
          nom: '👆 Mark me as done — tap the circle on the left',
          izoh: 'Finished something? Tick it off. That is how the app counts your wins.',
        },
        sana: {
          nom: '📅 Give me a date — tap me and choose “Tomorrow”',
          izoh: 'Tasks with a date show up in Today and Upcoming on their own.',
        },
        muhim: {
          nom: '🚩 Make me important — pick the red flag',
          izoh: 'Important tasks get a colour so you never miss them.',
        },
        takror: {
          nom: '🔁 Make me repeat every day — turn on “Repeat”',
          izoh: 'Great for habits: sport, reading, medicine. Tick it today and it comes back tomorrow.',
        },
      },
    }
  }
  return {
    papka: 'Tanishuv',
    vazifalar: {
      bajar: {
        nom: '👆 Meni bajarilgan qil — chapdagi doirachani bos',
        izoh: 'Ishni qildingizmi — belgilang. Ilova yutuqlaringizni shunday sanaydi.',
      },
      sana: {
        nom: '📅 Menga sana qo‘y — ustimga bos va «Ertaga»ni tanla',
        izoh: 'Sanasi bor vazifa «Bugun» va «Kelgusi» bo‘limlariga o‘zi tushadi.',
      },
      muhim: {
        nom: '🚩 Meni muhim qil — qizil bayroqchani tanla',
        izoh: 'Muhim vazifa rangli bo‘lib turadi — uni hech qachon o‘tkazib yubormaysiz.',
      },
      takror: {
        nom: '🔁 Meni har kuni takrorlanadigan qil — «Takrorlanish»ni yoq',
        izoh: 'Odatlar uchun: sport, kitob, dori. Bugun belgilasangiz — ertaga o‘zi qaytib keladi.',
      },
    },
  }
}
