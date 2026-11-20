/**
 * Takrorlanish qoidasi — RFC 5545 RRULE.
 *
 * Nega standart format: tayyor variantlar ham ("har kuni"), odam
 * o'zi yig'gan murakkab jadval ham ("har oyning 2-seshanbasi,
 * 10 marta") BITTA model bilan ifodalanadi. Bazada bitta matn
 * ustuni, mijozda bitta funksiya. Avvalgi `daily | weekdays |
 * weekly | monthly | days:2,3` ro'yxati har yangi talabda
 * uzayib borardi.
 *
 * Saqlanadigan matn DTSTART'siz, faqat qoidaning o'zi:
 *   FREQ=MONTHLY;BYMONTHDAY=15
 *   FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH;COUNT=10
 *
 * Boshlanish sanasi alohida ustunda (`rrule_start`). Sababi:
 * vazifa har bajarilganda `due_date` oldinga suriladi, DTSTART
 * esa o'zgarmasligi kerak — aks holda "10 marta" yoki
 * "shu sanagacha" degan chegara har safar qaytadan sanalardi.
 */

/** Qanchalik tez-tez */
export const BIRLIKLAR = ['kun', 'hafta', 'oy', 'yil'] as const
export type Birlik = (typeof BIRLIKLAR)[number]

/** Oylik takrorlanishni ikki xil berish mumkin */
export const OY_USULLARI = ['sana', 'haftaKuni'] as const
export type OyUsuli = (typeof OY_USULLARI)[number]

/** `oyKunlari` ichidagi shu qiymat — "oyning oxirgi kuni" */
export const OXIRGI_KUN = -1

export type Tugash =
  | { tur: 'hech' }
  | { tur: 'sana'; sana: string }
  | { tur: 'marta'; soni: number }

/** Oynada tahrirlanadigan, o'qishga qulay ko'rinish */
export type TakrorQoidasi = {
  birlik: Birlik
  /** 1 dan katta bo'lsa "har N kunda/haftada/oyda/yilda" */
  interval: number
  /** Hafta kunlari, ISO: 1 = dushanba ... 7 = yakshanba */
  kunlar: number[]
  /** Oy kunlari: 1..31 yoki OXIRGI_KUN */
  oyKunlari: number[]
  /** Oyning nechanchi hafta kuni: 1..4 yoki -1 (oxirgi) */
  haftaOrni: number | null
  /** Qaysi hafta kuni (ISO), `haftaOrni` bilan birga */
  oyHaftaKuni: number | null
  oyUsuli: OyUsuli
  tugash: Tugash
}

export const BOSH_QOIDA: TakrorQoidasi = {
  birlik: 'hafta',
  interval: 1,
  kunlar: [],
  oyKunlari: [],
  haftaOrni: null,
  oyHaftaKuni: null,
  oyUsuli: 'sana',
  tugash: { tur: 'hech' },
}

// -------------------------------------------------------------
// Hafta kunlari: ISO <-> RRULE
// -------------------------------------------------------------
const KUN_KODI = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const

/** ISO (1..7) -> 'MO'..'SU' */
export function kunKodi(iso: number): string {
  return KUN_KODI[iso - 1] ?? 'MO'
}

/** 'MO'..'SU' -> ISO (1..7); noma'lum bo'lsa 0 */
export function kodKuni(kod: string): number {
  const i = KUN_KODI.indexOf(kod.toUpperCase() as (typeof KUN_KODI)[number])
  return i === -1 ? 0 : i + 1
}

const FREQ: Record<Birlik, string> = {
  kun: 'DAILY',
  hafta: 'WEEKLY',
  oy: 'MONTHLY',
  yil: 'YEARLY',
}

// -------------------------------------------------------------
// Tayyor variantlar
// -------------------------------------------------------------
export const HAR_KUNI = 'FREQ=DAILY'
export const ISH_KUNLARI = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
export const HAR_HAFTA = 'FREQ=WEEKLY'
export const HAR_OY = 'FREQ=MONTHLY'

// -------------------------------------------------------------
// Yig'ish
// -------------------------------------------------------------

