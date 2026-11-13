import type { Theme } from '@/types/vazifalar'

/**
 * Mavzu (yorug'/qorong'i) boshqaruvi.
 *
 * Nega localStorage, baza emas:
 *  - Mavzu sahifa chizilishidan OLDIN ma'lum bo'lishi kerak, aks holda
 *    qorong'i rejimda bir lahza oq ekran chaqnab ketadi. Bazaga so'rov
 *    esa React ulangandan keyin boradi — kech.
 *  - Kirishdan oldingi sahifada ham, `/maxfiylik` kabi ochiq
 *    sahifalarda ham profil yo'q, lekin mavzu baribir ishlashi kerak.
 *
 * `profiles.theme` ustuni bazada mavjud — qurilmalar orasida sinxron
 * qilish kerak bo'lsa, keyinchalik shu yerga qo'shiladi; tashqi API
 * o'zgarmaydi.
 */

export const MAVZU_KALITI = 'samara-mavzu'

/** Qorong'i mavzuda brauzer paneli shu rangga bo'yaladi (`--surface-muted`) */
const PANEL_RANGI: Record<'light' | 'dark', string> = {
  light: '#0b3d2e',
  dark: '#101312',
}

function toTheme(qiymat: string | null): Theme {
  return qiymat === 'dark' || qiymat === 'light' ? qiymat : 'system'
}

export function mavzuniOqi(): Theme {
  if (typeof window === 'undefined') return 'system'
  try {
    return toTheme(window.localStorage.getItem(MAVZU_KALITI))
  } catch {
    // Maxfiy rejimda localStorage taqiqlangan bo'lishi mumkin
    return 'system'
  }
}

/** Tanlangan mavzu haqiqatda qaysi ko'rinishga olib kelishini aytadi */
export function amaldagiMavzu(mavzu: Theme): 'light' | 'dark' {
  if (mavzu !== 'system') return mavzu
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * Mavzuni hujjatga qo'llaydi.
 *
 * "system" tanlansa `data-mavzu` butunlay olib tashlanadi — shunda
 * CSS'dagi `prefers-color-scheme` media so'rovi o'z ishini qiladi.
 */
export function mavzuniQolla(mavzu: Theme) {
  if (typeof document === 'undefined') return
  const ildiz = document.documentElement

  if (mavzu === 'system') delete ildiz.dataset.mavzu
  else ildiz.dataset.mavzu = mavzu

  // PWA'da brauzer/tizim paneli rangi ham mos kelishi kerak
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', PANEL_RANGI[amaldagiMavzu(mavzu)])
}

// -------------------------------------------------------------
// Oddiy obuna tizimi — `useSyncExternalStore` uchun.
// Mavzu React holatidan tashqarida (hujjat atributi) yashaydi,
// shuning uchun uni React'ga shu ko'prik orqali ulaymiz.
// -------------------------------------------------------------
const tinglovchilar = new Set<() => void>()

export function mavzugaObuna(fn: () => void) {
  tinglovchilar.add(fn)
  return () => {
    tinglovchilar.delete(fn)
  }
}

export function mavzuniOrnat(mavzu: Theme) {
  try {
    window.localStorage.setItem(MAVZU_KALITI, mavzu)
  } catch {
    // Saqlay olmasak ham joriy sessiyada ishlayversin
  }
  mavzuniQolla(mavzu)
  tinglovchilar.forEach((fn) => fn())
}
