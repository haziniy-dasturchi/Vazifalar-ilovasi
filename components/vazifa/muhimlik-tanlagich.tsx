'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { MUHIMLIK_NOMI, MUHIMLIK_RANGI } from '@/lib/papka-stillari'
import type { TaskPriority } from '@/types/vazifalar'

const DARAJALAR: TaskPriority[] = [1, 2, 3, 4]

/**
 * Todoist uslubidagi P1–P4 bayroqchalar. Default — P4.
 *
 * `ixcham` rejimida avval faqat tanlangan daraja ko'rinadi va
 * bosilganda qolganlari ochiladi. Bu tezkor qo'shish qatori uchun:
 * u yerda sana, papka va muhimlik yonma-yon turadi, to'rtta tugma
 * esa qatorni telefonda uch qavatga cho'zib yuborardi.
 */
export function MuhimlikTanlagich({
  qiymat,
  onChange,
  ixcham = false,
}: {
  qiymat: TaskPriority
  onChange: (p: TaskPriority) => void
  ixcham?: boolean
}) {
  const [yoyilgan, setYoyilgan] = useState(false)
  const korinadigan = ixcham && !yoyilgan ? [qiymat] : DARAJALAR

  return (
    <div className="flex flex-wrap items-center gap-2">
      {korinadigan.map((p) => {
        const tanlangan = qiymat === p
        const rang = MUHIMLIK_RANGI[p]
        return (
          <button
            key={p}
            type="button"
            onClick={() => {
              if (ixcham && !yoyilgan) {
                setYoyilgan(true)
                return
              }
              onChange(p)
              if (ixcham) setYoyilgan(false)
            }}
            aria-pressed={tanlangan}
            aria-label={MUHIMLIK_NOMI[p]}
            title={MUHIMLIK_NOMI[p]}
            className={`flex min-h-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              tanlangan
                ? 'border-current'
                : 'border-border-subtle text-text-strong hover:bg-surface-muted'
            }`}
            style={
              tanlangan
                ? { borderColor: rang, color: rang, backgroundColor: rang + '1a' }
                : undefined
            }
          >
            <Flag className="size-4" style={{ color: rang }} aria-hidden />
            P{p}
          </button>
        )
      })}
    </div>
  )
}
