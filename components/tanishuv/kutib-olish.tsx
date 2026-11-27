'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Bell,
  Briefcase,
  Check,
  Dumbbell,
  GraduationCap,
  House,
  Plus,
  Sparkles,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { useOrqagaYopish } from '@/lib/orqaga'
import type { MatnKaliti } from '@/lib/i18n'
import { MANBALAR, type Maqsad, type Manba } from '@/lib/tanishuv'

/**
 * Kutib olish: 3 ta jonli ekran + 2 ta qisqa savol.
 *
 * Qoidalar (bola ham tushunishi uchun):
 *   - bitta ekranda bitta fikr, sarlavha 5 so'zdan oshmaydi;
 *   - imkoniyat emas, FOYDA aytiladi ("ilova o'zi eslatadi");
 *   - rasm o'rniga jonli namoyish — odam ko'radi, o'qimaydi;
 *   - har doim chiqish yo'li bor ("O'tkazib yuborish").
 *
 * Savollar:
 *   - "Nima uchun ishlatasiz?" — BIR NECHTASINI tanlash mumkin: odam
 *     ilovani ham ish, ham uy uchun ishlatishi tabiiy. Bittaga
 *     majburlash uni noto'g'ri javob berishga undardi;
 *   - "Qayerdan eshitdingiz?" — marketing uchun, bitta javob.
 *
 * Animatsiya video emas, CSS: yengil, offline ishlaydi, uch tilda
 * va ikkala mavzuda ham to'g'ri ko'rinadi.
 */

const EKRANLAR: { sarlavha: MatnKaliti; matn: MatnKaliti; Namoyish: () => React.ReactNode }[] = [
  { sarlavha: 'tanishuv.ekran1.s', matn: 'tanishuv.ekran1.m', Namoyish: YozishNamoyishi },
  { sarlavha: 'tanishuv.ekran2.s', matn: 'tanishuv.ekran2.m', Namoyish: BelgilashNamoyishi },
  { sarlavha: 'tanishuv.ekran3.s', matn: 'tanishuv.ekran3.m', Namoyish: EslatmaNamoyishi },
]

const MAQSAD_VARIANTLARI: { kalit: Maqsad; ikonka: LucideIcon; rang: string }[] = [
  { kalit: 'oqish', ikonka: GraduationCap, rang: '#6366f1' },
  { kalit: 'ish', ikonka: Briefcase, rang: '#0ea5e9' },
  { kalit: 'uy', ikonka: House, rang: '#14b8a6' },
  { kalit: 'jamoa', ikonka: Users, rang: '#f59e0b' },
  { kalit: 'sogliq', ikonka: Dumbbell, rang: '#ef4444' },
  { kalit: 'shaxsiy', ikonka: Sparkles, rang: '#a855f7' },
]

const MANBA_BELGISI: Record<Manba, string> = {
  telegram: '✈️',
  instagram: '📸',
  dost: '🤝',
  google: '🔍',
  market: '📲',
  youtube: '▶️',
  boshqa: '✨',
}

export type KutibOlishNatijasi = { maqsadlar: Maqsad[]; manba: Manba | null }

