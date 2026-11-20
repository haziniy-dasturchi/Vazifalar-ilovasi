import { RRule, type Options } from 'rrule'
import { rruleQismlari } from './qoida'

/**
 * Takrorlanuvchi vazifaning keyingi sanasi.
 *
 * --- Nega hisob mijozda ---
 * Avval buni Postgres (`next_occurrence`) qilardi. RRULE ni
 * to'liq PL/pgSQL da yozish juda qimmat, eng muhimi esa: ilova
 * internetsiz ishlashi kerak. Internet yo'q paytda bajarilgan
 * takrorlanuvchi vazifa keyingi sanaga o'zi surilishi shart,
 * server esa o'sha paytda yetib bo'lmas joyda. Shuning uchun
 * sana shu yerda hisoblanadi va `complete_task` ga tayyor
 * holda yuboriladi.
 *
 * --- Nega sanalar matn ko'rinishida ---
 * Bazadagi `due_date` — `date`, ya'ni vaqt mintaqasisiz kun.
 * `Date` obyekti bilan ishlansa, foydalanuvchi mintaqasiga
 * qarab sana bir kunga siljib ketishi mumkin (Toshkent UTC+5).
 * Shu sababli kirish ham, chiqish ham `YYYY-MM-DD` matni, ichki
 * hisob esa sonlar ustida.
 */

/** `YYYY-MM-DD` -> [yil, oy (1..12), kun] */
function qismlar(iso: string): [number, number, number] {
  const [y, o, k] = iso.split('-').map((n) => Number.parseInt(n, 10))
  return [y, o, k]
}

function isoYasa(yil: number, oy: number, kun: number): string {
  return `${String(yil).padStart(4, '0')}-${String(oy).padStart(2, '0')}-${String(kun).padStart(2, '0')}`
}

/** Oydagi kunlar soni (kabisa yili hisobga olinadi) */
export function oydagiKunlar(yil: number, oy: number): number {
  return new Date(Date.UTC(yil, oy, 0)).getUTCDate()
}

/**
 * Sanaga N oy qo'shadi; qisqa oyda OXIRGI KUNGA qisqaradi.
 *
 * 31-yanvarga bir oy qo'shilsa 28-fevral (kabisa yilida 29)
 * bo'ladi. Qo'shish doim BOSHLANISH sanasidan hisoblanadi,
 * zanjir bilan emas — aks holda 31 → 28 → 28 → 28 bo'lib,
 * jadval bir martalik qisqarishdan keyin abadiy "28" ga
 * yopishib qolardi.
 */
export function oyQoshish(iso: string, oySoni: number): string {
  const [yil, oy, kun] = qismlar(iso)
  const jami = yil * 12 + (oy - 1) + oySoni
  const yYil = Math.floor(jami / 12)
  const yOy = (jami % 12) + 1
  return isoYasa(yYil, yOy, Math.min(kun, oydagiKunlar(yYil, yOy)))
}

/** Ikki sanani taqqoslash uchun — ISO matnlar leksik tartibda to'g'ri */
function keyinmi(a: string, b: string): boolean {
  return a > b
}

export type KeyingiSanaArgs = {
  /** RRULE matni, DTSTART'siz */
  rrule: string
  /** Qoidaning boshlanish sanasi (DTSTART) */
  boshlanish: string
  /** Shu sanadan KEYINGI sana qidiriladi (odatda joriy due_date) */
  asos: string
  /** Natija shu kundan ham keyin bo'lishi shart (tashlab ketilgan vazifa o'tmishda qolmasin) */
  bugun?: string
  /**
   * "Bajarilgan sanadan" rejimi: keyingi sana jadvaldan emas,
   * vazifa aslida bajarilgan kundan boshlab hisoblanadi.
   */
  bajarilgandan?: boolean
}

/**
 * Keyingi sanani qaytaradi. Takrorlanish tugagan bo'lsa (`UNTIL`
 * yoki `COUNT` chegarasi) — `null`.
 */
export function keyingiSana({
  rrule,
  boshlanish,
  asos,
  bugun,
  bajarilgandan = false,
}: KeyingiSanaArgs): string | null {
  const q = rruleQismlari(rrule)
  if (!q.FREQ) return null

  // "Bajarilgan sanadan" rejimida qoida bajarilgan kundan qayta
  // boshlanadi: jadval emas, haqiqiy bajarilish muhim
  const dtstart = bajarilgandan ? (bugun ?? asos) : boshlanish
  const chegara = bugun && keyinmi(bugun, asos) ? bugun : asos

  const soddaOylik = soddaOylikmi(q)
  return soddaOylik
    ? soddaKeyingi(q, dtstart, chegara)
    : rruleKeyingi(rrule, dtstart, chegara, bajarilgandan)
}

