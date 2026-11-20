import {
  HAR_HAFTA,
  HAR_KUNI,
  HAR_OY,
  ISH_KUNLARI,
  kodKuni,
  kunKodi,
  rruleQismlari,
  soddalashtir,
} from './qoida'

/**
 * Eski `recurrence` ustuni bilan ko'prik.
 *
 * Eski shakllar: `daily | weekdays | weekly | monthly | days:2,3`.
 *
 * --- Nega ikkala tomon ham kerak ---
 * 1. Bazadagi mavjud yozuvlarni yangi ustunga ko'chirish uchun
 *    (migratsiya ham, hali ko'chmagan qator uchun mijoz ham).
 * 2. Yangi qoida eski shakllarning biriga to'g'ri kelsa, eski
 *    ustun ham to'ldirib boriladi. Sababi: ilova PWA — odamning
 *    telefonida ESKI JS keshda qolgan bo'lishi mumkin va u hamon
 *    `recurrence` ni o'qiydi. Shunda yangilanmagan ilova ham
 *    ishlayveradi.
 */

/** Eski qiymatdan RRULE */
export function eskidanRrule(eski: string | null): string | null {
  if (!eski) return null
  if (eski === 'daily') return HAR_KUNI
  if (eski === 'weekdays') return ISH_KUNLARI
  if (eski === 'weekly') return HAR_HAFTA
  if (eski === 'monthly') return HAR_OY

  if (eski.startsWith('days:')) {
    const kunlar = eski
      .slice('days:'.length)
      .split(',')
      .map((k) => Number.parseInt(k, 10))
      .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7)
    if (kunlar.length === 0) return null
    const tartib = [...new Set(kunlar)].sort((a, b) => a - b)
    return soddalashtir(`FREQ=WEEKLY;BYDAY=${tartib.map(kunKodi).join(',')}`)
  }

  return null
}

/**
 * RRULE eski shakllarning biriga to'g'ri kelsa — o'shanisi,
 * aks holda `null` (eski ustun bo'sh qoladi).
 */
export function rruleEskiga(rrule: string | null): string | null {
  if (!rrule) return null
  const soda = soddalashtir(rrule) ?? rrule
  const q = rruleQismlari(soda)

  // Interval, tugash sanasi yoki soni — eski shaklda umuman yo'q
  if (q.INTERVAL && q.INTERVAL !== '1') return null
  if (q.UNTIL || q.COUNT || q.BYSETPOS || q.BYMONTH) return null

  if (q.FREQ === 'DAILY' && !q.BYDAY) return 'daily'

  if (q.FREQ === 'MONTHLY') {
    return !q.BYDAY && !q.BYMONTHDAY ? 'monthly' : null
  }

  if (q.FREQ === 'WEEKLY') {
    if (!q.BYDAY) return 'weekly'
    if (soda === ISH_KUNLARI) return 'weekdays'
    const kunlar = q.BYDAY.split(',')
      .filter((k) => /^[A-Z]{2}$/i.test(k))
      .map(kodKuni)
      .filter((n) => n > 0)
      .sort((a, b) => a - b)
    if (kunlar.length === 0) return null
    return `days:${kunlar.join(',')}`
  }

  return null
}
