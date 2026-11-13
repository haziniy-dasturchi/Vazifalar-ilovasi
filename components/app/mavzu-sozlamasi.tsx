'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  amaldagiMavzu,
  mavzugaObuna,
  mavzuniOqi,
  mavzuniOrnat,
  mavzuniQolla,
} from '@/lib/mavzu'
import type { Theme } from '@/types/vazifalar'

const VARIANTLAR: {
  qiymat: Theme
  nom: string
  ikonka: typeof Sun
}[] = [
  { qiymat: 'system', nom: 'Tizim', ikonka: Monitor },
  { qiymat: 'light', nom: 'Yorug‘', ikonka: Sun },
  { qiymat: 'dark', nom: 'Qorong‘i', ikonka: Moon },
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
          <p className="font-semibold text-text-strong">Ko‘rinish</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            {mavzu === 'system'
              ? 'Qurilma sozlamasiga moslashadi — hozir ' +
                (hozir === 'dark' ? 'qorong‘i' : 'yorug‘') +
                '.'
              : mavzu === 'dark'
                ? 'Doim qorong‘i — qurilma yorug‘ rejimda bo‘lsa ham.'
                : 'Doim yorug‘ — qurilma qorong‘i rejimda bo‘lsa ham.'}
          </p>
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Ko‘rinish"
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
              {v.nom}
            </button>
          )
        })}
      </div>
    </div>
  )
}
