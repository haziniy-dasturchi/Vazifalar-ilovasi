import type { MatnKaliti, Tarjimon } from '@/lib/i18n'
import { toliqSana } from '@/lib/sana'
import {
  HAR_KUNI,
  ISH_KUNLARI,
  kodKuni,
  OXIRGI_KUN,
  rruleQismlari,
  soddalashtir,
} from './qoida'

/**
 * Takrorlanish qoidasining odam o'qiydigan matni.
 *
 * Bu matn uch joyda ko'rinadi: sana tugmasida, vazifa qatorida va
 * "Boshqa…" oynasida saqlashdan oldin. Hammasi bitta funksiyadan
 * olinadi — aks holda bir xil qoida uch xil nomlanib ketardi.
 */

/** "Se, Chor, Pay" */
function kunlarMatni(kodlar: string[], t: Tarjimon): string {
  return kodlar
    .map(kodKuni)
    .filter((n) => n > 0)
    .sort((a, b) => a - b)
    .map((n) => t(`kun.${n}.qisqa` as MatnKaliti))
    .join(', ')
}

/** "1, 15" */
function sanalarMatni(kunlar: number[]): string {
  return [...kunlar].sort((a, b) => a - b).join(', ')
}

export function takrorMatni(rrule: string | null, t: Tarjimon): string {
  if (!rrule) return ''

  const soda = soddalashtir(rrule) ?? rrule
  if (soda === HAR_KUNI) return t('sana.harKuni')
  if (soda === ISH_KUNLARI) return t('sana.ishKunlari')

  const q = rruleQismlari(soda)
  const n = Math.max(1, Number.parseInt(q.INTERVAL ?? '1', 10) || 1)
  const byday = q.BYDAY ? q.BYDAY.split(',').filter(Boolean) : []

  let asosiy = ''

  if (q.FREQ === 'DAILY') {
    asosiy = n === 1 ? t('sana.harKuni') : t('takror.harNKun', { n })
  } else if (q.FREQ === 'WEEKLY') {
    if (byday.length === 0) {
      asosiy = n === 1 ? t('sana.harHafta') : t('takror.harNHafta', { n })
    } else {
      const kunlar = kunlarMatni(byday, t)
      asosiy =
        n === 1 ? kunlar : t('takror.harNHaftaKunlar', { n, kunlar })
    }
  } else if (q.FREQ === 'MONTHLY') {
    asosiy = oylikMatn(q, byday, n, t)
  } else if (q.FREQ === 'YEARLY') {
    asosiy = n === 1 ? t('takror.harYili') : t('takror.harNYil', { n })
  } else {
    asosiy = t('sana.takrorlanish')
  }

  const qoshimcha: string[] = []
  if (q.UNTIL) {
    const s = q.UNTIL.slice(0, 8)
    const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
    qoshimcha.push(t('takror.tugashSana', { sana: toliqSana(iso) }))
  } else if (q.COUNT) {
    qoshimcha.push(t('takror.tugashMarta', { n: q.COUNT }))
  }

  return [asosiy, ...qoshimcha].join(' · ')
}

function oylikMatn(
  q: Record<string, string>,
  byday: string[],
  n: number,
  t: Tarjimon
): string {
  const nth = byday[0]?.match(/^(-?\d+)([A-Z]{2})$/i)

  // "Oyning 2-seshanbasi" / "oyning oxirgi jumasi"
  if (nth) {
    const orn = Number.parseInt(nth[1], 10)
    const kun = t(`kun.${kodKuni(nth[2])}.toliq` as MatnKaliti)
    if (n === 1) {
      return orn === OXIRGI_KUN
        ? t('takror.oyOxirgiHafta', { kun })
        : t('takror.oyHafta', { orn, kun })
    }
    const qisqa =
      orn === OXIRGI_KUN
        ? t('takror.qisqaOxirgiHafta', { kun })
        : t('takror.qisqaHafta', { orn, kun })
    return `${t('takror.harNOy', { n })} · ${qisqa}`
  }

  if (q.BYMONTHDAY) {
    const kunlar = q.BYMONTHDAY.split(',')
      .map((k) => Number.parseInt(k, 10))
      .filter((k) => Number.isInteger(k))
    // `BYSETPOS=-1` bilan birga kelgan ro'yxat — "N-sana yoki oyning
    // oxirgi kuni" degani, ya'ni foydalanuvchi bitta son tanlagan
    const bitta =
      q.BYSETPOS === '-1' && kunlar.length > 1 ? [Math.max(...kunlar)] : kunlar

    const oxirgimi =
      bitta.length === 1 && (bitta[0] === OXIRGI_KUN || bitta[0] === 31)

    if (n === 1) {
      return oxirgimi
        ? t('takror.oyOxirgi')
        : t('takror.oySana', { kunlar: sanalarMatni(bitta) })
    }
    const qisqa = oxirgimi
      ? t('takror.qisqaOxirgi')
      : t('takror.qisqaSana', { kunlar: sanalarMatni(bitta) })
    return `${t('takror.harNOy', { n })} · ${qisqa}`
  }

  return n === 1 ? t('sana.harOy') : t('takror.harNOy', { n })
}
