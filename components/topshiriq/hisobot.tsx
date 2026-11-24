'use client'

import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  MessageCircle,
  PlusCircle,
  Send,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import {
  useTopshiriqYangiliklari,
  useYuborilganTopshiriqlar,
} from '@/lib/queries/topshiriqlar'
import { bugunISO } from '@/lib/sana'
import { kechikkanmi, xodimlarHisoboti } from '@/lib/topshiriq-yordam'
import type { Topshiriq } from '@/types/vazifalar'
import { HOLAT_USLUBI, type KorinishHolati } from './holat'
import { Avatar } from './karta'

export const KARTA_FILTRLARI = [
  'yangi',
  'jarayonda',
  'tekshiruvda',
  'kechikkan',
  'bajarildi',
] as const satisfies readonly KorinishHolati[]
export type KartaFiltri = (typeof KARTA_FILTRLARI)[number]

const IKONKA: Record<KartaFiltri, LucideIcon> = {
  yangi: PlusCircle,
  jarayonda: Clock,
  tekshiruvda: Eye,
  kechikkan: AlertTriangle,
  bajarildi: CheckCircle2,
}

/**
 * Holatlar bo'yicha statistik kartalar (UstozCRM naqshida: rangli
 * ikonka, katta raqam, nomi). Bosilsa — ro'yxat shu holatga
 * filtrlanadi, qayta bosilsa — filtr olinadi.
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
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {KARTA_FILTRLARI.map((f) => {
        const u = HOLAT_USLUBI[f]
        const Ikonka = IKONKA[f]
        const tanlangan = faol === f
        return (
          <button
            key={f}
            type="button"
            aria-pressed={tanlangan}
            onClick={() => tanla(f)}
            className={`flex min-h-0 items-center gap-3 rounded-2xl border-2 bg-surface px-3 py-3 text-left shadow-card transition hover:-translate-y-0.5 ${
              tanlangan ? '' : 'border-transparent'
            }`}
            style={tanlangan ? { borderColor: u.rang } : undefined}
          >
            <span
              className="flex size-11 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: u.fon, color: u.rang }}
            >
              <Ikonka className="size-6" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-2xl leading-none font-bold tabular-nums text-text-strong">
                {sanoq[f]}
              </span>
              <span className="mt-1 block truncate text-sm font-medium text-text-muted">
                {t(u.kalit)}
              </span>
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
      <p className="rounded-2xl bg-surface px-4 py-10 text-center text-base text-text-muted shadow-card">
        {t('tj.hisobotBosh')}
      </p>
    )
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {hisobot.map((x) => {
        const ism = ismlar.get(x.email) ?? x.email
        return (
          <li key={x.email}>
            <button
              type="button"
              onClick={() => tanla(x.email)}
              className="w-full rounded-2xl bg-surface p-4 text-left shadow-card transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <Avatar ism={ism} kalit={x.email} katta />
                <span className="min-w-0 flex-1 truncate text-lg font-semibold text-text-strong">{ism}</span>
                {x.ortachaBaho != null && (
                  <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-text-strong">
                    <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden />
                    {x.ortachaBaho}
                  </span>
                )}
                <ChevronRight className="size-5 shrink-0 text-text-faint" aria-hidden />
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                <Korsatkich son={x.jami} nom={t('tj.jami')} />
                <Korsatkich son={x.ochiq} nom={t('tj.ochiq')} />
                <Korsatkich son={x.kechikkan} nom={t('tk.holat.kechikkan')} xavf={x.kechikkan > 0} />
                <Korsatkich son={x.bajarilgan} nom={t('tk.holat.bajarildi')} />
              </div>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-muted">
                {x.muddatida != null && <span>{t('tj.muddatida', { foiz: x.muddatida })}</span>}
                {x.ortachaSoat != null && (
                  <span>{t('tj.ortachaVaqt', { vaqt: davomiylik(x.ortachaSoat, t) })}</span>
                )}
              </p>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Korsatkich({ son, nom, xavf }: { son: number; nom: string; xavf?: boolean }) {
  return (
    <span className="rounded-xl bg-surface-muted px-1 py-2">
      <span className={`block text-xl leading-none font-bold tabular-nums ${xavf ? 'text-danger' : 'text-text-strong'}`}>
        {son}
      </span>
      <span className="mt-1 block truncate text-xs text-text-muted">{nom}</span>
    </span>
  )
}

/**
 * "Bugun" sahifasidagi qisqa xulosa: yangi xabarlar, yangi kelgan
 * topshiriqlar, tekshiruv kutayotgan natijalar va kechikkanlar.
 * Hech narsa bo'lmasa — umuman ko'rinmaydi.
 */
export function BugunTopshiriqXulosasi() {
  const t = useT()
  const { data: yangiliklar } = useTopshiriqYangiliklari()
  const { data: yuborilgan } = useYuborilganTopshiriqlar()
  const bugun = bugunISO()

  const xabarlar = (yangiliklar ?? []).reduce((s, y) => s + y.yangi_xabarlar, 0)
  const yangiTopshiriq = (yangiliklar ?? []).filter((y) => y.ochilmagan).length
  const tekshiruvda = yuborilgan?.filter((x) => x.holat === 'tekshiruvda').length ?? 0
  const kechikkan = yuborilgan?.filter((x) => kechikkanmi(x, bugun)).length ?? 0

  const qatorlar = [
    yangiTopshiriq > 0 && { ikonka: Send, matn: t('tk.bugun.yangi', { son: yangiTopshiriq }), rang: '#2563eb' },
    xabarlar > 0 && { ikonka: MessageCircle, matn: t('tk.bugun.xabar', { son: xabarlar }), rang: '#059669' },
    tekshiruvda > 0 && { ikonka: Eye, matn: t('tj.bugun.tekshiruvda', { son: tekshiruvda }), rang: '#7c3aed' },
    kechikkan > 0 && { ikonka: AlertTriangle, matn: t('tj.bugun.kechikkan', { son: kechikkan }), rang: '#dc2626' },
  ].filter(Boolean) as { ikonka: LucideIcon; matn: string; rang: string }[]

  if (qatorlar.length === 0) return null

  return (
    <Link
      href="/topshiriqlar"
      className="mb-5 block rounded-2xl bg-surface p-4 shadow-card transition hover:bg-surface-muted"
    >
      <p className="mb-2 text-sm font-semibold text-text-faint">{t('topshiriq.bolimi')}</p>
      <ul className="space-y-2">
        {qatorlar.map(({ ikonka: Ikonka, matn, rang }) => (
          <li key={matn} className="flex items-center gap-3 text-base text-text-strong">
            <Ikonka className="size-5 shrink-0" style={{ color: rang }} aria-hidden />
            <span className="min-w-0 flex-1">{matn}</span>
            <ChevronRight className="size-5 shrink-0 text-text-faint" aria-hidden />
          </li>
        ))}
      </ul>
    </Link>
  )
}
