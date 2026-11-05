'use client'

import { Check } from 'lucide-react'

/** 0, 10, 20 ... 100 — bazadagi cheklov bilan bir xil */
export const FOIZ_QADAMLARI = [
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
] as const

/**
 * Bajarilish foizini "suv to'lgan doira" ko'rinishida ko'rsatadi.
 * Pastdan yuqoriga och yashil suv ko'tariladi; 100% da to'ladi va
 * ichida belgi (✓) chiqadi.
 */
export function SuvDoira({
  foiz,
  bajarilgan = false,
  chegaraRangi,
  olcham = 'katta',
}: {
  foiz: number
  bajarilgan?: boolean
  /** Odatda vazifaning muhimlik rangi */
  chegaraRangi?: string
  olcham?: 'kichik' | 'katta'
}) {
  const katta = olcham === 'katta'

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition ${
        katta ? 'size-14' : 'size-6'
      } ${bajarilgan ? 'text-white' : 'text-transparent'}`}
      style={{
        borderColor: chegaraRangi,
        backgroundColor: bajarilgan ? chegaraRangi : 'transparent',
      }}
    >
      {/* Suv — faqat tugallanmagan holatda ko'rinadi, aks holda
          doira muhimlik rangi bilan to'liq bo'yaladi */}
      {!bajarilgan && foiz > 0 && (
        <span
          aria-hidden
          className="absolute inset-x-0 bottom-0 bg-brand-leaf transition-[height] duration-300"
          style={{ height: `${foiz}%` }}
        />
      )}

      {katta ? (
        <span
          className={`relative text-sm font-bold ${
            bajarilgan ? 'text-white' : 'text-text-strong'
          }`}
        >
          {foiz}%
        </span>
      ) : (
        <Check className="relative size-4" strokeWidth={3} aria-hidden />
      )}
    </span>
  )
}

/**
 * Foizni tanlash maydoni — vazifa oynasida ishlatiladi.
 * Ixtiyoriy: 0 bo'lsa hech narsa ko'rsatilmaydi, vazifa odatdagidek.
 */
export function FoizTanlagich({
  qiymat,
  onChange,
}: {
  qiymat: number
  onChange: (foiz: number) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <SuvDoira foiz={qiymat} chegaraRangi="var(--color-brand-accent)" />

      <div
        role="group"
        aria-label="Bajarilish foizi"
        className="grid flex-1 grid-cols-6 gap-1.5"
      >
        {FOIZ_QADAMLARI.map((f) => {
          const tanlangan = qiymat === f
          return (
            <button
              key={f}
              type="button"
              onClick={() => onChange(f)}
              aria-pressed={tanlangan}
              className={`min-h-0 rounded-lg border py-2 text-xs font-medium transition ${
                tanlangan
                  ? 'border-brand-primary bg-brand-soft text-brand-primary'
                  : 'border-border-subtle text-text-muted hover:bg-surface-muted'
              }`}
            >
              {f}
            </button>
          )
        })}
      </div>
    </div>
  )
}