/**
 * "Oyning N-sanasi, qisqa oyda esa oxirgi kuni" ni standart
 * RRULE bilan ifodalash.
 *
 * Hiyla RFC 5545 ning o'zida bor: `BYMONTHDAY=28,29,30;BYSETPOS=-1`
 * degani "shu kunlardan oyda mavjud bo'lgan OXIRGISI". Fevralda bu
 * 28, aprelda 30, yanvarda 30 bo'ladi — aynan bizga kerak xatti-
 * harakat. Shu sababli standartdan chetga chiqish shart emas va
 * qoidani boshqa dastur ham to'g'ri o'qiydi.
 */
function oySanasiQismlari(kun: number): string[] {
  if (kun === OXIRGI_KUN) return ['BYMONTHDAY=-1']
  if (kun <= 28) return [`BYMONTHDAY=${kun}`]
  const royxat: number[] = []
  for (let k = 28; k <= kun; k += 1) royxat.push(k)
  return [`BYMONTHDAY=${royxat.join(',')}`, 'BYSETPOS=-1']
}

/** Qoidadan RRULE matnini yasaydi */
export function qoidaniMatnga(q: TakrorQoidasi): string {
  const qismlar: string[] = [`FREQ=${FREQ[q.birlik]}`]

  if (q.interval > 1) qismlar.push(`INTERVAL=${q.interval}`)

  if (q.birlik === 'hafta' && q.kunlar.length > 0) {
    const tartib = [...new Set(q.kunlar)].sort((a, b) => a - b)
    qismlar.push(`BYDAY=${tartib.map(kunKodi).join(',')}`)
  }

  if (q.birlik === 'oy') {
    if (q.oyUsuli === 'haftaKuni' && q.haftaOrni && q.oyHaftaKuni) {
      qismlar.push(`BYDAY=${q.haftaOrni}${kunKodi(q.oyHaftaKuni)}`)
    } else if (q.oyKunlari.length === 1) {
      qismlar.push(...oySanasiQismlari(q.oyKunlari[0]))
    } else if (q.oyKunlari.length > 1) {
      // Bir nechta sana tanlansa BYSETPOS ishlatib bo'lmaydi (u butun
      // to'plamga qo'llanadi). Shuning uchun bu yerda standart xatti-
      // harakat qoladi: 31-sana 30 kunlik oyda o'tkazib yuboriladi.
      const tartib = [...new Set(q.oyKunlari)].sort((a, b) => a - b)
      qismlar.push(`BYMONTHDAY=${tartib.join(',')}`)
    }
  }

  if (q.tugash.tur === 'sana') {
    qismlar.push(`UNTIL=${q.tugash.sana.replaceAll('-', '')}`)
  } else if (q.tugash.tur === 'marta') {
    qismlar.push(`COUNT=${q.tugash.soni}`)
  }

  return qismlar.join(';')
}

// -------------------------------------------------------------
// Ajratish
// -------------------------------------------------------------

export type RruleQismlari = Record<string, string>

/** `FREQ=WEEKLY;BYDAY=MO` -> { FREQ: 'WEEKLY', BYDAY: 'MO' } */
export function rruleQismlari(rrule: string): RruleQismlari {
  const natija: RruleQismlari = {}
  for (const bolak of rrule.replace(/^RRULE:/i, '').split(';')) {
    const [kalit, qiymat] = bolak.split('=')
    if (kalit && qiymat) natija[kalit.trim().toUpperCase()] = qiymat.trim()
  }
  return natija
}

const BIRLIK_FREQ: Record<string, Birlik> = {
  DAILY: 'kun',
  WEEKLY: 'hafta',
  MONTHLY: 'oy',
  YEARLY: 'yil',
}

/**
 * RRULE matnini oynada tahrirlash mumkin bo'lgan ko'rinishga
 * qaytaradi. Tushunarsiz qiymat bo'lsa `null`.
 */
