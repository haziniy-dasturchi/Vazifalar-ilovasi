'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  Check,
  MessageCircle,
  Pencil,
  Repeat,
  Trash2,
  X,
} from 'lucide-react'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import {
  useTopshiriqBekor,
  useTopshiriqlarniOchirish,
} from '@/lib/queries/topshiriqlar'
import { MUHIMLIK_NOMI, MUHIMLIK_RANGI } from '@/lib/papka-stillari'
import { toliqSana, vaqtMatni } from '@/lib/sana'
import type { Topshiriq } from '@/types/vazifalar'
import {
  HOLAT_USLUBI,
  avatarRangi,
  bosHarflar,
  korinishHolati,
  type KorinishHolati,
} from './holat'
import { QarorOynasi, type Qaror } from './qaror-oynasi'

export function topshiriqYoli(id: string) {
  return `/topshiriq?id=${id}`
}

export function HolatBelgisi({ holat }: { holat: KorinishHolati }) {
  const t = useT()
  const u = HOLAT_USLUBI[holat]
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold sm:text-sm"
      style={{ color: u.rang, backgroundColor: u.fon }}
    >
      {t(u.kalit)}
    </span>
  )
}

export function MuhimlikBelgisi({ muhimlik }: { muhimlik: number }) {
  const rang = MUHIMLIK_RANGI[muhimlik] ?? '#9ca3af'
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:text-sm"
      style={{ color: rang, backgroundColor: `${rang}1f` }}
    >
      <span className="size-2 rounded-full" style={{ backgroundColor: rang }} aria-hidden />
      {MUHIMLIK_NOMI[muhimlik]}
    </span>
  )
}

