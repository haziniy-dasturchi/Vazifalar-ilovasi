'use client'

import { useState } from 'react'
import {
  Check,
  ChevronRight,
  CornerUpLeft,
  Play,
  Repeat2,
} from 'lucide-react'
import { useVazifaHolati } from '@/lib/queries/vazifalar'
import { useToast } from '@/components/ui/toast'
import { VazifaOynasi } from '@/components/vazifa/vazifa-oynasi'
import { MUHIMLIK_NOMI, MUHIMLIK_RANGI } from '@/lib/papka-stillari'
import {
  kechikishMatni,
  kechikkanmi,
  sanaMatni,
  vaqtHolati,
  vaqtMatni,
  type VaqtHolati,
} from '@/lib/sana'
import type { Task } from '@/types/vazifalar'

/** Vaqt holatiga qarab rang: o'tgan — qizil, yaqin — sariq, kelgusi — yashil */
const VAQT_RANGI: Record<VaqtHolati, string> = {
  otgan: 'text-red-600',
  hozir: 'text-amber-600',
  kelgusi: 'text-emerald-600',
}

export function VazifaQatori({
  vazifa,
  subtasklar = [],
  papkaNomi,
  papkaRangi,
}: {
  vazifa: Task
  subtasklar?: Task[]
  papkaNomi?: string
  papkaRangi?: string
}) {
  const holat = useVazifaHolati()
  const { korsat } = useToast()
  const [ochiq, setOchiq] = useState(false)
  const [tahrirOchiq, setTahrirOchiq] = useState(false)

  const bajarilgan = vazifa.status === 'done'
  const jarayonda = vazifa.status === 'in_progress'
  const kechikkan = !bajarilgan && kechikkanmi(vazifa.due_date)
  const ochiqSubtask = subtasklar.filter((s) => s.status !== 'done').length

  async function harakat(
    tur: 'boshlash' | 'rejaga' | 'bajarish' | 'qaytarish'
  ) {
    try {
      await holat.mutateAsync({
        id: vazifa.id,
        harakat: tur,
        subtasklarBilan: tur === 'bajarish' && ochiqSubtask > 0,
      })
    } catch {
      korsat({ matn: 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <li>
      <div
        className={`group flex items-start gap-3 rounded-2xl p-3 transition ${
          jarayonda
            ? 'border-l-4 border-status-progress-line bg-status-progress'
            : 'bg-surface shadow-card'
        } ${bajarilgan ? 'opacity-55' : ''}`}
      >
        {/* Belgilash doirasi — rangi muhimlikdan */}
        <button
          type="button"
          onClick={() => harakat(bajarilgan ? 'qaytarish' : 'bajarish')}
          aria-label={bajarilgan ? 'Rejaga qaytarish' : 'Bajarildi'}
          title={MUHIMLIK_NOMI[vazifa.priority]}
          className="mt-0.5 flex size-11 min-h-0 shrink-0 items-center justify-center rounded-full"
        >
          <span
            className={`flex size-6 items-center justify-center rounded-full border-2 transition ${
              bajarilgan ? 'text-white' : 'text-transparent'
            }`}
            style={{
              borderColor: MUHIMLIK_RANGI[vazifa.priority],
              backgroundColor: bajarilgan
                ? MUHIMLIK_RANGI[vazifa.priority]
                : 'transparent',
            }}
          >
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setTahrirOchiq(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setTahrirOchiq(true)
            }
          }}
          className="min-w-0 flex-1 cursor-pointer py-1.5"
        >
          <p
            className={`text-base leading-snug break-words ${
              bajarilgan
                ? 'text-text-muted line-through'
                : 'text-text-strong'
            }`}
          >
            {vazifa.title}
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {vazifa.due_date && (
              <span className={kechikkan ? 'font-medium text-red-600' : 'text-text-muted'}>
                {kechikkan
                  ? kechikishMatni(vazifa.due_date)
                  : sanaMatni(vazifa.due_date)}
              </span>
            )}

            {vazifa.due_date && vazifa.due_time && (
              <span
                className={
                  bajarilgan
                    ? 'text-text-muted'
                    : `font-medium ${VAQT_RANGI[vaqtHolati(vazifa.due_date, vazifa.due_time)]}`
                }
              >
                {vaqtMatni(vazifa.due_time)}
              </span>
            )}

            {vazifa.recurrence && (
              <span
                className="flex items-center gap-1 text-text-muted"
                title="Takrorlanadi"
              >
                <Repeat2 className="size-3.5" aria-hidden />
              </span>
            )}

            {papkaNomi && (
              <span className="flex items-center gap-1.5 text-text-muted">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: papkaRangi ?? '#9ca3af' }}
                  aria-hidden
                />
                {papkaNomi}
              </span>
            )}

            {subtasklar.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOchiq((v) => !v)
                }}
                aria-expanded={ochiq}
                className="flex min-h-0 items-center gap-1 rounded-md text-text-muted transition hover:text-brand-primary"
              >
                <ChevronRight
                  className={`size-3.5 transition ${ochiq ? 'rotate-90' : ''}`}
                  aria-hidden
                />
                {subtasklar.length - ochiqSubtask}/{subtasklar.length} qadam
              </button>
            )}
          </div>
        </div>

        {/* Holat tugmasi */}
        {!bajarilgan && (
          <button
            type="button"
            onClick={() => harakat(jarayonda ? 'rejaga' : 'boshlash')}
            aria-label={jarayonda ? 'Rejaga qaytarish' : 'Boshlash'}
            className={`flex size-11 min-h-0 shrink-0 items-center justify-center rounded-xl transition ${
              jarayonda
                ? 'text-status-progress-text hover:bg-amber-200/60'
                : 'text-text-faint hover:bg-surface-muted hover:text-brand-primary'
            }`}
          >
            {jarayonda ? (
              <CornerUpLeft className="size-5" aria-hidden />
            ) : (
              <Play className="size-5" aria-hidden />
            )}
          </button>
        )}
      </div>

      {/* Subtasklar */}
      {ochiq && subtasklar.length > 0 && (
        <ul className="mt-2 ml-7 space-y-2 border-l-2 border-border-subtle pl-3">
          {subtasklar.map((s) => (
            <VazifaQatori key={s.id} vazifa={s} />
          ))}
        </ul>
      )}

      {tahrirOchiq && (
        <VazifaOynasi vazifa={vazifa} yop={() => setTahrirOchiq(false)} />
      )}
    </li>
  )
}
