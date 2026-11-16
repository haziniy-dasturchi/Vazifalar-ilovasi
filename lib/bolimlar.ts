import { CalendarDays, ClipboardCheck, Play, Sun } from 'lucide-react'
import type { MatnKaliti } from '@/lib/i18n'

/**
 * Asosiy bo'limlar.
 *
 * Sukut tartibi ataylab shunday: "Jarayonda" birinchi — ilova
 * ochilganda foydalanuvchi avval boshlangan ishini ko'radi va uni
 * davom ettiradi. Agar jarayonda ish bo'lmasa, o'sha sahifaning
 * o'zida bugungi ishlardan bittasini tanlab boshlaydi.
 *
 * Foydalanuvchi bu tartibni sozlamalardan o'zgartirishi mumkin.
 */
export const BOLIMLAR = [
  { yol: '/jarayonda', nom: 'nav.jarayonda', ikonka: Play },
  { yol: '/bugun', nom: 'nav.bugun', ikonka: Sun },
  { yol: '/kelgusi', nom: 'nav.kelgusi', ikonka: CalendarDays },
  { yol: '/korish', nom: 'nav.korish', ikonka: ClipboardCheck },
] as const satisfies readonly {
  yol: string
  /** Nom tarjima kaliti sifatida saqlanadi — ko'rsatishda `t()` qo'llanadi */
  nom: MatnKaliti
  ikonka: typeof Play
}[]

export type Bolim = (typeof BOLIMLAR)[number]

/**
 * Saqlangan tartibni haqiqiy bo'limlar ro'yxatiga aylantiradi.
 *
 * Ikki himoya bor:
 *  - saqlangan ro'yxatda endi mavjud bo'lmagan yo'l bo'lsa (bo'lim
 *    o'chirilgan) — e'tiborsiz qoldiriladi;
 *  - saqlangan ro'yxatda yo'q bo'lim bo'lsa (keyinroq qo'shilgan) —
 *    oxiriga qo'shiladi, ya'ni yangi bo'lim hech qachon yo'qolmaydi.
 *
 * Shu sababli bazada bo'sh massiv saqlanishi mumkin: u "sukut tartib"
 * degani va yangi bo'limlar avtomatik ko'rinadi.
 */
export function tartiblanganBolimlar(tartib: readonly string[]): Bolim[] {
  const mavjud = new Map<string, Bolim>(BOLIMLAR.map((b) => [b.yol, b]))
  const natija: Bolim[] = []

  for (const yol of tartib) {
    const bolim = mavjud.get(yol)
    if (bolim) {
      natija.push(bolim)
      mavjud.delete(yol)
    }
  }
  // Tartibda ko'rsatilmaganlar sukut tartibida oxiriga qo'shiladi
  for (const bolim of BOLIMLAR) {
    if (mavjud.has(bolim.yol)) natija.push(bolim)
  }

  return natija
}

/** Ilova ochilganda tushadigan sahifa — tartibdagi birinchi bo'lim */
export function boshSahifa(tartib: readonly string[]): string {
  return tartiblanganBolimlar(tartib)[0].yol
}