export function Avatar({ ism, kalit, katta }: { ism: string; kalit: string; katta?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
        katta ? 'size-8 text-xs' : 'size-7 text-[11px]'
      }`}
      style={{ backgroundColor: avatarRangi(kalit) }}
    >
      {bosHarflar(ism) || '?'}
    </span>
  )
}

/** "25-noyabr, 09:00 — 28-noyabr, 11:00" yoki bir kunda "25-noyabr, 09:00–11:00" */
export function sanaOraligi(t: Topshiriq): string | null {
  if (!t.muddat) return null
  const boshSoat = vaqtMatni(t.boshlanish_vaqt ?? null)
  const oxirSoat = vaqtMatni(t.muddat_vaqt ?? null)
  const birKun = !t.boshlanish || t.boshlanish === t.muddat
  if (birKun) {
    const soat = boshSoat && oxirSoat ? `${boshSoat}–${oxirSoat}` : (oxirSoat ?? boshSoat)
    return soat ? `${toliqSana(t.muddat)}, ${soat}` : toliqSana(t.muddat)
  }
  const bosh = boshSoat ? `${toliqSana(t.boshlanish as string)}, ${boshSoat}` : toliqSana(t.boshlanish as string)
  const oxiri = oxirSoat ? `${toliqSana(t.muddat)}, ${oxirSoat}` : toliqSana(t.muddat)
  return `${bosh} — ${oxiri}`
}

/**
 * Topshiriq kartasi (UstozCRM naqshida): tepada muhimlik va holat,
 * o'rtada nima qilish kerakligi va kim bilan, pastda muddat va
 * chatdagi yangi xabarlar soni. Karta bosilsa — topshiriq sahifasi.
 */
export function TopshiriqKartasi({
  topshiriq,
  menYuborganman,
  qarshiIsm,
  vazifaHolati,
  foiz,
  kechikkan,
  yangiXabar,
  ochilmagan,
  onlayn,
  tahrirla,
}: {
  topshiriq: Topshiriq
  menYuborganman: boolean
  qarshiIsm: string | null
  vazifaHolati: string | null | undefined
  foiz: number | null | undefined
  kechikkan: boolean
  yangiXabar: number
  ochilmagan: boolean
  onlayn: boolean
  tahrirla: () => void
}) {
  const t = useT()
  const { korsat } = useToast()
  const holat = korinishHolati(topshiriq, vazifaHolati, kechikkan)
  const ochirish = useTopshiriqlarniOchirish()
  const bekor = useTopshiriqBekor()
  const [qaror, setQaror] = useState<Qaror | null>(null)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)

  const kim = qarshiIsm ?? (menYuborganman ? topshiriq.qabul_qiluvchi_email : '…')
  const sana = sanaOraligi(topshiriq)
  const yopiq = topshiriq.holat === 'bajarildi' || topshiriq.holat === 'rad'
  const rang = MUHIMLIK_RANGI[topshiriq.muhimlik] ?? '#9ca3af'

  return (
    <li
      className="relative flex flex-col rounded-2xl border-l-4 bg-surface p-3.5 shadow-card transition hover:shadow-lg sm:p-4"
      style={{ borderLeftColor: rang }}
    >
      {/* Butun karta — havola; ichki tugmalar uning ustida (z-10) */}
      <Link
        href={topshiriqYoli(topshiriq.id)}
        aria-label={topshiriq.sarlavha}
        className="absolute inset-0 z-0 rounded-2xl"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <MuhimlikBelgisi muhimlik={topshiriq.muhimlik} />
        <HolatBelgisi holat={holat} />
      </div>

      <h3 className="mt-2.5 flex items-start gap-2 text-[0.9375rem] leading-snug font-semibold text-text-strong sm:text-base">
        {ochilmagan && (
          <span
            className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-accent"
            aria-label={t('tk.yangi')}
          />
        )}
        <span className="min-w-0">{topshiriq.sarlavha}</span>
      </h3>

      {topshiriq.izoh && (
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-text-muted">
          {topshiriq.izoh}
        </p>
      )}

      <div className="mt-2.5 flex items-center gap-2">
        <Avatar ism={kim} kalit={menYuborganman ? topshiriq.qabul_qiluvchi_email : topshiriq.yuboruvchi_id} />
        <span className="min-w-0">
          <span className="block text-[11px] leading-tight text-text-faint">
            {menYuborganman ? t('tk.ijrochi') : t('tk.topshiriqBerdi')}
          </span>
          <span className="block truncate text-sm font-medium text-text-strong">{kim}</span>
        </span>
      </div>

      {menYuborganman && holat === 'jarayonda' && foiz != null && foiz > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full rounded-full bg-brand-accent" style={{ width: `${foiz}%` }} />
        </div>
      )}

      {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
        <p className="mt-2.5 rounded-xl px-3 py-1.5 text-xs sm:text-sm" style={{ color: '#c2410c', backgroundColor: 'rgba(234,88,12,0.1)' }}>
          {t('tk.radSababi')}: {topshiriq.qaytarish_sababi}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border-subtle pt-2.5 text-xs sm:text-sm">
          {sana && (
            <span className={`flex items-center gap-1.5 ${kechikkan ? 'font-semibold text-danger' : 'text-text-muted'}`}>
              <CalendarDays className="size-4" aria-hidden />
              {sana}
            </span>
          )}
          {topshiriq.takror && <Repeat className="size-4 text-text-faint" aria-label={t('tk.takrorlanadi')} />}

          <span className="ml-auto flex items-center gap-1">
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
                yangiXabar > 0 ? 'bg-danger text-white' : 'text-text-faint'
              }`}
              aria-label={t('tk.yangiXabarlar', { son: yangiXabar })}
            >
              <MessageCircle className="size-4" aria-hidden />
              {yangiXabar > 0 && yangiXabar}
            </span>
            {menYuborganman && !yopiq && (
              <button
                type="button"
                onClick={tahrirla}
                disabled={!onlayn}
                aria-label={t('tk.tahrirlash')}
                title={t('tk.tahrirlash')}
                className="relative z-10 flex size-8 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
              >
                <Pencil className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOchirishOchiq(true)}
              disabled={!onlayn}
              aria-label={t('umumiy.ochirish')}
              title={t('umumiy.ochirish')}
              className="relative z-10 flex size-8 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </span>
        </div>

        {/* Ijrochi tugatgan — faqat shu paytda yuboruvchi qaror qiladi */}
        {menYuborganman && topshiriq.holat === 'tekshiruvda' && (
          <div className="relative z-10 mt-2.5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setQaror('qabul')}
              disabled={!onlayn}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-2 text-sm whitespace-nowrap font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-50"
            >
              <Check className="size-4" aria-hidden />
              {t('tk.qabulQilish')}
            </button>
            <button
              type="button"
              onClick={() => setQaror('rad')}
              disabled={!onlayn}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-danger px-2 text-sm whitespace-nowrap font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-50"
            >
              <X className="size-4" aria-hidden />
              {t('tk.radEtish')}
            </button>
          </div>
        )}
      </div>

      {qaror && (
        <QarorOynasi topshiriqId={topshiriq.id} qaror={qaror} yop={() => setQaror(null)} />
      )}

      {ochirishOchiq && (
        <Tasdiq
          sarlavha={t('umumiy.ochirish')}
          matn={
            menYuborganman && topshiriq.holat === 'kutilmoqda'
              ? t('tk.bekorIzoh')
              : t('tk.ochirishIzoh')
          }
          tugmaMatni={t('umumiy.ochirish')}
          tasdiqla={async () => {
            try {
              if (menYuborganman && topshiriq.holat === 'kutilmoqda') {
                await bekor.mutateAsync(topshiriq.id)
              } else {
                await ochirish.mutateAsync([topshiriq.id])
              }
              setOchirishOchiq(false)
              korsat({ matn: t('tk.ochirildi'), tone: 'muvaffaqiyat' })
            } catch {
              korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
            }
          }}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending || bekor.isPending}
        />
      )}
    </li>
  )
}
