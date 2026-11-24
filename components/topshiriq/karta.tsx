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
import { Oyna } from '@/components/ui/oyna'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import {
  useTopshiriqBekor,
  useTopshiriqlarniOchirish,
  useTopshiriqQaytarish,
  useTopshiriqTasdiqlash,
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

export function topshiriqYoli(id: string) {
  return `/topshiriq?id=${id}`
}

export function HolatBelgisi({ holat }: { holat: KorinishHolati }) {
  const t = useT()
  const u = HOLAT_USLUBI[holat]
  return (
    <span
      className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-sm font-semibold"
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
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
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
        katta ? 'size-10 text-sm' : 'size-8 text-xs'
      }`}
      style={{ backgroundColor: avatarRangi(kalit) }}
    >
      {bosHarflar(ism) || '?'}
    </span>
  )
}

/** "25-noyabr — 28-noyabr, 11:00" */
export function sanaOraligi(t: Topshiriq): string | null {
  if (!t.muddat) return null
  const soat = vaqtMatni(t.muddat_vaqt ?? null)
  const oxiri = soat ? `${toliqSana(t.muddat)}, ${soat}` : toliqSana(t.muddat)
  if (t.boshlanish && t.boshlanish !== t.muddat) return `${toliqSana(t.boshlanish)} — ${oxiri}`
  return oxiri
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
  const tasdiqlash = useTopshiriqTasdiqlash()
  const qaytarish = useTopshiriqQaytarish()
  const ochirish = useTopshiriqlarniOchirish()
  const bekor = useTopshiriqBekor()
  const [radOchiq, setRadOchiq] = useState(false)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)
  const [sabab, setSabab] = useState('')

  const kim = qarshiIsm ?? (menYuborganman ? topshiriq.qabul_qiluvchi_email : '…')
  const sana = sanaOraligi(topshiriq)
  const yopiq = topshiriq.holat === 'bajarildi' || topshiriq.holat === 'rad'
  const rang = MUHIMLIK_RANGI[topshiriq.muhimlik] ?? '#9ca3af'

  async function qabulQil() {
    try {
      await tasdiqlash.mutateAsync({ id: topshiriq.id })
      korsat({ matn: t('tk.qabulQilindi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  async function radEt() {
    try {
      await qaytarish.mutateAsync({ id: topshiriq.id, sabab })
      setRadOchiq(false)
      setSabab('')
      korsat({ matn: t('tk.radEtildi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <li
      className="relative flex flex-col rounded-2xl border-l-4 bg-surface p-4 shadow-card transition hover:shadow-lg"
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

      <h3 className="mt-3 flex items-start gap-2 text-lg leading-snug font-semibold text-text-strong">
        {ochilmagan && (
          <span
            className="mt-2 size-2.5 shrink-0 rounded-full bg-brand-accent"
            aria-label={t('tk.yangi')}
          />
        )}
        <span className="min-w-0">{topshiriq.sarlavha}</span>
      </h3>

      {topshiriq.izoh && (
        <p className="mt-1 line-clamp-2 text-base leading-relaxed text-text-muted">
          {topshiriq.izoh}
        </p>
      )}

      <div className="mt-3 flex items-center gap-2.5">
        <Avatar ism={kim} kalit={menYuborganman ? topshiriq.qabul_qiluvchi_email : topshiriq.yuboruvchi_id} />
        <span className="min-w-0">
          <span className="block text-xs text-text-faint">
            {menYuborganman ? t('tk.ijrochi') : t('tk.topshiriqBerdi')}
          </span>
          <span className="block truncate text-base font-medium text-text-strong">{kim}</span>
        </span>
      </div>

      {menYuborganman && holat === 'jarayonda' && foiz != null && foiz > 0 && (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-sunken">
          <div className="h-full rounded-full bg-brand-accent" style={{ width: `${foiz}%` }} />
        </div>
      )}

      {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
        <p className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ color: '#c2410c', backgroundColor: 'rgba(234,88,12,0.1)' }}>
          {t('tk.radSababi')}: {topshiriq.qaytarish_sababi}
        </p>
      )}

      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border-subtle pt-3 text-sm">
          {sana && (
            <span className={`flex items-center gap-1.5 ${kechikkan ? 'font-semibold text-danger' : 'text-text-muted'}`}>
              <CalendarDays className="size-4" aria-hidden />
              {sana}
            </span>
          )}
          {topshiriq.takror && <Repeat className="size-4 text-text-faint" aria-label={t('tk.takrorlanadi')} />}

          <span className="ml-auto flex items-center gap-1">
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ${
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
                className="relative z-10 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
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
              className="relative z-10 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          </span>
        </div>

        {/* Ijrochi tugatgan — faqat shu paytda yuboruvchi qaror qiladi */}
        {menYuborganman && topshiriq.holat === 'tekshiruvda' && (
          <div className="relative z-10 mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={qabulQil}
              disabled={!onlayn || tasdiqlash.isPending}
              className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-2 text-base whitespace-nowrap font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-50"
            >
              <Check className="size-5" aria-hidden />
              {t('tk.qabulQilish')}
            </button>
            <button
              type="button"
              onClick={() => setRadOchiq(true)}
              disabled={!onlayn}
              className="flex min-h-touch items-center justify-center gap-1.5 rounded-xl border-2 border-danger px-2 text-base whitespace-nowrap font-semibold text-danger transition hover:bg-danger-soft disabled:opacity-50"
            >
              <X className="size-5" aria-hidden />
              {t('tk.radEtish')}
            </button>
          </div>
        )}
      </div>

      {radOchiq && (
        <RadOynasi
          sabab={sabab}
          setSabab={setSabab}
          yop={() => setRadOchiq(false)}
          yubor={radEt}
          band={qaytarish.isPending}
        />
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

/** Rad etish: nima yetishmayotganini yozish (ijrochiga boradi) */
export function RadOynasi({
  sabab,
  setSabab,
  yop,
  yubor,
  band,
}: {
  sabab: string
  setSabab: (s: string) => void
  yop: () => void
  yubor: () => void
  band: boolean
}) {
  const t = useT()
  return (
    <Oyna sarlavha={t('tk.radSarlavha')} yop={yop}>
      <p className="mb-3 text-base text-text-muted">{t('tk.radIzoh')}</p>
      <OsuvchiMaydon
        qiymat={sabab}
        onChange={setSabab}
        placeholder={t('tk.radJoy')}
        ariaLabel={t('tk.radSarlavha')}
        maxLength={1000}
        autoFocus
        engKattaBalandlik={200}
        className="min-h-24 rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
      />
      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={yop}
          className="min-h-touch rounded-xl px-4 text-base font-medium text-text-muted transition hover:bg-surface-muted"
        >
          {t('umumiy.bekor')}
        </button>
        <button
          type="button"
          onClick={yubor}
          disabled={band || sabab.trim() === ''}
          className="flex min-h-touch items-center gap-2 rounded-xl bg-danger px-5 text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          <X className="size-5" aria-hidden />
          {t('tk.radEtish')}
        </button>
      </div>
    </Oyna>
  )
}
