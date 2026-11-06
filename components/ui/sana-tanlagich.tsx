'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  nextMonday,
  nextSaturday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import {
  ArrowRight,
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Repeat2,
  Sun,
  Sunrise,
  X,
} from 'lucide-react'
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

/** Kompyuterdagi tushuvchi panel kengligi (telefonda pastki varaq) */
const PANEL_KENGLIGI = 340
const CHEKKA_BOSHLIG_I = 12
/** Shu kenglikdan boshlab kompyuter ko'rinishi (Tailwind `sm`) */
const KATTA_EKRAN = '(min-width: 640px)'

/** Tugmaning ekrandagi o'rni — panel o'zini shunga qarab joylaydi */
type TugmaJoyi = { top: number; bottom: number; left: number }

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
  const [vaqtOchiq, setVaqtOchiq] = useState(false)
  const [takrorOchiq, setTakrorOchiq] = useState(false)
  const [korinishOy, setKorinishOy] = useState(() => (sana ? isoDan(sana) : new Date()))
  const [tugmaJoyi, setTugmaJoyi] = useState<TugmaJoyi | null>(null)
  const tugmaRef = useRef<HTMLButtonElement>(null)

  /**
   * Faqat tugmaning o'rnini saqlaymiz. Panelning o'zi qayerga
   * joylashishni o'zi hal qiladi — chunki buning uchun uning haqiqiy
   * balandligini bilish kerak, taxmin qilish emas.
   */
  function joylashuvniHisobla() {
    const r = tugmaRef.current?.getBoundingClientRect()
    if (!r) return
    setTugmaJoyi({ top: r.top, bottom: r.bottom, left: r.left })
  }

  function ochish() {
    setKorinishOy(sana ? isoDan(sana) : new Date())
    setVaqtOchiq(false)
    setTakrorOchiq(false)
    joylashuvniHisobla()
    setOchiq(true)
  }

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
        tugmaJoyi &&
        createPortal(
          <SanaPaneli
            tugmaJoyi={tugmaJoyi}
            sana={sana}
            vaqt={vaqt}
            takrorlanish={takrorlanish}
            korinishOy={korinishOy}
            kunlar={kunlar}
            tanlanganSana={tanlanganSana}
            vaqtOchiq={vaqtOchiq}
            takrorOchiq={takrorOchiq}
            onSanaChange={onSanaChange}
            onVaqtChange={onVaqtChange}
            onTakrorlanishChange={onTakrorlanishChange}
            setKorinishOy={setKorinishOy}
            setVaqtOchiq={setVaqtOchiq}
            setTakrorOchiq={setTakrorOchiq}
            yopish={() => setOchiq(false)}
          />,
          document.body
        )}
    </>
  )
}

