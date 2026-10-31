'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { Calendar, ChevronLeft, ChevronRight, Clock, Repeat2, X } from 'lucide-react'
import { OYLAR, isoDan, isoGa, toliqSana } from '@/lib/sana'
import type { Recurrence } from '@/types/vazifalar'

/** Dushanbadan boshlab hafta kunlari qisqartmasi (kalendar sarlavhasi uchun) */
const HAFTA_KUNLARI = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']

/** Tez tanlash uchun eng ko'p ishlatiladigan vaqtlar */
const TEZ_VAQTLAR = ['09:00', '12:00', '15:00', '18:00', '21:00']

const TAKRORLANISH_VARIANTLARI: { nom: string; qiymat: Recurrence | null }[] = [
  { nom: 'Yo‘q', qiymat: null },
  { nom: 'Har kuni', qiymat: 'daily' },
  { nom: 'Ish kunlari', qiymat: 'weekdays' },
  { nom: 'Har hafta', qiymat: 'weekly' },
  { nom: 'Har oy', qiymat: 'monthly' },
]

const TAKRORLANISH_QISQA: Record<Recurrence, string> = {
  daily: 'Har kuni',
  weekdays: 'Ish kunlari',
  weekly: 'Har hafta',
  monthly: 'Har oy',
}

const PANEL_KENGLIGI = 288 // w-72
const PANEL_BALANDLIGI_TAXMINI = 480
const CHEKKA_BOSHLIG_I = 12

export function SanaTanlagich({
  sana,
  vaqt,
  takrorlanish,
  onSanaChange,
  onVaqtChange,
  onTakrorlanishChange,
}: {
  sana: string | null
  vaqt: string | null
  takrorlanish: Recurrence | null
  onSanaChange: (iso: string | null) => void
  onVaqtChange: (hhmm: string | null) => void
  onTakrorlanishChange: (r: Recurrence | null) => void
}) {
  const [ochiq, setOchiq] = useState(false)
  const [korinishOy, setKorinishOy] = useState(() => (sana ? isoDan(sana) : new Date()))
  const [koord, setKoord] = useState<{ top: number; left: number } | null>(null)
  const tugmaRef = useRef<HTMLButtonElement>(null)

  /** Panelning ekrandagi o'rnini tugma joylashuviga qarab hisoblaydi */
  function joylashuvniHisobla() {
    const rect = tugmaRef.current?.getBoundingClientRect()
    if (!rect) return
    const left = Math.min(
      Math.max(rect.left, CHEKKA_BOSHLIG_I),
      window.innerWidth - PANEL_KENGLIGI - CHEKKA_BOSHLIG_I
    )
    const joyYetmaydi =
      rect.bottom + PANEL_BALANDLIGI_TAXMINI > window.innerHeight
    const top = joyYetmaydi
      ? Math.max(CHEKKA_BOSHLIG_I, rect.top - PANEL_BALANDLIGI_TAXMINI - 8)
      : rect.bottom + 8
    setKoord({ top, left })
  }

  function ochish() {
    setKorinishOy(sana ? isoDan(sana) : new Date())
    joylashuvniHisobla()
    setOchiq(true)
  }

  // Oyna (modal) ichida sudralsa yoki ekran o'lchami o'zgarsa, panel
  // tugma bilan birga qoladi — Oyna'ning o'zi ichida "qotib qolmaydi",
  // chunki panel endi document.body ga portal orqali chiqariladi.
  useEffect(() => {
    if (!ochiq) return
    function qayta() {
      joylashuvniHisobla()
    }
    window.addEventListener('resize', qayta)
    document.addEventListener('scroll', qayta, true)
    return () => {
      window.removeEventListener('resize', qayta)
      document.removeEventListener('scroll', qayta, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ochiq])

  const kunlar = eachDayOfInterval({
    start: startOfWeek(startOfMonth(korinishOy), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(korinishOy), { weekStartsOn: 1 }),
  })

  const tanlanganSana = sana ? isoDan(sana) : null

  return (
    <>
      <button
        ref={tugmaRef}
        type="button"
        onClick={() => (ochiq ? setOchiq(false) : ochish())}
        aria-expanded={ochiq}
        aria-pressed={Boolean(sana)}
        title={takrorlanish ? TAKRORLANISH_QISQA[takrorlanish] : undefined}
        className={`flex min-h-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
          sana
            ? 'border-brand-primary bg-brand-soft text-brand-primary'
            : 'border-border-subtle text-text-strong hover:bg-surface-muted'
        }`}
      >
        <Calendar className="size-4" aria-hidden />
        {sana ? `${toliqSana(sana)}${vaqt ? ` · ${vaqt}` : ''}` : 'Sana tanlash'}
        {takrorlanish && <Repeat2 className="size-3.5" aria-hidden />}
      </button>

      {ochiq &&
        koord &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Yopish"
              onClick={() => setOchiq(false)}
              className="fixed inset-0 z-[90] min-h-0 cursor-default"
            />
            <div
              style={{ top: koord.top, left: koord.left }}
              className="fixed z-[100] max-h-[70vh] w-72 overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-3 shadow-float"
            >
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

              {/* Vaqt: tez tanlash + qo'lda kiritish */}
              {sana && (
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 px-1">
                    <Clock className="size-4 shrink-0 text-text-faint" aria-hidden />
                    {TEZ_VAQTLAR.map((v) => {
                      const tanlangan = vaqt === v
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onVaqtChange(tanlangan ? null : v)}
                          aria-pressed={tanlangan}
                          className={`min-h-0 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            tanlangan
                              ? 'border-brand-primary bg-brand-soft text-brand-primary'
                              : 'border-border-subtle text-text-muted hover:bg-surface-muted'
                          }`}
                        >
                          {v}
                        </button>
                      )
                    })}
                  </div>
                  <div className="flex items-center gap-2 px-1">
                    <input
                      type="time"
                      value={vaqt ?? ''}
                      onChange={(e) => onVaqtChange(e.target.value || null)}
                      aria-label="Boshqa vaqt kiriting"
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
                </div>
              )}

              {/* Takrorlanish */}
              {sana && (
                <div className="mt-3 border-t border-border-subtle pt-3">
                  <div className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-text-faint">
                    <Repeat2 className="size-4" aria-hidden />
                    Takrorlanish
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-1">
                    {TAKRORLANISH_VARIANTLARI.map((t) => {
                      const tanlangan = takrorlanish === t.qiymat
                      return (
                        <button
                          key={t.nom}
                          type="button"
                          onClick={() => onTakrorlanishChange(t.qiymat)}
                          aria-pressed={tanlangan}
                          className={`min-h-0 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            tanlangan
                              ? 'border-brand-primary bg-brand-soft text-brand-primary'
                              : 'border-border-subtle text-text-muted hover:bg-surface-muted'
                          }`}
                        >
                          {t.nom}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Pastki tugmalar */}
              <div className="mt-3 flex items-center justify-between border-t border-border-subtle px-1 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onSanaChange(null)
                    onVaqtChange(null)
                    onTakrorlanishChange(null)
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
          </>,
          document.body
        )}
    </>
  )
}
