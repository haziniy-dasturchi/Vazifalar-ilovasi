import { bugunISO } from '@/lib/sana'
import { qoidaniMatnga, soddalashtir, type TakrorQoidasi } from '@/lib/takrorlanish'
import { LUGATLAR, type Lugat } from './lugat'
import type { Til } from '@/lib/i18n'
import type { TaskPriority } from '@/types/vazifalar'

/**
 * Vazifa nomidagi kalit so'zlarni tanish (Todoist uslubida).
 *
 * "To'lov qilganda sms yuborish har 1" degan matndan:
 *   nom        -> "To'lov qilganda sms yuborish"
 *   takrorlanish -> har oyning 1-sanasida
 *
 * --- Noaniqlikni hal qilish qoidalari ---
 * Bular ataylab qattiq, chunki noto'g'ri tanish eng yomon natija:
 * odam "Ahror akaga 7 ta kitob" deb yozadi, ilova esa buni sana
 * yoki vaqt deb o'zgartirib yuboradi va ishonch yo'qoladi.
 *
 *  1. `har` / `every` / `каждое` dan KEYIN darhol kelgan son —
 *     oyning sanasi ("har 15" = har oyning 15-sanasi).
 *  2. Sana, hafta kuni yoki takrorlanishdan KEYIN kelgan yolg'iz
 *     son (0..23) — vaqt ("ertaga 9" = ertaga soat 09:00).
 *  3. Boshqa hollarda yolg'iz son HECH QACHON sana yoki vaqt emas.
 *     Vaqt alohida faqat `HH:MM` yoki `soat N` ko'rinishida.
 *  4. Kalit so'z faqat BUTUN so'z sifatida taniladi.
 *  5. Qisqa hafta kuni nomlari (`du`, `se`...) faqat `har` dan
 *     keyin taniladi — ular oddiy matnda juda tez-tez uchraydi.
 */

export type BelgiTuri = 'sana' | 'vaqt' | 'takror' | 'muhimlik'

export type Belgi = {
  tur: BelgiTuri
  /** Asl matndagi o'rni */
  boshi: number
  oxiri: number
  /** Belgilangan matn (bekor qilish ro'yxati shu bo'yicha ishlaydi) */
  matn: string
}

export type ParseNatijasi = {
  /** Kalit so'zlar olib tashlangan va bo'shliqlari tozalangan nom */
  nom: string
  belgilar: Belgi[]
  /** YYYY-MM-DD */
  sana: string | null
  /** HH:MM */
  vaqt: string | null
  /** RFC 5545 RRULE matni */
  rrule: string | null
  muhimlik: TaskPriority | null
}

export type ParseSozlamalari = {
  til: Til
  /** Bugungi sana — testlar uchun berib yuboriladi */
  bugun?: string
  /**
   * Foydalanuvchi bekor qilgan belgilar (matni bo'yicha).
   * Bu ro'yxatdagi matnlar boshqa tanilmaydi va oddiy matn
   * bo'lib qoladi.
   */
  bekorlar?: string[]
}

// -------------------------------------------------------------
// Tokenlash
// -------------------------------------------------------------
type Token = {
  xom: string
  /** Kichik harf, chetdagi tinish belgilarisiz */
  soz: string
  boshi: number
  oxiri: number
}

/** Chetdagi tinish belgilari — so'zning bir qismi emas */
const CHET = /^[^\p{L}\p{N}:.\-]+|[^\p{L}\p{N}:]+$/gu

function tokenlar(matn: string): Token[] {
  const natija: Token[] = []
  for (const m of matn.matchAll(/\S+/g)) {
    const xom = m[0]
    const boshi = m.index ?? 0
    const soz = xom.toLowerCase().replace(CHET, '')
    if (soz) natija.push({ xom, soz, boshi, oxiri: boshi + xom.length })
  }
  return natija
}

function sonmi(s: string): boolean {
  return /^\d{1,2}$/.test(s)
}

function royxatda(soz: string, royxat: string[]): boolean {
  return royxat.includes(soz)
}