// =============================================================
// Panel — portal orqali chiqadi, Oyna'ning overflow/scroll
// konteyneridan butunlay tashqarida qoladi
// =============================================================
function SanaPaneli({
  tugmaJoyi,
  sana,
  vaqt,
  takrorlanish,
  korinishOy,
  kunlar,
  tanlanganSana,
  vaqtOchiq,
  takrorOchiq,
  onSanaChange,
  onVaqtChange,
  onTakrorlanishChange,
  setKorinishOy,
  setVaqtOchiq,
  setTakrorOchiq,
  yopish,
}: {
  tugmaJoyi: TugmaJoyi
  sana: string | null
  vaqt: string | null
  takrorlanish: Recurrence | null
  korinishOy: Date
  kunlar: Date[]
  tanlanganSana: Date | null
  vaqtOchiq: boolean
  takrorOchiq: boolean
  onSanaChange: (iso: string | null) => void
  onVaqtChange: (hhmm: string | null) => void
  onTakrorlanishChange: (r: Recurrence | null) => void
  setKorinishOy: React.Dispatch<React.SetStateAction<Date>>
  setVaqtOchiq: (v: boolean) => void
  setTakrorOchiq: (v: boolean) => void
  yopish: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [kattaEkran, setKattaEkran] = useState(true)
  const [uslub, setUslub] = useState<React.CSSProperties>({
    top: -9999,
    left: -9999,
  })

  useEffect(() => {
    const mq = window.matchMedia(KATTA_EKRAN)
    const yangila = () => setKattaEkran(mq.matches)
    yangila()
    mq.addEventListener('change', yangila)
    return () => mq.removeEventListener('change', yangila)
  }, [])

  // Haqiqiy balandlikni o'lchab joylashtiramiz — taxminiy balandlik
  // bilan panel ba'zan ekrandan chiqib yoki oynani yopib qolardi.
  useLayoutEffect(() => {
    if (!kattaEkran) return
    const balandlik = panelRef.current?.offsetHeight ?? 0
    const left = Math.min(
      Math.max(tugmaJoyi.left, CHEKKA_BOSHLIG_I),
      Math.max(
        CHEKKA_BOSHLIG_I,
        window.innerWidth - PANEL_KENGLIGI - CHEKKA_BOSHLIG_I
      )
    )
    const pastda = tugmaJoyi.bottom + 8
    const sigadi = pastda + balandlik + CHEKKA_BOSHLIG_I <= window.innerHeight
    const top = sigadi
      ? pastda
      : Math.max(CHEKKA_BOSHLIG_I, window.innerHeight - balandlik - CHEKKA_BOSHLIG_I)
    setUslub({ top, left })
  }, [kattaEkran, tugmaJoyi])

  const bugun = new Date()

  const TEZ_QATORLAR = [
    { nom: 'Bugun', ikonka: Sun, rang: '#f59e0b', sana: bugun },
    { nom: 'Ertaga', ikonka: Sunrise, rang: '#f97316', sana: addDaysSafe(bugun, 1) },
    { nom: 'Keyingi hafta', ikonka: ArrowRight, rang: '#8b5cf6', sana: nextMonday(bugun) },
    { nom: 'Dam olish', ikonka: Coffee, rang: '#2563eb', sana: nextSaturday(bugun) },
  ]

  return (
    <>
      <button
        type="button"
        aria-label="Yopish"
        onClick={yopish}
        className="fixed inset-0 z-[90] min-h-0 cursor-default"
      />
      <div
        ref={panelRef}
        style={kattaEkran ? uslub : undefined}
        className={
          kattaEkran
            ? 'fixed z-[100] max-h-[88vh] w-[21.25rem] overflow-y-auto rounded-2xl border border-border-subtle bg-surface p-2 shadow-float'
            : // Telefonda — Todoist'dagi kabi pastdan chiqadigan varaq.
              // Oldin bu yerda ham qat'iy kenglikdagi panel edi va u
              // tor ekranda chap chetdan chiqib ketardi.
              'fixed inset-x-0 bottom-0 z-[100] max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-border-subtle bg-surface p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-float'
        }
      >
        {/* Telefonda sudrash chizig'i — varaqligini bildiradi */}
        {!kattaEkran && (
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-surface-sunken" />
        )}
        {/* Tezkor sana qatorlari — ikki ustunda, shunda panel past
            bo'ladi va skroll qilish kerak bo'lmaydi */}
        <div className="grid grid-cols-2 gap-1 border-b border-border-subtle pb-2">
          {TEZ_QATORLAR.map((q) => {
            const iso = isoGa(q.sana)
            return (
              <button
                key={q.nom}
                type="button"
                onClick={() => onSanaChange(iso)}
                className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-surface-muted"
              >
                <q.ikonka className="size-4 shrink-0" style={{ color: q.rang }} aria-hidden />
                <span className="flex-1 font-medium text-text-strong">{q.nom}</span>
                <span className="text-xs text-text-faint">{toliqSana(iso)}</span>
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => {
              onSanaChange(null)
              onVaqtChange(null)
              onTakrorlanishChange(null)
            }}
            className="col-span-2 flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-surface-muted"
          >
            <Ban className="size-4 shrink-0 text-text-faint" aria-hidden />
            <span className="flex-1 font-medium text-text-strong">Sanasiz</span>
          </button>
        </div>

        {/* Oy navigatsiyasi */}
        <div className="mt-2 mb-2 flex items-center justify-between px-1">
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
            <span key={k} className="py-1 text-center text-xs font-medium text-text-faint">
              {k}
            </span>
          ))}
        </div>

        {/* Kunlar panjarasi */}
        <div className="grid grid-cols-7 gap-1 px-1 pb-2">
          {kunlar.map((kun) => {
            const shuOyda = isSameMonth(kun, korinishOy)
            const tanlangan = tanlanganSana && isSameDay(kun, tanlanganSana)
            const bugunmi = isToday(kun)
            return (
              <button
                key={kun.toISOString()}
                type="button"
                onClick={() => onSanaChange(isoGa(kun))}
                className={`flex size-9 min-h-0 items-center justify-center rounded-full text-sm transition ${
                  tanlangan
                    ? 'bg-brand-primary font-semibold text-white'
                    : bugunmi
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

        {/* Vaqt — Todoist'dagi kabi alohida, bosilganda ochiladigan qator */}
        {sana && (
          <div className="border-t border-border-subtle py-1">
            <button
              type="button"
              onClick={() => setVaqtOchiq(!vaqtOchiq)}
              className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-surface-muted"
            >
              <Clock className="size-4 shrink-0 text-text-faint" aria-hidden />
              <span className="flex-1 font-medium text-text-strong">
                {vaqt ?? 'Vaqt qo‘shish'}
              </span>
              {vaqt && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onVaqtChange(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      e.preventDefault()
                      onVaqtChange(null)
                    }
                  }}
                  aria-label="Vaqtni olib tashlash"
                  className="flex size-7 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-sunken hover:text-text-strong"
                >
                  <X className="size-3.5" aria-hidden />
                </span>
              )}
            </button>

            {vaqtOchiq && (
              <div className="px-2 pb-1">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {TEZ_VAQTLAR.map((v) => {
                    const tanlangan = vaqt === v
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => onVaqtChange(v)}
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
                <input
                  type="time"
                  value={vaqt ?? ''}
                  onChange={(e) => onVaqtChange(e.target.value || null)}
                  aria-label="Boshqa vaqt kiriting"
                  className="min-h-0 w-full rounded-lg border border-border-subtle px-2 py-1.5 text-sm text-text-strong outline-none focus:border-brand-primary"
                />
              </div>
            )}
          </div>
        )}

        {/* Takrorlanish — sana tanlanmagan bo'lsa ham doim ko'rinadi.
            Todoist'dagi kabi: takrorlanish tanlansa va sana bo'lmasa,
            boshlanish sanasi avtomatik bugundan qo'yiladi. */}
        {(
          <div className="border-t border-border-subtle py-1">
            <button
              type="button"
              onClick={() => setTakrorOchiq(!takrorOchiq)}
              className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-surface-muted"
            >
              <Repeat2 className="size-4 shrink-0 text-text-faint" aria-hidden />
              <span className="flex-1 font-medium text-text-strong">
                {takrorlanish ? TAKRORLANISH_QISQA[takrorlanish] : 'Takrorlanish'}
              </span>
              {takrorlanish && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onTakrorlanishChange(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                      e.preventDefault()
                      onTakrorlanishChange(null)
                    }
                  }}
                  aria-label="Takrorlanishni olib tashlash"
                  className="flex size-7 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-sunken hover:text-text-strong"
                >
                  <X className="size-3.5" aria-hidden />
                </span>
              )}
            </button>

            {takrorOchiq && (
              <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                {TAKRORLANISH_VARIANTLARI.filter((t) => t.qiymat !== null).map((t) => {
                  const tanlangan = takrorlanish === t.qiymat
                  return (
                    <button
                      key={t.nom}
                      type="button"
                      onClick={() => {
                        // Takrorlanish boshlanish sanasisiz ma'nosiz —
                        // sana tanlanmagan bo'lsa bugundan boshlaymiz
                        if (t.qiymat && !sana) onSanaChange(isoGa(new Date()))
                        onTakrorlanishChange(t.qiymat)
                      }}
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
            )}
          </div>
        )}

        {/* Tayyor */}
        <div className="flex justify-end border-t border-border-subtle pt-2">
          <button
            type="button"
            onClick={yopish}
            className="min-h-0 rounded-lg bg-brand-primary px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            Tayyor
          </button>
        </div>
      </div>
    </>
  )
}

function addDaysSafe(d: Date, kun: number): Date {
  const yangi = new Date(d)
  yangi.setDate(yangi.getDate() + kun)
  return yangi
}
