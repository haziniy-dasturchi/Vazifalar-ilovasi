'use client'

import { Calendar, X } from 'lucide-react'
import { toliqSana } from '@/lib/sana'

/**
 * "Istalgan sana" pilli: brauzerning o'z kalendar oynasini ochadi.
 *
 * Ko'rinadigan pill ustiga shaffof <input type="date"> qo'yilgan —
 * foydalanuvchi pill ustiga bossa, qurilma/brauzerning tabiiy
 * kalendar tanlagichi ochiladi (qo'shimcha kutubxona shart emas).
 */
export function SanaTanlagich({
  value,
  onChange,
}: {
  value: string | null
  onChange: (iso: string | null) => void
}) {
  const tanlangan = Boolean(value)

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative inline-flex">
        <span
          className={`pointer-events-none flex min-h-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
            tanlangan
              ? 'border-brand-primary bg-brand-soft text-brand-primary'
              : 'border-border-subtle text-text-strong'
          }`}
        >
          <Calendar className="size-4" aria-hidden />
          {value ? toliqSana(value) : 'Sana tanlash'}
        </span>
        <input
          type="date"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-label="Sanani tanlang"
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>

      {tanlangan && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Sanani olib tashlash"
          className="flex size-9 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-muted hover:text-text-strong"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  )
}
