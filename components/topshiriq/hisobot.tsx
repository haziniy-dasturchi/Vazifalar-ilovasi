'use client'

import Link from 'next/link'
import { AlertTriangle, ChevronRight, Inbox, Send, Star } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import {
  useKelganTopshiriqlar,
  useYuborilganTopshiriqlar,
} from '@/lib/queries/topshiriqlar'
import { bugunISO } from '@/lib/sana'
import { kechikkanmi, xodimlarHisoboti } from '@/lib/topshiriq-yordam'
import type { MatnKaliti } from '@/lib/i18n'
import type { Topshiriq } from '@/types/vazifalar'

export const KARTA_FILTRLARI = [
  'kutilmoqda',
  'qabul',
  'tekshiruvda',
  'kechikkan',
  'bajarildi',
] as const
export type KartaFiltri = (typeof KARTA_FILTRLARI)[number]

const KARTA: Record<KartaFiltri, { kalit: MatnKaliti; rang: string }> = {
  kutilmoqda: { kalit: 'topshiriq.filtr.kutilmoqda', rang: '#64748b' },
  qabul: { kalit: 'topshiriq.filtr.qabul', rang: '#f59e0b' },
  tekshiruvda: { kalit: 'topshiriq.filtr.tekshiruvda', rang: '#8b5cf6' },
  kechikkan: { kalit: 'topshiriq.filtr.kechikkan', rang: '#dc2626' },
  bajarildi: { kalit: 'topshiriq.filtr.bajarildi', rang: '#10b981' },
}

/**
 * Holatlar bo'yicha statistik kartalar (sonlari bilan). Bosilsa —
 * ro'yxat shu holatga filtrlanadi, qayta bosilsa — filtr olinadi.
 */