/** Hafta kuni indeksini qaytaradi (0 = dushanba) yoki -1 */
function kunIndeksi(soz: string, royxatlar: string[][]): number {
  return royxatlar.findIndex((variantlar) => variantlar.includes(soz))
}

// -------------------------------------------------------------
// Sana yordamchilari (hammasi matn ustida, Date siljishisiz)
// -------------------------------------------------------------
function isoQismlar(iso: string): [number, number, number] {
  const [y, o, k] = iso.split('-').map((n) => Number.parseInt(n, 10))
  return [y, o, k]
}

function isoYasa(y: number, o: number, k: number): string {
  return `${String(y).padStart(4, '0')}-${String(o).padStart(2, '0')}-${String(k).padStart(2, '0')}`
}

function kunQoshish(iso: string, kun: number): string {
  const [y, o, k] = isoQismlar(iso)
  const d = new Date(Date.UTC(y, o - 1, k + kun))
  return isoYasa(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

/** 0 = dushanba ... 6 = yakshanba */
function haftaKuni(iso: string): number {
  const [y, o, k] = isoQismlar(iso)
  return (new Date(Date.UTC(y, o - 1, k)).getUTCDay() + 6) % 7
}

/** Keyingi shu hafta kuni (bugun bo'lsa — keyingi haftaga) */
function keyingiKun(bugun: string, maqsad: number): string {
  const farq = (maqsad - haftaKuni(bugun) + 7) % 7
  return kunQoshish(bugun, farq === 0 ? 7 : farq)
}

/** Kun va oydan sana; o'tib ketgan bo'lsa keyingi yil */
function sanaYasa(bugun: string, kun: number, oy: number): string | null {
  if (oy < 1 || oy > 12 || kun < 1 || kun > 31) return null
  const [yil] = isoQismlar(bugun)
  const oxirgi = new Date(Date.UTC(yil, oy, 0)).getUTCDate()
  if (kun > oxirgi) return null
  const shuYil = isoYasa(yil, oy, kun)
  return shuYil >= bugun ? shuYil : isoYasa(yil + 1, oy, kun)
}

function vaqtYasa(soat: number, daqiqa = 0): string | null {
  if (soat < 0 || soat > 23 || daqiqa < 0 || daqiqa > 59) return null
  return `${String(soat).padStart(2, '0')}:${String(daqiqa).padStart(2, '0')}`
}

// -------------------------------------------------------------
// Asosiy funksiya
// -------------------------------------------------------------
export function kalitSozlarniAjrat(
  matn: string,
  sozlama: ParseSozlamalari
): ParseNatijasi {
  const lugat = LUGATLAR[sozlama.til] ?? LUGATLAR.uz
  const bugun = sozlama.bugun ?? bugunISO()
  const bekorlar = new Set(
    (sozlama.bekorlar ?? []).map((b) => b.trim().toLowerCase())
  )

  const tk = tokenlar(matn)
  const belgilar: Belgi[] = []

  let sana: string | null = null
  let vaqt: string | null = null
  let rrule: string | null = null
  let muhimlik: TaskPriority | null = null

  /** Oxirgi tanilgan sana/takror tokenining indeksi — "ertaga 9" uchun */
  let sanaKontekstiOxiri = -1

  let i = 0
  while (i < tk.length) {
    const natija =
      muhimlikniTani(tk, i) ??
      takrorniTani(tk, i, lugat) ??
      sananiTani(tk, i, lugat, bugun) ??
      vaqtniTani(tk, i, lugat, sanaKontekstiOxiri)

    if (!natija) {
      i += 1
      continue
    }

    const boshi = tk[i].boshi
    const oxiri = tk[i + natija.soni - 1].oxiri
    const belgiMatni = matn.slice(boshi, oxiri)

    // Foydalanuvchi bu belgini bekor qilgan — oddiy matn bo'lib qoladi
    if (bekorlar.has(belgiMatni.trim().toLowerCase())) {
      i += natija.soni
      continue
    }

    // Bir xil tur ikki marta uchrasa, birinchisi kuchda qoladi
    const bandmi =
      (natija.tur === 'sana' && sana !== null) ||
      (natija.tur === 'vaqt' && vaqt !== null) ||
      (natija.tur === 'takror' && rrule !== null) ||
      (natija.tur === 'muhimlik' && muhimlik !== null)

    if (bandmi) {
      i += natija.soni
      continue
    }

    if (natija.tur === 'sana') sana = natija.sana ?? null
    if (natija.tur === 'vaqt') vaqt = natija.vaqt ?? null
    if (natija.tur === 'takror') rrule = natija.rrule ?? null
    if (natija.tur === 'muhimlik') muhimlik = natija.muhimlik ?? null

    belgilar.push({ tur: natija.tur, boshi, oxiri, matn: belgiMatni })

    if (natija.tur === 'sana' || natija.tur === 'takror') {
      sanaKontekstiOxiri = i + natija.soni - 1
    }
    i += natija.soni
  }

  return {
    nom: nomniTozala(matn, belgilar),
    belgilar,
    sana,
    vaqt,
    rrule,
    muhimlik,
  }
}

/** Belgilangan bo'laklarni olib tashlaydi va bo'shliqlarni tozalaydi */
export function nomniTozala(matn: string, belgilar: Belgi[]): string {
  let natija = ''
  let oxirgi = 0
  for (const b of [...belgilar].sort((a, b) => a.boshi - b.boshi)) {
    natija += matn.slice(oxirgi, b.boshi)
    oxirgi = b.oxiri
  }
  natija += matn.slice(oxirgi)
  return natija.replace(/\s{2,}/g, ' ').trim()
}

// -------------------------------------------------------------
// Taniguvchilar
// -------------------------------------------------------------
type Topilma = {
  tur: BelgiTuri
  /** Nechta token band qilindi */
  soni: number
  sana?: string
  vaqt?: string
  rrule?: string
  muhimlik?: TaskPriority
}

function muhimlikniTani(tk: Token[], i: number): Topilma | null {
  const m = tk[i].soz.match(/^p([1-4])$/)
  if (!m) return null
  return {
    tur: 'muhimlik',
    soni: 1,
    muhimlik: Number.parseInt(m[1], 10) as TaskPriority,
  }
}

function takrorniTani(
  tk: Token[],
  i: number,
  lugat: Lugat
): Topilma | null {
  // "по будням" / "weekdays" — `har` siz ham ishlaydi
  const ishKunlariSoni = iboraSoni(tk, i, lugat.ishKunlari)
  if (ishKunlariSoni) {
    return {
      tur: 'takror',
      soni: ishKunlariSoni,
      rrule: qoida({ birlik: 'hafta', kunlar: [1, 2, 3, 4, 5] }),
    }
  }

  if (!royxatda(tk[i].soz, lugat.har)) return null

  const keyin = tk[i + 1]
  if (!keyin) return null

  // "har 2 kunda" — son + birlik
  if (sonmi(keyin.soz)) {
    const birlik = birlikTuri(tk[i + 2]?.soz ?? '', lugat)
    if (birlik) {
      const n = Number.parseInt(keyin.soz, 10)
      if (n < 1) return null
      return {
        tur: 'takror',
        soni: 3,
        rrule: qoida({ birlik, interval: n }),
      }
    }

    // "har 15" — oyning sanasi (1-qoida)
    const kun = Number.parseInt(keyin.soz, 10)
    if (kun < 1 || kun > 31) return null
    return {
      tur: 'takror',
      soni: 2,
      rrule: qoida({ birlik: 'oy', oyKunlari: [kun] }),
    }
  }

  // "har ish kunlari"
  const ishSoni = iboraSoni(tk, i + 1, lugat.ishKunlari)
  if (ishSoni) {
    return {
      tur: 'takror',
      soni: 1 + ishSoni,
      rrule: qoida({ birlik: 'hafta', kunlar: [1, 2, 3, 4, 5] }),
    }
  }

  // "har kuni" / "har hafta" / "har oy" / "har yil"
  const birlik = birlikTuri(keyin.soz, lugat)
  if (birlik) {
    return { tur: 'takror', soni: 2, rrule: qoida({ birlik }) }
  }

  // "har se" / "har du va pay" — hafta kunlari zanjiri
  const kunlar: number[] = []
  let j = i + 1
  while (j < tk.length) {
    const qisqa = kunIndeksi(tk[j].soz, lugat.kunQisqa)
    const toliq = kunIndeksi(tk[j].soz, lugat.kunToliq)
    const indeks = qisqa !== -1 ? qisqa : toliq
    if (indeks === -1) break

    kunlar.push(indeks + 1)
    j += 1
    // "va" / "and" / "и" bo'lsa zanjir davom etadi
    if (j < tk.length && royxatda(tk[j].soz, lugat.va)) {
      const keyingi = tk[j + 1]
      const bormi =
        keyingi &&
        (kunIndeksi(keyingi.soz, lugat.kunQisqa) !== -1 ||
          kunIndeksi(keyingi.soz, lugat.kunToliq) !== -1)
      if (bormi) {
        j += 1
        continue
      }
    }
    break
  }

  if (kunlar.length > 0) {
    return {
      tur: 'takror',
      soni: j - i,
      rrule: qoida({ birlik: 'hafta', kunlar }),
    }
  }

  return null
}

function sananiTani(
  tk: Token[],
  i: number,
  lugat: Lugat,
  bugun: string
): Topilma | null {
  const soz = tk[i].soz

  if (royxatda(soz, lugat.bugun)) {
    return { tur: 'sana', soni: 1, sana: bugun }
  }
  if (royxatda(soz, lugat.ertaga)) {
    return { tur: 'sana', soni: 1, sana: kunQoshish(bugun, 1) }
  }
  if (royxatda(soz, lugat.indinga)) {
    return { tur: 'sana', soni: 1, sana: kunQoshish(bugun, 2) }
  }

  // To'liq hafta kuni nomi yolg'iz ham taniladi; qisqasi — yo'q
  // (5-qoida: "du", "se" oddiy matnda juda tez-tez uchraydi)
  const toliqKun = kunIndeksi(soz, lugat.kunToliq)
  if (toliqKun !== -1) {
    return { tur: 'sana', soni: 1, sana: keyingiKun(bugun, toliqKun) }
  }

  // "25.11" yoki "25.11.2027"
  const nuqtali = soz.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?$/)
  if (nuqtali) {
    const kun = Number.parseInt(nuqtali[1], 10)
    const oy = Number.parseInt(nuqtali[2], 10)
    const sana = sanaYasa(bugun, kun, oy)
    if (sana) return { tur: 'sana', soni: 1, sana }
    return null
  }

  // "25-noyabr" — bitta tokenda
  const chiziqli = soz.match(/^(\d{1,2})-(\p{L}+)$/u)
  if (chiziqli) {
    const oy = oyIndeksi(chiziqli[2], lugat)
    if (oy !== -1) {
      const sana = sanaYasa(bugun, Number.parseInt(chiziqli[1], 10), oy + 1)
      if (sana) return { tur: 'sana', soni: 1, sana }
    }
    return null
  }

  // "25 noyabr" / "25 ноября"
  if (sonmi(soz) && tk[i + 1]) {
    const oy = oyIndeksi(tk[i + 1].soz, lugat)
    if (oy !== -1) {
      const sana = sanaYasa(bugun, Number.parseInt(soz, 10), oy + 1)
      if (sana) return { tur: 'sana', soni: 2, sana }
    }
  }

  // "nov 25"
  const oy = oyIndeksi(soz, lugat)
  if (oy !== -1 && tk[i + 1] && sonmi(tk[i + 1].soz)) {
    const sana = sanaYasa(bugun, Number.parseInt(tk[i + 1].soz, 10), oy + 1)
    if (sana) return { tur: 'sana', soni: 2, sana }
  }

  return null
}

function vaqtniTani(
  tk: Token[],
  i: number,
  lugat: Lugat,
  sanaKontekstiOxiri: number
): Topilma | null {
  const soz = tk[i].soz

  // "12:00"
  const ikkiNuqta = soz.match(/^(\d{1,2}):(\d{2})$/)
  if (ikkiNuqta) {
    const vaqt = vaqtYasa(
      Number.parseInt(ikkiNuqta[1], 10),
      Number.parseInt(ikkiNuqta[2], 10)
    )
    if (vaqt) return { tur: 'vaqt', soni: 1, vaqt }
    return null
  }

  // "12pm" / "9am"
  const yarim = soz.match(/^(\d{1,2})(am|pm)$/)
  if (yarim) {
    let soat = Number.parseInt(yarim[1], 10)
    if (soat >= 1 && soat <= 12) {
      if (yarim[2] === 'pm' && soat !== 12) soat += 12
      if (yarim[2] === 'am' && soat === 12) soat = 0
      const vaqt = vaqtYasa(soat)
      if (vaqt) return { tur: 'vaqt', soni: 1, vaqt }
    }
    return null
  }

  // "soat 12" / "at 9" / "в 12"
  if (royxatda(soz, lugat.soat) && tk[i + 1]) {
    const keyin = tk[i + 1].soz
    const toliq = keyin.match(/^(\d{1,2}):(\d{2})$/)
    if (toliq) {
      const vaqt = vaqtYasa(
        Number.parseInt(toliq[1], 10),
        Number.parseInt(toliq[2], 10)
      )
      if (vaqt) return { tur: 'vaqt', soni: 2, vaqt }
    }
    if (sonmi(keyin)) {
      const vaqt = vaqtYasa(Number.parseInt(keyin, 10))
      if (vaqt) return { tur: 'vaqt', soni: 2, vaqt }
    }
    return null
  }

  // Yolg'iz son — faqat sana yoki takrordan DARHOL keyin (2-qoida).
  // `sanaKontekstiOxiri < 0` bo'lsa kontekst umuman yo'q: matn
  // boshidagi son ("10 kishiga xabar berish") vaqt bo'lmasligi kerak.
  if (sonmi(soz) && sanaKontekstiOxiri >= 0 && i === sanaKontekstiOxiri + 1) {
    const vaqt = vaqtYasa(Number.parseInt(soz, 10))
    if (vaqt) return { tur: 'vaqt', soni: 1, vaqt }
  }

  return null
}

// -------------------------------------------------------------
// Kichik yordamchilar
// -------------------------------------------------------------

/** Ko'p so'zli ibora mos keldimi; mos kelsa nechta token bandligi */
function iboraSoni(tk: Token[], i: number, iboralar: string[][]): number {
  for (const ibora of iboralar) {
    if (ibora.every((s, n) => tk[i + n]?.soz === s)) return ibora.length
  }
  return 0
}

function birlikTuri(
  soz: string,
  lugat: Lugat
): 'kun' | 'hafta' | 'oy' | 'yil' | null {
  if (royxatda(soz, lugat.birlik.kun)) return 'kun'
  if (royxatda(soz, lugat.birlik.hafta)) return 'hafta'
  if (royxatda(soz, lugat.birlik.oy)) return 'oy'
  if (royxatda(soz, lugat.birlik.yil)) return 'yil'
  return null
}

function oyIndeksi(soz: string, lugat: Lugat): number {
  return lugat.oylar.findIndex((variantlar) => variantlar.includes(soz))
}

/** Qoidadan RRULE — faqat kerakli maydonlar beriladi */
function qoida(qism: Partial<TakrorQoidasi> & { birlik: TakrorQoidasi['birlik'] }): string {
  // `soddalashtir`: hamma yetti kun tanlansa "har kuni", du-ju
  // tanlansa "ish kunlari" bo'ladi — bitta jadval ikki xil
  // nomlanib qolmasligi uchun
  const matn = qoidaniMatnga({
    interval: 1,
    kunlar: [],
    oyKunlari: [],
    haftaOrni: null,
    oyHaftaKuni: null,
    oyUsuli: 'sana',
    tugash: { tur: 'hech' },
    ...qism,
  })
  return soddalashtir(matn) ?? matn
}
