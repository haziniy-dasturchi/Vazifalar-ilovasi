/**
 * Sana yordamchilari.
 *
 * date-fns ning uz tarjimasi oylarni bosh harf bilan yozadi ("12 Noyabr"),
 * o'zbek tilida esa "12-noyabr" to'g'ri. Shu sababli nomlar shu yerda
 * qo'lda, hisob-kitob esa date-fns bilan.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfWeek,
} from 'date-fns'

export const OYLAR = [
  'yanvar',
  'fevral',
  'mart',
  'aprel',
  'may',
  'iyun',
  'iyul',
  'avgust',
  'sentabr',
  'oktabr',
  'noyabr',
  'dekabr',
] as const

/** 0 = yakshanba ... 6 = shanba (profiles.days_off bilan bir xil) */
export const KUNLAR = [
  'yakshanba',
  'dushanba',
  'seshanba',
  'chorshanba',
  'payshanba',
  'juma',
  'shanba',
] as const

export const QISQA_KUNLAR = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'] as const

/** Bugungi sana, bazadagi `date` ustuni formatida */
export function bugunISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function isoDan(iso: string): Date {
  return parseISO(iso)
}

export function isoGa(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** Bugundan necha kun farq: manfiy = o'tgan, 0 = bugun */
export function kunFarqi(iso: string): number {
  return differenceInCalendarDays(parseISO(iso), new Date())
}

export function kechikkanmi(iso: string | null): boolean {
  return iso !== null && kunFarqi(iso) < 0
}

export function bugunmi(iso: string | null): boolean {
  return iso !== null && kunFarqi(iso) === 0
}

/** "12-noyabr" yoki boshqa yil bo'lsa "12-noyabr 2025" */
export function toliqSana(iso: string): string {
  const d = parseISO(iso)
  const yil = d.getFullYear()
  const joriyYil = new Date().getFullYear()
  const asos = `${d.getDate()}-${OYLAR[d.getMonth()]}`
  return yil === joriyYil ? asos : `${asos} ${yil}`
}

/**
 * Odam o'qiydigan qisqa sana:
 * Kecha / Bugun / Ertaga / yaqin kunlar uchun hafta kuni / aks holda "12-noyabr"
 */
export function sanaMatni(iso: string): string {
  const farq = kunFarqi(iso)
  if (farq === 0) return 'Bugun'
  if (farq === 1) return 'Ertaga'
  if (farq === -1) return 'Kecha'
  if (farq > 1 && farq < 7) {
    const d = parseISO(iso)
    const nom = KUNLAR[d.getDay()]
    return nom.charAt(0).toUpperCase() + nom.slice(1)
  }
  return toliqSana(iso)
}

/** Kechikkan vazifa uchun: "3 kun kechikdi" */
export function kechikishMatni(iso: string): string {
  const kun = Math.abs(kunFarqi(iso))
  if (kun === 1) return 'Kecha edi'
  return `${kun} kun kechikdi`
}

/** Vaqtni "17:00" ko'rinishida (bazada "17:00:00" keladi) */
export function vaqtMatni(vaqt: string | null): string | null {
  if (!vaqt) return null
  return vaqt.slice(0, 5)
}

export type VaqtHolati = 'otgan' | 'hozir' | 'kelgusi'

/**
 * Sana + vaqtga nisbatan uchta holat:
 *  - 'otgan'   — vaqti allaqachon o'tib ketgan
 *  - 'hozir'   — vaqti yaqin (keyingi 30 daqiqa ichida)
 *  - 'kelgusi' — vaqti hali yetib kelmagan
 */
export function vaqtHolati(iso: string, hhmm: string): VaqtHolati {
  const [soat, daqiqa] = hhmm.split(':').map(Number)
  const maqsad = isoDan(iso)
  maqsad.setHours(soat, daqiqa, 0, 0)

  const farqDaqiqa = (maqsad.getTime() - Date.now()) / 60_000
  if (farqDaqiqa < 0) return 'otgan'
  if (farqDaqiqa <= 30) return 'hozir'
  return 'kelgusi'
}

/** Dushanbadan boshlanadigan hafta (Kelgusi sahifasi uchun) */
export function haftaKunlari(boshlanish: Date = new Date(), kun = 7): string[] {
  const bosh = startOfWeek(boshlanish, { weekStartsOn: 1 })
  return Array.from({ length: kun }, (_, i) => isoGa(addDays(bosh, i)))
}

/** Bugundan boshlanadigan N kun */
export function kelgusiKunlar(kun = 7): string[] {
  const bugun = new Date()
  return Array.from({ length: kun }, (_, i) => isoGa(addDays(bugun, i)))
}

/** Sarlavhalar uchun: "30-oktabr, payshanba" */
export function sarlavhaSana(iso: string = bugunISO()): string {
  const d = parseISO(iso)
  return `${d.getDate()}-${OYLAR[d.getMonth()]}, ${KUNLAR[d.getDay()]}`
}
