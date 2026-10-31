'use client'

import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { Calendar, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react'
import { OYLAR, isoDan, isoGa, toliqSana } from '@/lib/sana'

/** Dushanbadan boshlab hafta kunlari qisqartmasi (kalendar sarlavhasi uchun) */
const HAFTA_KUNLARI = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

/**
 * To'liq mustaqil kalendar + ixtiyoriy vaqt tanlagich.
 *
 * Brauzer/qurilmaning o'z sana tanlagichiga (`<input type="date">`)
 * tayanmaydi — ba'zi muhitlarda (PWA oynasi, embedded brauzerlar)
 * uning tabiiy oynasi ochilmasligi mumkin. Shuning uchun kalendar
 * tarmog'i o'zimizda chiziladi, faqat natija ISO satr ko'rinishida
 * tashqariga chiqadi.
 */
export function SanaTanlagich({
  sana,
  vaqt,
  onSanaChange,
  onVaqtChange,
}: {
  sana: string | null
  vaqt: string | null
  onSanaChange: (iso: string | null) => void
  onVaqtChange: (hhmm: string | null) => void
}) {
  const [ochiq, setOchiq] = useState(false)
  const [korinishOy, setKorinishOy] = useState(() => (sana ? isoDan(sana) : new Date()))

  function ochish() {
    setKorinishOy(sana ? isoDan(sana) : new Date())
    setOchiq(true)
  }

  const kunlar = eachDayOfInterval({
    start: startOfWeek(startOfMonth(korinishOy), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(korinishOy), { weekStartsOn: 1 }),
  })

  const tanlanganSana = sana ? isoDan(sana) : null
  const label = sana
    ? `${toliqSana(sana)}${vaqt ? ` · ${vaqt}` : ''}`
    : 'Sana tanlash'

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={() => (ochiq ? setOchiq(false) : ochish())}
        aria-expanded={ochiq}
        aria-pressed={Boolean(sana)}
        className={`flex min-h-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
          sana
            ? 'border-brand-primary bg-brand-soft text-brand-primary'
            : 'border-border-subtle text-text-strong hover:bg-surface-muted'
        }`}
      >
        <Calendar className="size-4" aria-hidden />
        {label}
      </button>

      {ochiq && (
        <>
          <button
            type="button"
            aria-label="Yopish"
            onClick={() => setOchiq(false)}
            className="fixed inset-0 z-10 min-h-0 cursor-default"
          />
          <div className="absolute top-full left-0 z-20 mt-2 w-72 rounded-2xl border border-border-subtle bg-surface p-3 shadow-float">
            {/* Oy navigatsiyasi */}
            <div className="mb-2 flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => setKorinishOy((d) => subMonths(d, 1))}
                aria-label="Oldingi oy"
                className="flex size-8 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </button>
              <span className="text-sm font-semibold text-text-strong capitalize">
                {OYLAR[korinishOy.getMonth()]} {korinishOy.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => setKorinishOy((d) => addMonths(d, 1))}
                aria-label="Keyingi oy"
                className="flex size-8 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>

            {/* Hafta kunlari sarlavhasi */}
            <div className="grid grid-cols-7 gap-1 px-1">
              {HAFTA_KUNLARI.map((k) => (
                <span
                  key={k}
                  className="py-1 text-center text-xs font-medium text-text-faint"
                >
                  {k}
                </span>
              ))}
            </div>

            {/* Kunlar panjarasi */}
            <div className="grid grid-cols-7 gap-1 px-1">
              {kunlar.map((kun) => {
                const shuOyda = isSameMonth(kun, korinishOy)
                const tanlangan = tanlanganSana && isSameDay(kun, tanlanganSana)
                const bugun = isToday(kun)
                return (
                  <button
                    key={kun.toISOString()}
                    type="button"
                    onClick={() => onSanaChange(isoGa(kun))}
                    className={`flex size-9 min-h-0 items-center justify-center rounded-full text-sm transition ${
                      tanlangan
                        ? 'bg-brand-primary font-semibold text-white'
                        : bugun
                          ? 'border border-brand-primary text-brand-primary'
                          : shuOyda
                            ? 'text-text-strong hover:bg-surface-muted'
                            : 'text-text-faint hover:bg-surface-muted'
                    }`}
                  >
                    {kun.getDate()}
                  </button>
                )
              })}
            </div>

            {/* Ixtiyoriy vaqt */}
            {sana && (
              <div className="mt-3 flex items-center gap-2 border-t border-border-subtle px-1 pt-3">
                <Clock className="size-4 shrink-0 text-text-faint" aria-hidden />
                <input
                  type="time"
                  value={vaqt ?? ''}
                  onChange={(e) => onVaqtChange(e.target.value || null)}
                  aria-label="Vaqtni tanlang (ixtiyoriy)"
                  className="min-h-0 flex-1 rounded-lg border border-border-subtle px-2 py-1.5 text-sm text-text-strong outline-none focus:border-brand-primary"
                />
                {vaqt && (
                  <button
                    type="button"
                    onClick={() => onVaqtChange(null)}
                    aria-label="Vaqtni olib tashlash"
                    className="flex size-7 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-muted hover:text-text-strong"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                )}
              </div>
            )}

            {/* Pastki tugmalar */}
            <div className="mt-3 flex items-center justify-between border-t border-border-subtle px-1 pt-3">
              <button
                type="button"
                onClick={() => {
                  onSanaChange(null)
                  onVaqtChange(null)
                  setOchiq(false)
                }}
                disabled={!sana}
                className="min-h-0 rounded-lg px-2 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-0"
              >
                Olib tashlash
              </button>
              <button
                type="button"
                onClick={() => setOchiq(false)}
                className="min-h-0 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
              >
                Tayyor
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
