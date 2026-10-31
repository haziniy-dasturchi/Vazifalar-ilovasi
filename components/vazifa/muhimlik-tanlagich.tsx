'use client'

import { Flag } from 'lucide-react'
import { MUHIMLIK_NOMI, MUHIMLIK_RANGI } from '@/lib/papka-stillari'
import type { TaskPriority } from '@/types/vazifalar'

const DARAJALAR: TaskPriority[] = [1, 2, 3, 4]

/** Todoist uslubidagi P1–P4 bayroqchalar. Default — P4. */
export function MuhimlikTanlagich({
  qiymat,
  onChange,
}: {
  qiymat: TaskPriority
  onChange: (p: TaskPriority) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {DARAJALAR.map((p) => {
        const tanlangan = qiymat === p
        const rang = MUHIMLIK_RANGI[p]
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-pressed={tanlangan}
            title={MUHIMLIK_NOMI[p]}
            className={`flex min-h-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              tanlangan
                ? 'border-current'
                : 'border-border-subtle text-text-strong hover:bg-surface-muted'
            }`}
            style={
              tanlangan ? { borderColor: rang, color: rang, backgroundColor: rang + '1a' } : undefined
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
