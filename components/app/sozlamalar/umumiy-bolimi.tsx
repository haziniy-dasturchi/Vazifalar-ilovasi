'use client'

import { useMemo, useState } from 'react'
import { Check, LocateFixed } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
import { useT, useTil } from '@/components/app/til-provayder'
import { useProfil, useProfilYangilash } from '@/lib/queries/profil'
import { TILLAR } from '@/lib/i18n'

/** Brauzer ro'yxat bermasa — kamida shular bo'lsin */
const ZAXIRA_MINTAQALAR = [
  'Asia/Tashkent',
  'Asia/Samarkand',
  'Asia/Almaty',
  'Asia/Dubai',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Europe/London',
  'UTC',
]

function mintaqalarRoyxati(): string[] {
  const Intl_ = Intl as typeof Intl & {
    supportedValuesOf?: (kalit: string) => string[]
  }
  try {
    const royxat = Intl_.supportedValuesOf?.('timeZone')
    if (royxat && royxat.length > 0) return royxat
  } catch {
    // Eski brauzerlar — zaxira ro'yxat ishlatiladi
  }
  return ZAXIRA_MINTAQALAR
}

export function UmumiyBolimi() {
  const { data: profil } = useProfil()
  const yangilash = useProfilYangilash()
  const { korsat } = useToast()
  const t = useT()
  const { til } = useTil()
  const [saqlanmoqda, setSaqlanmoqda] = useState(false)

  const mintaqalar = useMemo(mintaqalarRoyxati, [])
  const joriy = profil?.timezone ?? 'Asia/Tashkent'
  const qurilmadagi = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Saqlangan mintaqa ro'yxatda bo'lmasa ham ko'rinsin
  const variantlar = mintaqalar.includes(joriy)
    ? mintaqalar
    : [joriy, ...mintaqalar]

  async function mintaqaniOrnat(mintaqa: string) {
    if (mintaqa === joriy) return
    setSaqlanmoqda(true)
    try {
      await yangilash.mutateAsync({ timezone: mintaqa })
      korsat({ matn: t('sozlamalar.mintaqa.saqlandi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.saqlanmadi'), tone: 'xato' })
    } finally {
      setSaqlanmoqda(false)
    }
  }

  async function tilniOrnat(yangiTil: string) {
    if (yangiTil === til) return
    try {
      await yangilash.mutateAsync({ lang: yangiTil })
      // Xabar YANGI tilda ko'rinishi kerak — eskisida emas
      korsat({ matn: t('sozlamalar.til.saqlandi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.saqlanmadi'), tone: 'xato' })
    }
  }

  const hozir = new Date().toLocaleTimeString(til, {
    timeZone: joriy,
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="space-y-4">
      <SozlamaKartasi
        sarlavha={t('sozlamalar.til.sarlavha')}
        tavsif={t('sozlamalar.til.tavsif')}
      >
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
          {TILLAR.map(({ kod, nomOzTilida }) => {
            const tanlangan = kod === til
            return (
              <li key={kod}>
                <button
                  type="button"
                  onClick={() => tilniOrnat(kod)}
                  disabled={yangilash.isPending}
                  aria-pressed={tanlangan}
                  lang={kod}
                  className={`flex min-h-touch w-full items-center gap-3 px-4 text-left text-base transition disabled:opacity-50 ${
                    tanlangan
                      ? 'bg-brand-soft font-semibold text-brand-onsoft'
                      : 'text-text-strong hover:bg-surface-muted'
                  }`}
                >
                  <span className="flex-1">{nomOzTilida}</span>
                  {tanlangan && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      </SozlamaKartasi>

      <SozlamaKartasi
        sarlavha={t('sozlamalar.mintaqa.sarlavha')}
        tavsif={t('sozlamalar.mintaqa.tavsif', { vaqt: hozir })}
      >
        <div className="space-y-2">
          <select
            value={joriy}
            onChange={(e) => mintaqaniOrnat(e.target.value)}
            disabled={saqlanmoqda}
            aria-label={t('sozlamalar.mintaqa.sarlavha')}
            className="min-h-touch w-full rounded-xl border border-border-control bg-surface px-4 text-base text-text-strong outline-none focus:border-brand-onsoft disabled:opacity-50"
          >
            {variantlar.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {qurilmadagi && qurilmadagi !== joriy && (
            <button
              type="button"
              onClick={() => mintaqaniOrnat(qurilmadagi)}
              disabled={saqlanmoqda}
              className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
            >
              <LocateFixed className="size-4" aria-hidden />
              {t('sozlamalar.mintaqa.qurilmadagi', { mintaqa: qurilmadagi })}
            </button>
          )}
        </div>
      </SozlamaKartasi>
    </div>
  )
}
