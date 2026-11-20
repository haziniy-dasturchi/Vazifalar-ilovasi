'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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
import { useT } from '@/components/app/til-provayder'
import {
  HAR_HAFTA,
  HAR_KUNI,
  HAR_OY,
  ISH_KUNLARI,
  kunlardanRrule,
  rruleKunlari,
  soddalashtir,
  takrorMatni,
} from '@/lib/takrorlanish'
import { TakrorlanishOynasi } from '@/components/ui/takrorlanish-oynasi'
import type { MatnKaliti } from '@/lib/i18n'

/** Dushanbadan boshlab hafta kunlari qisqartmasi (kalendar sarlavhasi uchun) */
const HAFTA_KUNLARI: MatnKaliti[] = [
  'kun.1.qisqa', 'kun.2.qisqa', 'kun.3.qisqa', 'kun.4.qisqa',
  'kun.5.qisqa', 'kun.6.qisqa', 'kun.7.qisqa',
]

/** Tez tanlash uchun eng ko'p ishlatiladigan vaqtlar */
const TEZ_VAQTLAR = ['09:00', '12:00', '15:00', '18:00', '21:00']

/**
 * Tayyor variantlar. Qiymatlar — RRULE matnlari, ya'ni "Boshqa…"
 * oynasida yig'ilgan murakkab qoida bilan BITTA modelda saqlanadi.
 */
const TAKRORLANISH_VARIANTLARI: { kalit: MatnKaliti; qiymat: string }[] = [
  { kalit: 'sana.harKuni', qiymat: HAR_KUNI },
  { kalit: 'sana.ishKunlari', qiymat: ISH_KUNLARI },
  { kalit: 'sana.harHafta', qiymat: HAR_HAFTA },
  { kalit: 'sana.harOy', qiymat: HAR_OY },
]

/** ISO tartibi: 1 dushanba ... 7 yakshanba */
const KUN_RAQAMLARI = [1, 2, 3, 4, 5, 6, 7] as const

/** Kompyuterdagi tushuvchi panel kengligi (telefonda pastki varaq) */
const PANEL_KENGLIGI = 340
/** Ekran chetidan qoldiriladigan eng kam bo'shliq */
const CHEKKA = 12
/** Tugma bilan panel orasidagi masofa */
const ORALIQ = 8
/** Shu kenglikdan boshlab kompyuter ko'rinishi (Tailwind `sm`) */
const KATTA_EKRAN = '(min-width: 640px)'

/** Tugmaning ekrandagi o'rni — panel o'zini shunga qarab joylaydi */
type TugmaJoyi = { top: number; bottom: number; left: number }

