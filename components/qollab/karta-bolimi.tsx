'use client'

import { useState } from 'react'
import { Check, Copy, CreditCard } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { KARTA } from '@/lib/qollab'

/** 9860123412341234 -> 9860 1234 1234 1234 */
function kartaKorinishi(raqam: string): string {
  return raqam.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Vaqtinchalik: karta raqami + "Nusxa" tugmasi.
 * Payme/Click merchant ulangach olib tashlanadi yoki zaxira bo'lib qoladi.
 */
export function KartaBolimi() {
  const { korsat } = useToast()
  const [nusxalandi, setNusxalandi] = useState(false)
  const raqam = KARTA.raqam.replace(/\D/g, '')

  if (raqam.length < 16) return null

  async function nusxaOl() {
    try {
      await navigator.clipboard.writeText(raqam)
      setNusxalandi(true)
      setTimeout(() => setNusxalandi(false), 2000)
    } catch {
      korsat({ matn: 'Nusxa olib bo‘lmadi — raqamni qo‘lda yozing', tone: 'xato' })
    }
  }

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
      <h2 className="flex items-center gap-2 font-semibold text-text-strong">
        <CreditCard className="size-4 text-brand-onsoft" aria-hidden />
        Karta orqali qo‘llab-quvvatlash
      </h2>
      <p className="mt-1 text-sm text-text-muted">
        Raqamni nusxalang va bank ilovangizdan istalgan summani o‘tkazing.
      </p>

      {/* Telefonda raqam to'liq kenglikda, tugma ostida — tor ekranda
          yonma-yon qo'yilsa raqam kesilib qolardi */}
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border-subtle px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {/* `select-all`: clipboard ruxsati bo'lmasa ham bir bosishda
              butun raqam belgilanadi — qo'lda nusxalash oson */}
          <p className="text-lg font-semibold tracking-wide whitespace-nowrap text-text-strong tabular-nums select-all">
            {kartaKorinishi(raqam)}
          </p>
          {KARTA.egasi && (
            <p className="truncate text-xs text-text-muted uppercase">{KARTA.egasi}</p>
          )}
        </div>
        <button
          type="button"
          onClick={nusxaOl}
          className={`flex min-h-touch shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
            nusxalandi
              ? 'bg-brand-soft text-brand-onsoft'
              : 'bg-brand-primary text-white hover:opacity-90'
          }`}
        >
          {nusxalandi ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
          {nusxalandi ? 'Nusxalandi' : 'Nusxa'}
        </button>
      </div>

      <p className="mt-3 text-xs text-text-faint">
        Ixtiyoriy. To‘lov qilmaganlar uchun ham ilovada hech narsa
        cheklanmaydi.
      </p>
    </section>
  )
}
