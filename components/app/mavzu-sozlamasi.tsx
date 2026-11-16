'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import {
  amaldagiMavzu,
  mavzugaObuna,
  mavzuniOqi,
  mavzuniOrnat,
  mavzuniQolla,
} from '@/lib/mavzu'
import type { MatnKaliti } from '@/lib/i18n'
import type { Theme } from '@/types/vazifalar'

const VARIANTLAR: {
  qiymat: Theme
  nom: MatnKaliti
  ikonka: typeof Sun
}[] = [
  { qiymat: 'system', nom: 'sozlamalar.korinish.tizim', ikonka: Monitor },
  { qiymat: 'light', nom: 'sozlamalar.korinish.yorug', ikonka: Sun },
  { qiymat: 'dark', nom: 'sozlamalar.korinish.qorongi', ikonka: Moon },
]

/**
 * Mavzu tanlash.
 *
 * Uchta holat bor, chunki "tizim bo'yicha" eng ko'p kutiladigan
 * xatti-harakat, lekin ba'zi odamlar telefonini yorug' rejimda
 * ishlatib, aynan shu ilovani qorong'i ko'rishni xohlaydi (mijoz
 * shuni so'ragan).
 */
export function MavzuSozlamasi({
  /** Tanlov o'zgarganda chaqiriladi — hisobga saqlash uchun */
  onOzgarish,
}: {
  onOzgarish?: (mavzu: Theme) => void
} = {}) {
  const mavzu = useSyncExternalStore(mavzugaObuna, mavzuniOqi, () => 'system')
  const t = useT()

  /**
   * Tizim sozlamasi ish paytida o'zgarsa ("tizim" tanlangan bo'lsa)
   * ostidagi yozuv ham yangilanishi kerak.
   */
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const yangila = () => mavzuniQolla(mavzuniOqi())
    mq.addEventListener('change', yangila)
    return () => mq.removeEventListener('change', yangila)
  }, [])

  const hozir = amaldagiMavzu(mavzu as Theme)

  const tavsif =
    mavzu === 'system'
      ? t('sozlamalar.korinish.tizimTavsif', {
          holat:
            hozir === 'dark'
              ? t('sozlamalar.korinish.qorongi')
              : t('sozlamalar.korinish.yorug'),
        })
      : mavzu === 'dark'
        ? t('sozlamalar.korinish.qorongiTavsif')
        : t('sozlamalar.korinish.yorugTavsif')

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-card">
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
          {hozir === 'dark' ? (
            <Moon className="size-5 text-brand-onsoft" aria-hidden />
          ) : (
            <Sun className="size-5 text-brand-onsoft" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">
            {t('sozlamalar.korinish.sarlavha')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            {tavsif}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label={t('sozlamalar.korinish.sarlavha')}
        className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1"
      >
        {VARIANTLAR.map((v) => {
          const tanlangan = mavzu === v.qiymat
          return (
            <button
              key={v.qiymat}
              type="button"
              role="radio"
              aria-checked={tanlangan}
              onClick={() => {
                mavzuniOrnat(v.qiymat)
                onOzgarish?.(v.qiymat)
              }}
              className={`flex min-h-0 items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-sm font-medium transition ${
                tanlangan
                  ? 'bg-surface text-text-strong shadow-card'
                  : 'text-text-muted hover:text-text-strong'
              }`}
            >
              <v.ikonka className="size-4 shrink-0" aria-hidden />
              {t(v.nom)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