/**
 * "Har oy / har yil" — qo'shimcha shartsiz.
 *
 * Bu holat ataylab alohida: RFC bo'yicha `FREQ=MONTHLY` 31-sanada
 * boshlansa, 30 kunlik oylar butunlay O'TKAZIB YUBORILADI. Odam
 * uchun bu kutilmagan natija — "har oy" degan vazifa ba'zi oylarda
 * umuman chiqmaydi. Shuning uchun bu yerda oyning oxirgi kuniga
 * qisqartiramiz (ilovaning avvalgi xatti-harakati ham shunday edi).
 */
function soddaOylikmi(q: Record<string, string>): boolean {
  if (q.FREQ !== 'MONTHLY' && q.FREQ !== 'YEARLY') return false
  return !q.BYMONTHDAY && !q.BYDAY && !q.BYSETPOS && !q.BYMONTH
}

function soddaKeyingi(
  q: Record<string, string>,
  dtstart: string,
  chegara: string
): string | null {
  const interval = Math.max(1, Number.parseInt(q.INTERVAL ?? '1', 10) || 1)
  const qadam = (q.FREQ === 'YEARLY' ? 12 : 1) * interval
  const chek = chegaraSanasi(q)
  const marta = q.COUNT ? Number.parseInt(q.COUNT, 10) : null

  // DTSTART ning o'zi ham takrorlanishning birinchi sanasi
  let n = 0
  let sana = dtstart
  while (!keyinmi(sana, chegara)) {
    n += 1
    if (marta !== null && n >= marta) return null
    sana = oyQoshish(dtstart, qadam * n)
    // Himoya: noto'g'ri qiymatda cheksiz aylanmasin
    if (n > 5000) return null
  }

  if (chek && keyinmi(sana, chek)) return null
  return sana
}

/** `UNTIL` — shu sana ham kiradi (RFC 5545) */
function chegaraSanasi(q: Record<string, string>): string | null {
  if (!q.UNTIL) return null
  const s = q.UNTIL.slice(0, 8)
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

/**
 * Qolgan barcha holatlar — `rrule` kutubxonasi.
 *
 * Sanalar UTC yarim tunida yuritiladi. Bu kutubxonaning o'zi
 * tavsiya qiladigan naqsh: shunda natijaning UTC qismlari aynan
 * kerakli kun bo'ladi va foydalanuvchining vaqt mintaqasi
 * hisobga aralashmaydi.
 */
function rruleKeyingi(
  rrule: string,
  dtstart: string,
  chegara: string,
  bajarilgandan: boolean
): string | null {
  const [y, o, k] = qismlar(dtstart)
  const sozlama = RRule.parseString(rrule) as Partial<Options>
  sozlama.dtstart = new Date(Date.UTC(y, o - 1, k))

  // "Bajarilgan sanadan" rejimida boshlanish nuqtasi har safar
  // siljiydi, shuning uchun "necha marta" chegarasi ma'nosini
  // yo'qotadi — oynada ham bu juftlik taqiqlangan
  if (bajarilgandan) delete sozlama.count

  const [cy, co, ck] = qismlar(chegara)
  const keyingi = new RRule(sozlama).after(
    new Date(Date.UTC(cy, co - 1, ck)),
    false
  )
  if (!keyingi) return null

  return isoYasa(
    keyingi.getUTCFullYear(),
    keyingi.getUTCMonth() + 1,
    keyingi.getUTCDate()
  )
}

/**
 * Berilgan sana qoidaga mos keladimi.
 * Hozircha faqat testlar va kelajakdagi "jadvalni ko'rish" uchun.
 */
export function sanaMosmi(rrule: string, boshlanish: string, sana: string): boolean {
  const oldingi = keyingiSana({
    rrule,
    boshlanish,
    asos: oldingiKun(sana),
  })
  return oldingi === sana
}

function oldingiKun(iso: string): string {
  const [y, o, k] = qismlar(iso)
  const d = new Date(Date.UTC(y, o - 1, k - 1))
  return isoYasa(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}