export function HolatKartalari({
  sanoq,
  faol,
  tanla,
}: {
  sanoq: Record<KartaFiltri, number>
  faol: string
  tanla: (f: KartaFiltri) => void
}) {
  const t = useT()
  return (
    <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
      {KARTA_FILTRLARI.map((f) => {
        const tanlangan = faol === f
        return (
          <button
            key={f}
            type="button"
            aria-pressed={tanlangan}
            onClick={() => tanla(f)}
            className={`flex min-h-0 flex-col items-start rounded-2xl border px-3 py-2.5 text-left transition ${
              tanlangan
                ? 'border-brand-onsoft bg-brand-soft'
                : 'border-transparent bg-surface shadow-card hover:bg-surface-muted'
            }`}
          >
            <span
              className="text-2xl leading-none font-bold tabular-nums"
              style={{ color: sanoq[f] > 0 ? KARTA[f].rang : 'var(--text-faint)' }}
            >
              {sanoq[f]}
            </span>
            <span className="mt-1 text-xs leading-tight font-medium text-text-muted">
              {t(KARTA[f].kalit)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function davomiylik(soat: number, t: ReturnType<typeof useT>): string {
  if (soat < 1) return t('tj.daqiqa', { son: Math.max(1, Math.round(soat * 60)) })
  if (soat < 48) return t('tj.soat', { son: Math.round(soat) })
  return t('tj.kun', { son: Math.round(soat / 24) })
}

/**
 * Rahbar paneli: men yuborgan topshiriqlar har bir ijrochi kesimida.
 * Qatorni bossa — ro'yxat shu odamga filtrlanadi.
 */
export function XodimlarHisoboti({
  royxat,
  ismlar,
  tanla,
}: {
  royxat: Topshiriq[]
  ismlar: Map<string, string>
  tanla: (email: string) => void
}) {
  const t = useT()
  const hisobot = xodimlarHisoboti(royxat, bugunISO())

  if (hisobot.length === 0) {
    return (
      <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-text-muted shadow-card">
        {t('tj.hisobotBosh')}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {hisobot.map((x) => (
        <li key={x.email}>
          <button
            type="button"
            onClick={() => tanla(x.email)}
            className="w-full rounded-2xl bg-surface p-4 text-left shadow-card transition hover:bg-surface-muted"
          >
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate font-semibold text-text-strong">
                {ismlar.get(x.email) ?? x.email}
              </span>
              {x.ortachaBaho != null && (
                <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-text-strong">
                  <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden />
                  {x.ortachaBaho}
                </span>
              )}
              <ChevronRight className="size-4 shrink-0 text-text-faint" aria-hidden />
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 text-center">
              <Korsatkich son={x.jami} nom={t('tj.jami')} />
              <Korsatkich son={x.ochiq} nom={t('tj.ochiq')} />
              <Korsatkich son={x.kechikkan} nom={t('topshiriq.filtr.kechikkan')} xavf={x.kechikkan > 0} />
              <Korsatkich son={x.bajarilgan} nom={t('topshiriq.filtr.bajarildi')} />
            </div>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
              {x.muddatida != null && (
                <span>{t('tj.muddatida', { foiz: x.muddatida })}</span>
              )}
              {x.ortachaSoat != null && (
                <span>{t('tj.ortachaVaqt', { vaqt: davomiylik(x.ortachaSoat, t) })}</span>
              )}
              {x.rad > 0 && <span>{t('tj.radSoni', { son: x.rad })}</span>}
            </p>
          </button>
        </li>
      ))}
    </ul>
  )
}

function Korsatkich({ son, nom, xavf }: { son: number; nom: string; xavf?: boolean }) {
  return (
    <span className="rounded-xl bg-surface-muted px-1 py-1.5">
      <span className={`block text-lg leading-none font-bold tabular-nums ${xavf ? 'text-danger' : 'text-text-strong'}`}>
        {son}
      </span>
      <span className="mt-0.5 block truncate text-[11px] text-text-muted">{nom}</span>
    </span>
  )
}

/**
 * "Bugun" sahifasidagi qisqa xulosa: mendan harakat kutayotgan
 * topshiriqlar. Hech narsa bo'lmasa — umuman ko'rinmaydi.
 * Qabul qilingan topshiriqlar esa oddiy vazifa sifatida "Bugun"
 * ro'yxatining o'zida (Kiruvchi papkada) turadi.
 */
export function BugunTopshiriqXulosasi() {
  const t = useT()
  const { data: kelgan } = useKelganTopshiriqlar()
  const { data: yuborilgan } = useYuborilganTopshiriqlar()
  const bugun = bugunISO()

  const javobKutayotgan = kelgan?.filter((x) => x.holat === 'kutilmoqda').length ?? 0
  const tekshiruvda = yuborilgan?.filter((x) => x.holat === 'tekshiruvda').length ?? 0
  const kechikkan = yuborilgan?.filter((x) => kechikkanmi(x, bugun)).length ?? 0

  const qatorlar = [
    javobKutayotgan > 0 && {
      ikonka: Inbox,
      matn: t('tj.bugun.javobKutmoqda', { son: javobKutayotgan }),
      rang: 'text-brand-onsoft',
    },
    tekshiruvda > 0 && {
      ikonka: Send,
      matn: t('tj.bugun.tekshiruvda', { son: tekshiruvda }),
      rang: 'text-violet-600',
    },
    kechikkan > 0 && {
      ikonka: AlertTriangle,
      matn: t('tj.bugun.kechikkan', { son: kechikkan }),
      rang: 'text-danger',
    },
  ].filter(Boolean) as { ikonka: typeof Inbox; matn: string; rang: string }[]

  if (qatorlar.length === 0) return null

  return (
    <Link
      href="/topshiriqlar"
      className="mb-4 block rounded-2xl bg-surface p-3 shadow-card transition hover:bg-surface-muted"
    >
      <p className="mb-1.5 px-1 text-xs font-semibold tracking-wide text-text-faint uppercase">
        {t('topshiriq.bolimi')}
      </p>
      <ul className="space-y-1">
        {qatorlar.map(({ ikonka: Ikonka, matn, rang }) => (
          <li key={matn} className="flex items-center gap-2 px-1 text-sm text-text-strong">
            <Ikonka className={`size-4 shrink-0 ${rang}`} aria-hidden />
            <span className="min-w-0 flex-1">{matn}</span>
            <ChevronRight className="size-4 shrink-0 text-text-faint" aria-hidden />
          </li>
        ))}
      </ul>
    </Link>
  )
}