export function KutibOlish({
  tugat,
}: {
  /** `null` — "O'tkazib yuborish" bosildi */
  tugat: (natija: KutibOlishNatijasi | null) => void
}) {
  const t = useT()
  const [qadam, setQadam] = useState(0)
  const [maqsadlar, setMaqsadlar] = useState<Maqsad[]>([])
  const [manba, setManba] = useState<Manba | null>(null)

  const MAQSAD_QADAMI = EKRANLAR.length
  const MANBA_QADAMI = EKRANLAR.length + 1
  const jami = EKRANLAR.length + 2

  // Android "orqaga" tugmasi: oldingi ekranga, birinchisida — hech narsa
  useOrqagaYopish(qadam > 0, () => setQadam((q) => Math.max(0, q - 1)))

  // Fon sahifa aylanmasin
  useEffect(() => {
    const eski = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = eski
    }
  }, [])

  // Tanlanish tartibi saqlanadi — birinchisi asosiy hisoblanadi
  const almashtir = (m: Maqsad) =>
    setMaqsadlar((eski) => (eski.includes(m) ? eski.filter((x) => x !== m) : [...eski, m]))

  const ekran = EKRANLAR[qadam]

  const tugmaFaol =
    qadam === MAQSAD_QADAMI ? maqsadlar.length > 0 : qadam === MANBA_QADAMI ? manba !== null : true
  const tugmaMatni: MatnKaliti =
    qadam === 0 ? 'tanishuv.boshladik' : qadam === MANBA_QADAMI ? 'tanishuv.boshlash' : 'tanishuv.keyingi'
  const tugmaBosildi = () => {
    if (qadam === MANBA_QADAMI) tugat({ maqsadlar, manba })
    else setQadam((q) => q + 1)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('tanishuv.sarlavha')}
      className="fixed inset-0 z-[60] flex flex-col bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-between px-5 pt-4">
        <Nuqtalar soni={jami} joriy={qadam} />
        {qadam < MAQSAD_QADAMI && (
          <button
            type="button"
            onClick={() => tugat(null)}
            className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
          >
            {t('tanishuv.otkazish')}
          </button>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center overflow-y-auto px-6 py-4">
        {ekran && (
          <div key={qadam} className="tanishuv-pop flex flex-col items-center text-center">
            <div className="mb-8 flex h-64 w-full items-center justify-center">
              <ekran.Namoyish />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-text-strong">
              {t(ekran.sarlavha)}
            </h2>
            <p className="mt-3 text-lg leading-relaxed text-text-muted">{t(ekran.matn)}</p>
          </div>
        )}

        {qadam === MAQSAD_QADAMI && (
          <div key="maqsad" className="tanishuv-pop text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-strong">
              {t('tanishuv.maqsad.s')}
            </h2>
            <p className="mt-2 text-base text-text-muted">{t('tanishuv.maqsad.m')}</p>
            <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label={t('tanishuv.maqsad.s')}>
              {MAQSAD_VARIANTLARI.map(({ kalit, ikonka: Ikonka, rang }) => {
                const tanlangan = maqsadlar.includes(kalit)
                return (
                  <button
                    key={kalit}
                    type="button"
                    aria-pressed={tanlangan}
                    onClick={() => almashtir(kalit)}
                    className={`relative flex cursor-pointer flex-col items-center gap-2 rounded-3xl border-2 p-4 transition active:scale-95 ${
                      tanlangan
                        ? 'border-brand-primary bg-brand-soft'
                        : 'border-border-subtle bg-surface hover:border-brand-primary/50'
                    }`}
                  >
                    {tanlangan && (
                      <span className="tanishuv-pop absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-brand-primary text-white">
                        <Check className="size-4" strokeWidth={3} aria-hidden />
                      </span>
                    )}
                    <span
                      className="flex size-12 items-center justify-center rounded-2xl"
                      style={{ background: `${rang}22` }}
                    >
                      <Ikonka className="size-6" style={{ color: rang }} aria-hidden />
                    </span>
                    <span className="text-sm font-semibold text-text-strong">
                      {t(`tanishuv.maqsad.${kalit}` as MatnKaliti)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {qadam === MANBA_QADAMI && (
          <div key="manba" className="tanishuv-pop text-center">
            <h2 className="text-3xl font-bold tracking-tight text-text-strong">
              {t('tanishuv.manba.s')}
            </h2>
            <p className="mt-2 text-base text-text-muted">{t('tanishuv.manba.m')}</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5" role="radiogroup" aria-label={t('tanishuv.manba.s')}>
              {MANBALAR.map((m) => {
                const tanlangan = manba === m
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={tanlangan}
                    onClick={() => setManba(m)}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3 py-3 text-left transition active:scale-95 ${
                      m === 'boshqa' ? 'col-span-2 justify-center' : ''
                    } ${
                      tanlangan
                        ? 'border-brand-primary bg-brand-soft'
                        : 'border-border-subtle bg-surface hover:border-brand-primary/50'
                    }`}
                  >
                    <span className="text-xl" aria-hidden>
                      {MANBA_BELGISI[m]}
                    </span>
                    <span className="text-sm font-semibold text-text-strong">
                      {t(`tanishuv.manba.${m}` as MatnKaliti)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md px-6 pb-6">
        {qadam === MAQSAD_QADAMI && (
          <p className="mb-2 text-center text-sm text-text-faint" aria-live="polite">
            {maqsadlar.length > 0
              ? t('tanishuv.maqsad.tanlandi', { n: maqsadlar.length })
              : t('tanishuv.maqsad.izoh')}
          </p>
        )}
        <button
          type="button"
          onClick={tugmaBosildi}
          disabled={!tugmaFaol}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4 text-lg font-semibold text-white shadow-float transition hover:bg-brand-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {t(tugmaMatni)}
          <ArrowRight className="size-5" aria-hidden />
        </button>
      </div>
    </div>
  )
}

function Nuqtalar({ soni, joriy }: { soni: number; joriy: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: soni }, (_, i) => (
        <span
          key={i}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === joriy ? 'w-6 bg-brand-primary' : i < joriy ? 'w-2 bg-brand-primary/50' : 'w-2 bg-border-control'
          }`}
        />
      ))}
    </div>
  )
}

// -------------------------------------------------------------
// Jonli namoyishlar — kichik "telefon ekrani"
// -------------------------------------------------------------

function Ekrancha({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-64 overflow-hidden rounded-[2rem] border-4 border-border-control bg-surface-muted p-4 shadow-float">
      {children}
    </div>
  )
}

/** 1-ekran: vazifalar birin-ketin yozilib tushadi */
function YozishNamoyishi() {
  const t = useT()
  const qatorlar: MatnKaliti[] = ['tanishuv.misol1', 'tanishuv.misol2', 'tanishuv.misol3']
  return (
    <Ekrancha>
      <div className="space-y-2.5">
        {qatorlar.map((k, i) => (
          <div
            key={k}
            className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5 shadow-card"
            style={{ animation: `tanishuv-qator 6s ease-out ${i * 0.7}s infinite both` }}
          >
            <span className="size-5 shrink-0 rounded-full border-2 border-border-control" />
            <span className="relative block overflow-hidden whitespace-nowrap text-left text-sm font-medium text-text-strong">
              <span
                className="block overflow-hidden"
                style={{ animation: `tanishuv-yozish 6s steps(18) ${i * 0.7}s infinite both` }}
              >
                {t(k)}
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <span
          className="flex size-11 items-center justify-center rounded-full bg-brand-primary text-white"
          style={{ animation: 'tanishuv-tugma 1.6s ease-in-out infinite' }}
        >
          <Plus className="size-6" aria-hidden />
        </span>
      </div>
    </Ekrancha>
  )
}

const UCHQUNLAR = [
  { x: '-46px', y: '-34px', rang: '#f59e0b' },
  { x: '40px', y: '-40px', rang: '#10b981' },
  { x: '-30px', y: '30px', rang: '#ec4899' },
  { x: '52px', y: '18px', rang: '#6366f1' },
  { x: '0px', y: '-52px', rang: '#ef4444' },
  { x: '-56px', y: '4px', rang: '#0ea5e9' },
]

/** 2-ekran: doirachani bosish → belgi, chiziq, uchqunlar va "+1" */
function BelgilashNamoyishi() {
  const t = useT()
  const davr = '4s ease-in-out infinite both'
  return (
    <Ekrancha>
      <div className="relative flex items-center gap-3 rounded-xl bg-surface px-3 py-4 shadow-card">
        <span className="relative">
          <span
            className="flex size-7 items-center justify-center rounded-full border-2 border-border-control"
            style={{ animation: `tanishuv-doira ${davr}` }}
          >
            <Check
              className="size-4 text-white"
              strokeWidth={3}
              style={{ animation: `tanishuv-belgi ${davr}` }}
              aria-hidden
            />
          </span>
          {UCHQUNLAR.map((u, i) => (
            <span
              key={i}
              className="absolute top-1/2 left-1/2 size-2 rounded-full"
              style={
                {
                  background: u.rang,
                  '--x': u.x,
                  '--y': u.y,
                  animation: `tanishuv-uchqun ${davr}`,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
        <span className="relative text-left text-base font-medium text-text-strong">
          {t('tanishuv.misol1')}
          <span
            className="absolute top-1/2 left-0 h-0.5 bg-text-faint"
            style={{ animation: `tanishuv-chiziq ${davr}` }}
          />
        </span>
        <span
          className="absolute -top-2 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-amber-950"
          style={{ animation: `tanishuv-ball ${davr}` }}
        >
          +1 🎉
        </span>
      </div>
      <div className="mt-3 space-y-2 opacity-60">
        <div className="h-9 rounded-xl bg-surface" />
        <div className="h-9 rounded-xl bg-surface" />
      </div>
    </Ekrancha>
  )
}

/** 3-ekran: qo'ng'iroq chalinadi, tepadan bildirishnoma tushadi */
function EslatmaNamoyishi() {
  const t = useT()
  const davr = '4s ease-in-out infinite both'
  return (
    <Ekrancha>
      <div
        className="mb-4 flex items-center gap-3 rounded-2xl bg-surface p-3 text-left shadow-raised"
        style={{ animation: `tanishuv-xabar ${davr}` }}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white">
          <Bell className="size-5" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-text-faint">Samara · 18:00</span>
          <span className="block truncate text-sm font-semibold text-text-strong">
            {t('tanishuv.misol3')}
          </span>
        </span>
      </div>
      <div className="flex flex-col items-center py-2">
        <span
          className="flex size-20 items-center justify-center rounded-full bg-brand-soft"
          style={{ animation: `tanishuv-qongiroq ${davr}`, transformOrigin: '50% 10%' }}
        >
          <Bell className="size-10 text-brand-onsoft" aria-hidden />
        </span>
        <span className="mt-3 flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-sm font-semibold text-text-strong shadow-card">
          <span className="relative inline-block size-4 rounded-full border-2 border-text-muted">
            <span
              className="absolute top-0.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 origin-bottom rounded bg-text-muted"
              style={{ animation: 'tanishuv-soat 4s linear infinite', transformOrigin: '50% 100%' }}
            />
          </span>
          18:00
        </span>
      </div>
    </Ekrancha>
  )
}
