'use client'

import { useEffect, useRef, useState } from 'react'
import { Crown, Link2, LogOut, Plus, RefreshCw, Trash2, UserMinus, Users } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { DOMEN } from '@/lib/huquqiy'
import {
  useJamoaAmali,
  useJamoaAzolari,
  useJamoaTaklifi,
  useJamoaYaratish,
  useJamoagaQoshilish,
  useJamoalar,
  useTaklifOrqaliUlanish,
} from '@/lib/queries/topshiriq-jamoa'
import { useOnlaynmi } from '@/lib/queries/topshiriqlar'
import type { Jamoa, JamoaAzosi } from '@/types/vazifalar'

/**
 * Havolani ulashish: telefonda tizimning "Ulashish" oynasi (Telegram
 * ham shu yerda), bo'lmasa Telegram'ning ulashish sahifasi.
 */
export async function havolaniUlash(matn: string, havola: string) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text: matn, url: havola })
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    }
  }
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(havola)}&text=${encodeURIComponent(matn)}`,
    '_blank',
    'noopener'
  )
}

export const jamoaHavolasi = (kod: string) => `${DOMEN}/topshiriqlar?jamoa=${kod}`
export const shaxsiyHavola = (kod: string) => `${DOMEN}/topshiriqlar?taklif=${kod}`

/**
 * Jamoalar. Ataylab yig'ilgan holda va sahifa oxirida: jamoasiz
 * ishlaydigan odamga ortiqcha murakkablik qo'shmaydi (SWOT:
 * "og'ir CRM'ga aylanib qolish" tahdidi). Kerak bo'lgan odam esa
 * bir bosishda ochadi.
 */
export function JamoaBolimi() {
  const t = useT()
  const { data: jamoalar = [] } = useJamoalar()
  const { data: azolar = [] } = useJamoaAzolari()
  const [ochiq, setOchiq] = useState(false)
  const [yangiOchiq, setYangiOchiq] = useState(false)

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOchiq((v) => !v)}
        aria-expanded={ochiq}
        className="flex w-full min-h-0 items-center gap-2 rounded-xl px-1 py-2 text-left transition hover:bg-surface-muted"
      >
        <Users className="size-4 shrink-0 text-text-faint" aria-hidden />
        <span className="flex-1 text-sm font-semibold text-text-muted">
          {t('tj.jamoalarim')}
        </span>
        <span className="shrink-0 text-sm text-text-faint">{jamoalar.length}</span>
      </button>

      {ochiq && (
        <div className="mt-1 space-y-3">
          <p className="px-1 text-xs leading-relaxed text-text-faint">
            {t('tj.jamoaIzoh')}
          </p>
          {jamoalar.map((j) => (
            <JamoaKartasi
              key={j.id}
              jamoa={j}
              azolar={azolar.filter((a) => a.jamoa_id === j.id)}
            />
          ))}
          <button
            type="button"
            onClick={() => setYangiOchiq(true)}
            className="flex min-h-touch w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border-control text-sm font-semibold text-brand-onsoft transition hover:bg-brand-soft"
          >
            <Plus className="size-4" aria-hidden />
            {t('tj.jamoaYaratish')}
          </button>
        </div>
      )}

      {yangiOchiq && <YangiJamoaOynasi yop={() => setYangiOchiq(false)} />}
    </section>
  )
}

function JamoaKartasi({
  jamoa,
  azolar,
}: {
  jamoa: Jamoa
  azolar: JamoaAzosi[]
}) {
  const t = useT()
  const { id: menId } = useFoydalanuvchi()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const amal = useJamoaAmali()
  const rahbarmi = azolar.some((a) => a.user_id === menId && a.rol === 'rahbar')
  const [tasdiq, setTasdiq] = useState<null | 'chiqish' | 'ochirish' | 'kod'>(null)

  async function bajar(a: Parameters<typeof amal.mutateAsync>[0], xabar: string) {
    try {
      await amal.mutateAsync(a)
      korsat({ matn: xabar, tone: 'muvaffaqiyat' })
      setTasdiq(null)
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-semibold text-text-strong">{jamoa.nom}</p>
        <span className="shrink-0 text-xs text-text-faint">
          {t('tj.azolarSoni', { son: azolar.length })}
        </span>
      </div>

      <ul className="mt-3 divide-y divide-border-subtle">
        {azolar.map((a) => (
          <li key={a.user_id} className="flex items-center gap-2 py-2">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-text-strong">
                {a.ism ?? a.email}
                {a.user_id === menId && (
                  <span className="text-text-faint"> ({t('tj.siz')})</span>
                )}
              </span>
              {a.ism && <span className="block truncate text-xs text-text-faint">{a.email}</span>}
            </span>
            {a.rol === 'rahbar' && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-status-progress px-2 py-0.5 text-xs font-semibold text-status-progress-text">
                <Crown className="size-3" aria-hidden />
                {t('tj.rahbar')}
              </span>
            )}
            {rahbarmi && a.rol !== 'rahbar' && (
              <button
                type="button"
                disabled={!onlayn || amal.isPending}
                onClick={() =>
                  bajar({ tur: 'chiqarish', jamoa: jamoa.id, user: a.user_id }, t('tj.chiqarildi'))
                }
                aria-label={t('tj.chiqarish')}
                title={t('tj.chiqarish')}
                className="min-h-0 shrink-0 rounded-lg p-1.5 text-text-faint transition hover:bg-danger-soft hover:text-danger disabled:opacity-40"
              >
                <UserMinus className="size-4" aria-hidden />
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            havolaniUlash(t('tj.jamoaTaklifMatni', { nom: jamoa.nom }), jamoaHavolasi(jamoa.taklif_kodi))
          }
          className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <Link2 className="size-4" aria-hidden />
          {t('tj.azoTaklifQilish')}
        </button>
        {rahbarmi ? (
          <>
            <button
              type="button"
              disabled={!onlayn}
              onClick={() => setTasdiq('kod')}
              className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-3 text-sm font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
            >
              <RefreshCw className="size-4" aria-hidden />
              {t('tj.havolaniYangilash')}
            </button>
            <button
              type="button"
              disabled={!onlayn}
              onClick={() => setTasdiq('ochirish')}
              className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-3 text-sm font-medium text-danger transition hover:bg-danger-soft disabled:opacity-40"
            >
              <Trash2 className="size-4" aria-hidden />
              {t('tj.jamoaniOchirish')}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={!onlayn}
            onClick={() => setTasdiq('chiqish')}
            className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-3 text-sm font-medium text-danger transition hover:bg-danger-soft disabled:opacity-40"
          >
            <LogOut className="size-4" aria-hidden />
            {t('tj.jamoadanChiqish')}
          </button>
        )}
      </div>

      {tasdiq && (
        <Tasdiq
          sarlavha={
            tasdiq === 'kod'
              ? t('tj.havolaniYangilash')
              : tasdiq === 'ochirish'
                ? t('tj.jamoaniOchirish')
                : t('tj.jamoadanChiqish')
          }
          matn={
            tasdiq === 'kod'
              ? t('tj.havolaniYangilashIzoh')
              : tasdiq === 'ochirish'
                ? t('tj.jamoaniOchirishIzoh', { nom: jamoa.nom })
                : t('tj.jamoadanChiqishIzoh', { nom: jamoa.nom })
          }
          tasdiqla={() =>
            tasdiq === 'kod'
              ? bajar({ tur: 'kodYangilash', jamoa: jamoa.id }, t('tj.havolaYangilandi'))
              : tasdiq === 'ochirish'
                ? bajar({ tur: 'ochirish', jamoa: jamoa.id }, t('tj.jamoaOchirildi'))
                : bajar({ tur: 'chiqish', jamoa: jamoa.id }, t('tj.jamoadanChiqildi'))
          }
          yop={() => setTasdiq(null)}
          tugmaMatni={
            tasdiq === 'kod'
              ? t('tj.havolaniYangilash')
              : tasdiq === 'ochirish'
                ? t('tj.jamoaniOchirish')
                : t('tj.jamoadanChiqish')
          }
          xavfli={tasdiq !== 'kod'}
          bajarilmoqda={amal.isPending}
        />
      )}
    </div>
  )
}

function YangiJamoaOynasi({ yop }: { yop: () => void }) {
  const t = useT()
  const { korsat } = useToast()
  const yaratish = useJamoaYaratish()
  const [nom, setNom] = useState('')

  async function yarat() {
    if (!nom.trim() || yaratish.isPending) return
    try {
      await yaratish.mutateAsync(nom)
      korsat({ matn: t('tj.jamoaYaratildi'), tone: 'muvaffaqiyat' })
      yop()
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <Oyna sarlavha={t('tj.jamoaYaratish')} yop={yop}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          yarat()
        }}
      >
        <label className="mb-1.5 block text-sm font-medium text-text-muted" htmlFor="jamoa-nomi">
          {t('tj.jamoaNomi')}
        </label>
        <input
          id="jamoa-nomi"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder={t('tj.jamoaNomiJoy')}
          maxLength={80}
          autoFocus
          className="min-h-touch w-full rounded-xl border border-border-control bg-surface px-4 text-base text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />
        <p className="mt-3 text-sm leading-relaxed text-text-muted">{t('tj.jamoaYaratishIzoh')}</p>
        <button
          type="submit"
          disabled={!nom.trim() || yaratish.isPending}
          className="mt-5 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Plus className="size-4" aria-hidden />
          {t('tj.yaratish')}
        </button>
      </form>
    </Oyna>
  )
}

/**
 * Havola orqali kelgan odam: `?jamoa=KOD` — qo'shilishni so'raymiz
 * (qaysi jamoa ekanini ko'rsatib); `?taklif=KOD` — shaxsiy taklif,
 * darhol ulanadi (bu xavfsiz: faqat ikki kishi bir-birining
 * kontaktiga tushadi va yozishga ruxsat oladi).
 *
 * `useSearchParams` o'rniga `window.location`: u sahifani Suspense'ga
 * o'rashni talab qilardi, statik (ilova) eksportda esa muammo beradi.
 */
export function TaklifQabulQiluvchi() {
  const t = useT()
  const { korsat } = useToast()
  const [jamoaKodi, setJamoaKodi] = useState<string | null>(null)
  const ulanish = useTaklifOrqaliUlanish()
  const qoshilish = useJamoagaQoshilish()
  const { data: taklif, isPending, isError } = useJamoaTaklifi(jamoaKodi)
  const bajarildi = useRef(false)

  useEffect(() => {
    if (bajarildi.current) return
    bajarildi.current = true
    const p = new URLSearchParams(window.location.search)
    const jamoa = p.get('jamoa')
    const shaxsiy = p.get('taklif')
    if (!jamoa && !shaxsiy) return

    // Manzilni tozalaymiz: sahifa yangilanganda qayta so'ralmasin
    p.delete('jamoa')
    p.delete('taklif')
    const qolgan = p.toString()
    window.history.replaceState(
      null,
      '',
      window.location.pathname + (qolgan ? `?${qolgan}` : '')
    )

    if (jamoa) setJamoaKodi(jamoa)
    if (shaxsiy) {
      ulanish
        .mutateAsync(shaxsiy)
        .then((ism) => {
          if (ism) korsat({ matn: t('tj.ulandingiz', { kim: ism }), tone: 'muvaffaqiyat' })
        })
        .catch(() => korsat({ matn: t('tj.taklifNotogri'), tone: 'xato' }))
    }
    // Faqat bir marta, sahifa ochilganda
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!jamoaKodi) return null
  const yop = () => setJamoaKodi(null)

  if (isPending) return null
  if (isError || !taklif) {
    return (
      <Oyna sarlavha={t('tj.jamoagaQoshilish')} yop={yop}>
        <p className="text-sm text-text-muted">{t('tj.taklifNotogri')}</p>
      </Oyna>
    )
  }

  return (
    <Oyna sarlavha={t('tj.jamoagaQoshilish')} yop={yop}>
      <p className="text-base text-text-strong">
        {taklif.azomi
          ? t('tj.allaqachonAzo', { nom: taklif.nom })
          : t('tj.qoshilasizmi', { nom: taklif.nom, son: taklif.azolar })}
      </p>
      {!taklif.azomi && (
        <>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">{t('tj.qoshilishIzoh')}</p>
          <button
            type="button"
            disabled={qoshilish.isPending}
            onClick={async () => {
              try {
                await qoshilish.mutateAsync(jamoaKodi)
                korsat({ matn: t('tj.qoshildingiz', { nom: taklif.nom }), tone: 'muvaffaqiyat' })
                yop()
              } catch {
                korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
              }
            }}
            className="mt-5 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
          >
            <Users className="size-4" aria-hidden />
            {t('tj.qoshilish')}
          </button>
        </>
      )}
    </Oyna>
  )
}