export function matndanQoida(rrule: string | null): TakrorQoidasi | null {
  if (!rrule) return null
  const q = rruleQismlari(rrule)
  const birlik = BIRLIK_FREQ[q.FREQ ?? '']
  if (!birlik) return null

  const qoida: TakrorQoidasi = {
    ...BOSH_QOIDA,
    birlik,
    interval: Math.max(1, Number.parseInt(q.INTERVAL ?? '1', 10) || 1),
    kunlar: [],
    oyKunlari: [],
    tugash: { tur: 'hech' },
  }

  const byday = q.BYDAY ? q.BYDAY.split(',').filter(Boolean) : []

  if (birlik === 'hafta') {
    qoida.kunlar = byday.map((k) => kodKuni(k)).filter((n) => n > 0)
  }

  if (birlik === 'oy') {
    // "Oyning 2-seshanbasi" ko'rinishi: BYDAY=2TU yoki BYDAY=-1FR
    const nthMoslik = byday[0]?.match(/^(-?\d+)([A-Z]{2})$/i)
    if (nthMoslik) {
      qoida.oyUsuli = 'haftaKuni'
      qoida.haftaOrni = Number.parseInt(nthMoslik[1], 10)
      qoida.oyHaftaKuni = kodKuni(nthMoslik[2])
    } else if (q.BYMONTHDAY) {
      qoida.oyUsuli = 'sana'
      const kunlar = q.BYMONTHDAY.split(',')
        .map((k) => Number.parseInt(k, 10))
        .filter((n) => Number.isInteger(n))
      // `BYSETPOS=-1` + ketma-ket 28..N — bu "N-sana yoki oyning
      // oxirgi kuni" degani; oynada bitta son bo'lib ko'rinishi kerak
      qoida.oyKunlari =
        q.BYSETPOS === '-1' && kunlar.length > 1
          ? [Math.max(...kunlar)]
          : kunlar
    }
  }

  if (q.UNTIL) {
    const s = q.UNTIL.slice(0, 8)
    qoida.tugash = {
      tur: 'sana',
      sana: `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`,
    }
  } else if (q.COUNT) {
    const soni = Number.parseInt(q.COUNT, 10)
    if (Number.isInteger(soni) && soni > 0) {
      qoida.tugash = { tur: 'marta', soni }
    }
  }

  return qoida
}

/**
 * Bir xil jadvalning ikki xil yozuvini bittaga keltiradi.
 *
 * Nega kerak: "hamma kun belgilandi" va "har kuni" — bitta narsa.
 * Soddalashtirilmasa vazifa qatorida goh "Har kuni", goh
 * "Du, Se, Chor, Pay, Ju, Sha, Yak" deb yozilardi.
 */
export function soddalashtir(rrule: string | null): string | null {
  if (!rrule) return null
  const q = rruleQismlari(rrule)
  if (q.FREQ !== 'WEEKLY' || q.INTERVAL || q.UNTIL || q.COUNT) return rrule
  if (!q.BYDAY) return rrule

  const kunlar = q.BYDAY.split(',')
    .map(kodKuni)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
    .join(',')

  if (kunlar === '1,2,3,4,5,6,7') return HAR_KUNI
  if (kunlar === '1,2,3,4,5') return ISH_KUNLARI
  return rrule
}

/** Hafta kunlaridan haftalik qoida yasaydi (sana panelidagi tugmalar) */
export function kunlardanRrule(kunlar: number[]): string | null {
  const toza = [...new Set(kunlar)]
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
    .sort((a, b) => a - b)
  if (toza.length === 0) return null
  return soddalashtir(`FREQ=WEEKLY;BYDAY=${toza.map(kunKodi).join(',')}`)
}

/** Qoidadagi hafta kunlari (sana panelidagi tugmalarni yoqish uchun) */
export function rruleKunlari(rrule: string | null): number[] {
  if (!rrule) return []
  const q = rruleQismlari(rrule)
  if (q.FREQ === 'DAILY' && !q.INTERVAL) return [1, 2, 3, 4, 5, 6, 7]
  if (q.FREQ !== 'WEEKLY' || !q.BYDAY) return []
  // "2TU" ko'rinishi haftalik qoidada uchramaydi, lekin kelib qolsa
  // uni kun deb hisoblamaymiz
  return q.BYDAY.split(',')
    .filter((k) => /^[A-Z]{2}$/i.test(k))
    .map(kodKuni)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
}

/** Tayyor to'rt variantdan biri bo'lsa — o'shanisi */
export function tayyorVariant(rrule: string | null): string | null {
  if (!rrule) return null
  const soda = soddalashtir(rrule)
  return [HAR_KUNI, ISH_KUNLARI, HAR_HAFTA, HAR_OY].includes(soda ?? '')
    ? soda
    : null
}