export function SanaTanlagich({
  sana,
  vaqt,
  takrorlanish,
  bajarilgandan = false,
  onSanaChange,
  onVaqtChange,
  onTakrorlanishChange,
  onBajarilgandanChange,
}: {
  sana: string | null
  vaqt: string | null
  /** RFC 5545 RRULE matni, DTSTART'siz */
  takrorlanish: string | null
  /** Keyingi sana bajarilgan kundan hisoblansinmi */
  bajarilgandan?: boolean
  onSanaChange: (iso: string | null) => void
  onVaqtChange: (hhmm: string | null) => void
  onTakrorlanishChange: (r: string | null) => void
  onBajarilgandanChange?: (q: boolean) => void
}) {
  const t = useT()
  const [ochiq, setOchiq] = useState(false)
  // "Boshqa…" oynasi. Sana paneli portalda z-[100] da turadi,
  // oyna esa z-50 — shuning uchun oyna ochilishidan oldin panel
  // yopiladi, aks holda oyna panel ostida qolib ketardi.
  const [boshqaOchiq, setBoshqaOchiq] = useState(false)
  const [vaqtOchiq, setVaqtOchiq] = useState(false)
  const [takrorOchiq, setTakrorOchiq] = useState(false)
  const [korinishOy, setKorinishOy] = useState(() =>
    sana ? isoDan(sana) : new Date()
  )
  const [tugmaJoyi, setTugmaJoyi] = useState<TugmaJoyi | null>(null)
  const tugmaRef = useRef<HTMLButtonElement>(null)

  /**
   * Faqat tugmaning o'rnini saqlaymiz. Panelning o'zi qayerga
   * joylashishni o'zi hal qiladi — chunki buning uchun uning haqiqiy
   * balandligini bilish kerak, taxmin qilish emas.
   */
  const joylashuvniHisobla = useCallback(() => {
    const r = tugmaRef.current?.getBoundingClientRect()
    if (!r) return
    setTugmaJoyi({ top: r.top, bottom: r.bottom, left: r.left })
  }, [])

  function ochish() {
    setKorinishOy(sana ? isoDan(sana) : new Date())
    setVaqtOchiq(false)
    setTakrorOchiq(false)
    joylashuvniHisobla()
    setOchiq(true)
  }

  useEffect(() => {
    if (!ochiq) return
    window.addEventListener('resize', joylashuvniHisobla)
    document.addEventListener('scroll', joylashuvniHisobla, true)
    return () => {
      window.removeEventListener('resize', joylashuvniHisobla)
      document.removeEventListener('scroll', joylashuvniHisobla, true)
    }
  }, [ochiq, joylashuvniHisobla])

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
        title={takrorlanish ? takrorMatni(takrorlanish, t) : undefined}
        className={`flex min-h-0 items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
          sana
            ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
            : 'border-border-subtle text-text-strong hover:bg-surface-muted'
        }`}
      >
        <Calendar className="size-4" aria-hidden />
        {sana
          ? `${toliqSana(sana)}${vaqt ? ` · ${vaqt}` : ''}`
          : t('sana.tanlash')}
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
            boshqaniOch={() => {
              setOchiq(false)
              setBoshqaOchiq(true)
            }}
            yopish={() => setOchiq(false)}
          />,
          document.body
        )}

      {boshqaOchiq && (
        <TakrorlanishOynasi
          rrule={takrorlanish}
          bajarilgandan={bajarilgandan}
          sana={sana}
          yop={() => setBoshqaOchiq(false)}
          onSaqla={(qoida, bajarilgandanYangi) => {
            // Takrorlanish boshlanish sanasisiz ma'nosiz
            if (!sana) onSanaChange(isoGa(new Date()))
            onTakrorlanishChange(qoida)
            onBajarilgandanChange?.(bajarilgandanYangi)
            setBoshqaOchiq(false)
          }}
        />
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
  boshqaniOch,
  yopish,
}: {
  tugmaJoyi: TugmaJoyi
  sana: string | null
  vaqt: string | null
  takrorlanish: string | null
  korinishOy: Date
  kunlar: Date[]
  tanlanganSana: Date | null
  vaqtOchiq: boolean
  takrorOchiq: boolean
  onSanaChange: (iso: string | null) => void
  onVaqtChange: (hhmm: string | null) => void
  onTakrorlanishChange: (r: string | null) => void
  setKorinishOy: React.Dispatch<React.SetStateAction<Date>>
  setVaqtOchiq: (v: boolean) => void
  setTakrorOchiq: (v: boolean) => void
  boshqaniOch: () => void
  yopish: () => void
}) {
  const t = useT()
  const ichkiRef = useRef<HTMLDivElement>(null)
  const futerRef = useRef<HTMLDivElement>(null)
  const [kattaEkran, setKattaEkran] = useState(true)
  const [uslub, setUslub] = useState<React.CSSProperties | null>(null)

  useEffect(() => {
    const mq = window.matchMedia(KATTA_EKRAN)
    const yangila = () => setKattaEkran(mq.matches)
    yangila()
    mq.addEventListener('change', yangila)
    return () => mq.removeEventListener('change', yangila)
  }, [])

  /**
   * Panelni joylashtirish.
   *
   * Muammo (mijoz aytgan): kompyuterda panel ekranga sig'may qolardi va
   * pastdagi "Tayyor" tugmasiga yetib bo'lmasdi.
   *
   * Yechim ikki qismdan iborat:
   *  1. Shu yerda — panel QAYERGA tushishi va BALANDLIGI qancha
   *     bo'lishi hisoblanadi. Tugmaning pasti ham, tepasi ham
   *     o'lchanadi; kontent qaysi biriga butun sig'sa, o'sha
   *     tanlanadi. Hech qayerga sig'masa — kengroq tomon olinib,
   *     balandlik aynan bo'sh joyga tenglashtiriladi, ya'ni panel
   *     hech qachon ekrandan chiqib ketmaydi.
   *  2. Razmetkada — "Tayyor" qatori suriladigan qismdan TASHQARIDA
   *     turadi, shuning uchun balandlik qirqilganda ham u ko'rinib
   *     qoladi.
   */
  const joylashtir = useCallback(() => {
    if (!kattaEkran) return
    const ichki = ichkiRef.current
    const futer = futerRef.current
    if (!ichki || !futer) return

    // `scrollHeight` — kontentning cheklanmagan, tabiiy balandligi
    const kerak = ichki.scrollHeight + futer.offsetHeight + 2

    const pastdaJoy = window.innerHeight - tugmaJoyi.bottom - ORALIQ - CHEKKA
    const tepadaJoy = tugmaJoyi.top - ORALIQ - CHEKKA

    let top: number
    let maxHeight: number

    if (kerak <= pastdaJoy) {
      top = tugmaJoyi.bottom + ORALIQ
      maxHeight = pastdaJoy
    } else if (kerak <= tepadaJoy) {
      top = tugmaJoyi.top - ORALIQ - kerak
      maxHeight = tepadaJoy
    } else if (pastdaJoy >= tepadaJoy) {
      top = tugmaJoyi.bottom + ORALIQ
      maxHeight = pastdaJoy
    } else {
      top = CHEKKA
      maxHeight = tepadaJoy
    }

    const left = Math.min(
      Math.max(tugmaJoyi.left, CHEKKA),
      Math.max(CHEKKA, window.innerWidth - PANEL_KENGLIGI - CHEKKA)
    )

    setUslub({ top, left, maxHeight })
  }, [kattaEkran, tugmaJoyi])

  useLayoutEffect(() => {
    joylashtir()
  }, [joylashtir])

  /**
   * Vaqt yoki takrorlanish bo'limi ochilib-yopilganda panel kontenti
   * o'sadi. Oldin joylashuv faqat ochilish paytida hisoblanardi va
   * shuning uchun panel kengayganda ekran tagiga kirib ketardi.
   */
  useEffect(() => {
    if (!kattaEkran) return
    const ichki = ichkiRef.current
    if (!ichki || typeof ResizeObserver === 'undefined') return
    const kuzatuvchi = new ResizeObserver(() => joylashtir())
    kuzatuvchi.observe(ichki)
    return () => kuzatuvchi.disconnect()
  }, [kattaEkran, joylashtir])

  const tanlanganKunlar = rruleKunlari(takrorlanish)

  /**
   * Kunni belgilash/olib tashlash.
   *
   * `soddalashtir` natijani tozalaydi: hamma kun belgilansa "Har
   * kuni", du-ju belgilansa "Ish kunlari" bo'ladi. Aks holda bir xil
   * jadval ikki xil nom bilan ko'rinardi.
   */
  function kunniAlmashtir(kun: number) {
    const yangi = tanlanganKunlar.includes(kun)
      ? tanlanganKunlar.filter((k) => k !== kun)
      : [...tanlanganKunlar, kun]

    const qiymat = soddalashtir(kunlardanRrule(yangi))
    // Takrorlanish boshlanish sanasisiz ma'nosiz
    if (qiymat && !sana) onSanaChange(isoGa(new Date()))
    onTakrorlanishChange(qiymat)
  }

  const bugun = new Date()

  const TEZ_QATORLAR = [
    { nom: t('sana.bugun'), ikonka: Sun, rang: '#f59e0b', sana: bugun },
    {
      nom: t('sana.ertaga'),
      ikonka: Sunrise,
      rang: '#f97316',
      sana: kunQoshish(bugun, 1),
    },
    {
      nom: t('sana.keyingiHafta'),
      ikonka: ArrowRight,
      rang: '#8b5cf6',
      sana: nextMonday(bugun),
    },
    {
      nom: t('sana.damOlish'),
      ikonka: Coffee,
      rang: '#2563eb',
      sana: nextSaturday(bugun),
    },
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
        style={
          kattaEkran
            ? // O'lchanmaguncha ko'rinmaydi — aks holda noto'g'ri joyda
              // bir lahza "sakrab" chiqardi
              (uslub ?? { top: 0, left: 0, visibility: 'hidden' })
            : undefined
        }
        className={
          kattaEkran
            ? 'fixed z-[100] flex w-[21.25rem] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-float'
            : // Telefonda — Todoist'dagi kabi pastdan chiqadigan varaq.
              // `dvh` ishlatiladi: brauzer paneli yig'ilib-ochilganda
              // `vh` noto'g'ri balandlik beradi.
              'fixed inset-x-0 bottom-0 z-[100] flex max-h-[85dvh] flex-col overflow-hidden rounded-t-3xl border-t border-border-subtle bg-surface shadow-float'
        }
      >
        {/* ---------- Suriladigan qism ---------- */}
        <div
          ref={ichkiRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2"
        >
          {/* Telefonda sudrash chizig'i — varaqligini bildiradi */}
          {!kattaEkran && (
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-surface-sunken" />
          )}

          {/*
            Tezkor sana qatorlari BITTA ustunda.
            Oldin ikki ustun edi va "Keyingi hafta" nomi yonidagi sana
            bilan bir qatorga sig'may, ikkiga bo'linib ketardi (mijoz
            aynan shuni aytgan). Bitta ustunda panel biroz uzunroq,
            lekin matn hech qachon buzilmaydi — balandlik esa endi
            muammo emas, chunki "Tayyor" surilmaydigan joyda turadi.
          */}
          <div className="border-b border-border-subtle pb-2">
            {TEZ_QATORLAR.map((q) => {
              const iso = isoGa(q.sana)
              return (
                <button
                  key={q.nom}
                  type="button"
                  onClick={() => onSanaChange(iso)}
                  className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-surface-muted"
                >
                  <q.ikonka
                    className="size-4 shrink-0"
                    style={{ color: q.rang }}
                    aria-hidden
                  />
                  <span className="flex-1 truncate font-medium text-text-strong">
                    {q.nom}
                  </span>
                  <span className="shrink-0 text-xs text-text-faint">
                    {toliqSana(iso)}
                  </span>
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
              className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition hover:bg-surface-muted"
            >
              <Ban className="size-4 shrink-0 text-text-faint" aria-hidden />
              <span className="flex-1 font-medium text-text-strong">
                {t('sana.sanasiz')}
              </span>
            </button>
          </div>

          {/* Oy navigatsiyasi */}
          <div className="mt-2 mb-1 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setKorinishOy((d) => subMonths(d, 1))}
              aria-label={t('sana.oldingiOy')}
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
              aria-label={t('sana.keyingiOy')}
              className="flex size-8 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          </div>

          {/* Hafta kunlari sarlavhasi */}
          <div className="grid grid-cols-7 gap-1 px-1">
            {HAFTA_KUNLARI.map((kalit) => (
              <span
                key={kalit}
                className="py-1 text-center text-xs font-medium text-text-faint"
              >
                {t(kalit)}
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
                        ? 'border border-brand-onsoft text-brand-onsoft'
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
                aria-expanded={vaqtOchiq}
                className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-surface-muted"
              >
                <Clock className="size-4 shrink-0 text-text-faint" aria-hidden />
                <span className="flex-1 font-medium text-text-strong">
                  {vaqt ?? t('sana.vaqtQoshish')}
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
                    aria-label={t('sana.vaqtniOlib')}
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
                              ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
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
                    aria-label={t('sana.boshqaVaqt')}
                    className="min-h-0 w-full rounded-lg border border-border-control bg-surface px-2 py-1.5 text-sm text-text-strong outline-none focus:border-brand-onsoft"
                  />
                </div>
              )}
            </div>
          )}

          {/* Takrorlanish — sana tanlanmagan bo'lsa ham doim ko'rinadi.
              Todoist'dagi kabi: takrorlanish tanlansa va sana bo'lmasa,
              boshlanish sanasi avtomatik bugundan qo'yiladi. */}
          <div className="border-t border-border-subtle py-1">
            <button
              type="button"
              onClick={() => setTakrorOchiq(!takrorOchiq)}
              aria-expanded={takrorOchiq}
              className="flex min-h-0 w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-surface-muted"
            >
              <Repeat2 className="size-4 shrink-0 text-text-faint" aria-hidden />
              <span className="flex-1 font-medium text-text-strong">
                {takrorlanish ? takrorMatni(takrorlanish, t) : t('sana.takrorlanish')}
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
                  aria-label={t('sana.takrorniOlib')}
                  className="flex size-7 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-sunken hover:text-text-strong"
                >
                  <X className="size-3.5" aria-hidden />
                </span>
              )}
            </button>

            {takrorOchiq && (
              <div className="px-2 pb-1">
                <div className="flex flex-wrap gap-1.5">
                  {TAKRORLANISH_VARIANTLARI.map((v) => {
                    const tanlangan = takrorlanish === v.qiymat
                    return (
                      <button
                        key={v.qiymat}
                        type="button"
                        onClick={() => {
                          // Takrorlanish boshlanish sanasisiz ma'nosiz —
                          // sana tanlanmagan bo'lsa bugundan boshlaymiz
                          if (!sana) onSanaChange(isoGa(new Date()))
                          onTakrorlanishChange(v.qiymat)
                        }}
                        aria-pressed={tanlangan}
                        className={`min-h-0 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          tanlangan
                            ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
                            : 'border-border-subtle text-text-muted hover:bg-surface-muted'
                        }`}
                      >
                        {t(v.kalit)}
                      </button>
                    )
                  })}

                  {/*
                    "Boshqa…" — tayyor to'rtta variant yetmaganda.
                    Oyna ochilishidan oldin shu panel yopiladi.
                  */}
                  <button
                    type="button"
                    onClick={boshqaniOch}
                    className="min-h-0 rounded-full border border-dashed border-border-control px-2.5 py-1 text-xs font-medium text-text-strong transition hover:bg-surface-muted"
                  >
                    {t('takror.boshqa')}
                  </button>
                </div>

                {/*
                  O'z jadvalini yig'ish: kerakli kunlarni bosib
                  belgilanadi ("har se, chor, pay").

                  Nega alohida oyna emas: mijoz "sodda ko'rinishda"
                  so'ragan, va bu yerda bor-yo'g'i yetti tugma kerak —
                  ularni shu panelning o'ziga sig'dirish mumkin, ya'ni
                  qo'shimcha modal ochib-yopish shart emas.
                */}
                <p className="mt-3 mb-1.5 text-xs font-medium text-text-muted">
                  {t('sana.kunlarniTanlang')}
                </p>
                <div className="flex flex-wrap gap-1">
                  {KUN_RAQAMLARI.map((kun) => {
                    const belgilangan = tanlanganKunlar.includes(kun)
                    return (
                      <button
                        key={kun}
                        type="button"
                        onClick={() => kunniAlmashtir(kun)}
                        aria-pressed={belgilangan}
                        aria-label={t(`kun.${kun}.toliq` as MatnKaliti)}
                        className={`min-h-0 min-w-9 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                          belgilangan
                            ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
                            : 'border-border-subtle text-text-muted hover:bg-surface-muted'
                        }`}
                      >
                        {t(`kun.${kun}.qisqa` as MatnKaliti)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- Doim ko'rinadigan pastki qator ----------
            Suriladigan qismdan tashqarida: panel balandligi qanchaga
            qirqilmasin, "Tayyor" joyida qoladi. */}
        <div
          ref={futerRef}
          className="flex shrink-0 justify-end border-t border-border-subtle bg-surface px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:pb-2"
        >
          <button
            type="button"
            onClick={yopish}
            className="min-h-0 w-full rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover sm:w-auto"
          >
            Tayyor
          </button>
        </div>
      </div>
    </>
  )
}

function kunQoshish(d: Date, kun: number): Date {
  const yangi = new Date(d)
  yangi.setDate(yangi.getDate() + kun)
  return yangi
}
