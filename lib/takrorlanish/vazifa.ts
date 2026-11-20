import { bugunISO } from '@/lib/sana'
import { keyingiSana } from './hisob'
import { eskidanRrule } from './eski'
import type { Task } from '@/types/vazifalar'

/**
 * Vazifa bajarilganda uning keyingi sanasi.
 *
 * `null` — vazifa takrorlanmaydi yoki takrorlanish tugagan
 * (`COUNT` / `UNTIL` chegarasiga yetildi). Ikkala holatda ham
 * vazifa "bajarildi" bo'lib qoladi.
 *
 * Eski yozuvlar uchun zaxira yo'l: `rrule` hali bo'sh bo'lsa
 * (migratsiyadan oldin keshga tushgan qator), eski `recurrence`
 * ustunidan o'girib olinadi.
 */
export function vazifaningKeyingiSanasi(
  vazifa: Pick<
    Task,
    'rrule' | 'rrule_start' | 'rrule_from_completion' | 'recurrence' | 'due_date'
  >
): string | null {
  const qoida = vazifa.rrule ?? eskidanRrule(vazifa.recurrence)
  if (!qoida) return null

  const bugun = bugunISO()
  return keyingiSana({
    rrule: qoida,
    boshlanish: vazifa.rrule_start ?? vazifa.due_date ?? bugun,
    asos: vazifa.due_date ?? bugun,
    bugun,
    bajarilgandan: vazifa.rrule_from_completion ?? false,
  })
}
