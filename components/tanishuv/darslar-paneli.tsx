'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Flag,
  FolderPlus,
  GraduationCap,
  Moon,
  Palette,
  Play,
  Plus,
  Repeat2,
  Send,
  BarChart3,
  FolderKanban,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { Oyna } from '@/components/ui/oyna'
import { usePapkalar, usePapkaOchirish, usePapkaYaratish } from '@/lib/queries/papkalar'
import { papkaYoli } from '@/lib/yollar'
import { BOB1, BOB2, DARSLAR, type DarsKaliti, type Maqsad, type TanishuvHolati } from '@/lib/tanishuv'
import type { MatnKaliti } from '@/lib/i18n'
import { Konfetti } from './konfetti'
import { TopshiriqMashqi } from './topshiriq-mashqi'

const DARS_IKONKASI: Record<DarsKaliti, LucideIcon> = {
  bajar: CircleCheck,
  sana: CalendarDays,
  muhim: Flag,
  takror: Repeat2,
  yangi: Plus,
  papka: FolderPlus,
  kechki: Moon,
  boshlash: Play,
  loyiha: FolderKanban,
  topshiriq: Send,
  hisobot: BarChart3,
  sozlama: Palette,
}

/** Maqsadga mos birinchi papka — "O'z papkangni och" darsi uchun */
const MAQSAD_PAPKASI: Record<Maqsad, { icon: string; color: string }> = {
  oqish: { icon: 'oqish', color: '#6366f1' },
  ish: { icon: 'ish', color: '#0ea5e9' },
  uy: { icon: 'uy', color: '#14b8a6' },
  jamoa: { icon: 'oila', color: '#f59e0b' },
  sogliq: { icon: 'sport', color: '#ef4444' },
  shaxsiy: { icon: 'yulduz', color: '#a855f7' },
}

export function DarslarPaneli({
  holat,
  yangiYutuq,
  yutuqniYop,
  hammasiTayyor,
  saqla,
  darsniBelgila,
}: {
  holat: TanishuvHolati
  yangiYutuq: DarsKaliti | null
  yutuqniYop: () => void
  hammasiTayyor: boolean
  saqla: (o: Partial<TanishuvHolati>) => void
  /** Mashq maydoni tugaganda darsni qo'lda belgilash uchun */
  darsniBelgila: (d: DarsKaliti[]) => void
}) {
  const t = useT()
  const router = useRouter()
  const [ochiq, setOchiq] = useState(false)
  const papkaYarat = usePapkaYaratish()
  const papkaOchir = usePapkaOchirish()
  const { data: papkalar } = usePapkalar()
  const [mashqOchiq, setMashqOchiq] = useState(false)
  const joriyRef = useRef<HTMLLIElement>(null)

  // Ro'yxat ochilganda navbatdagi dars ko'rinadigan joyga suriladi
  useEffect(() => {
    if (!ochiq) return
    const kadr = requestAnimationFrame(() =>
      joriyRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
    return () => cancelAnimationFrame(kadr)
  }, [ochiq])

  const bajarilgan = holat.bajarilgan ?? []
  const soni = DARSLAR.filter((d) => bajarilgan.includes(d)).length
  const keyingi = DARSLAR.find((d) => !bajarilgan.includes(d))
  const maqsad = holat.maqsad ?? 'uy'

  // 1-bob shu yutuq bilan tugadimi — maxsus maqtov uchun
  const bob1Tugadi =
    yangiYutuq !== null && BOB1.includes(yangiYutuq) && BOB1.every((d) => bajarilgan.includes(d))

  const bor = (id?: string) => Boolean(id && papkalar?.some((p) => p.id === id))

  const mashqPapkasiga = () => {
    setOchiq(false)
    // Mashq papkasi o'chirilgan bo'lishi mumkin (1-bobni tugatganda)
    router.push(bor(holat.papkaId) ? papkaYoli(holat.papkaId!) : '/bugun')
  }

  const ket = (yol: string) => {
    setOchiq(false)
    router.push(yol)
  }

  const harakat = (d: DarsKaliti) => {
    if (d === 'kechki') ket('/kechki-reja')
    else if (d === 'hisobot') ket('/hisobot')
    else if (d === 'sozlama') ket('/sozlamalar')
    else if (d === 'loyiha') {
      const loyihalar = papkalar?.find((p) => p.is_projects)
      ket(loyihalar ? papkaYoli(loyihalar.id) : '/korish')
    } else if (d === 'topshiriq') {
      // O'yin haqiqiy Topshiriqlar sahifasi ustida ochiladi — odam
      // bo'lim qayerdaligini ham ko'radi
      ket('/topshiriqlar')
      setMashqOchiq(true)
    } else if (d === 'papka') {
      papkaYarat.mutate({
        name: t(`tanishuv.papkaNomi.${maqsad}` as MatnKaliti),
        ...MAQSAD_PAPKASI[maqsad],
      })
    } else {
      mashqPapkasiga()
    }
  }

  // Maqtov 2.8 soniyadan keyin o'zi yo'qoladi
  useEffect(() => {
    if (!yangiYutuq) return
    const taymer = setTimeout(yutuqniYop, 2800)
    return () => clearTimeout(taymer)
  }, [yangiYutuq, yutuqniYop])

  return (
    <>
      {/* Doim ko'rinib turadigan kichik "keyingi qadam" tugmasi */}
      {!hammasiTayyor && (
        <button
          type="button"
          onClick={() => setOchiq(true)}
          className="tanishuv-puls fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-4 z-40 flex max-w-[calc(100%-7rem)] cursor-pointer items-center gap-3 rounded-2xl border border-amber-300/60 bg-surface py-2 pr-4 pl-2 text-left shadow-float transition active:scale-95 md:right-28 md:bottom-8 md:left-auto md:max-w-sm"
        >
          <Halqa soni={soni} jami={DARSLAR.length} />
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-amber-600">
              {t('tanishuv.panel.qadam', { n: Math.min(soni + 1, DARSLAR.length), jami: DARSLAR.length })}
            </span>
            {keyingi && (
              <span className="block truncate text-sm font-semibold text-text-strong">
                {t(`tanishuv.dars.${keyingi}.s` as MatnKaliti)}
              </span>
            )}
          </span>
        </button>
      )}

      {ochiq && (
        <Oyna
          sarlavha={t('tanishuv.panel.sarlavha')}
          tavsif={t('tanishuv.panel.tavsif')}
          yop={() => setOchiq(false)}
        >
          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${(soni / DARSLAR.length) * 100}%` }}
            />
          </div>
          <ol className="space-y-2">
            {DARSLAR.map((d, i) => {
              const tayyor = bajarilgan.includes(d)
              const joriy = d === keyingi
              const Ikonka = DARS_IKONKASI[d]
              const bobBoshi = i === 0 ? 1 : i === BOB1.length ? 2 : null
              const bob = bobBoshi === 1 ? BOB1 : BOB2
              return (
                <Fragment key={d}>
                {bobBoshi && (
                  <li className={`flex items-center justify-between px-1 ${bobBoshi === 2 ? 'pt-3' : ''}`}>
                    <span className="text-xs font-bold tracking-wide text-amber-600 uppercase">
                      {t(`tanishuv.bob${bobBoshi}` as MatnKaliti)}
                    </span>
                    <span className="text-xs font-semibold text-text-faint">
                      {bob.filter((x) => bajarilgan.includes(x)).length}/{bob.length}
                    </span>
                  </li>
                )}
                <li
                  ref={joriy ? joriyRef : undefined}
                  className={`flex items-start gap-3 rounded-2xl p-3 transition ${
                    joriy ? 'bg-amber-400/10 ring-2 ring-amber-300' : 'bg-surface-muted'
                  }`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      tayyor ? 'bg-brand-primary text-white' : 'bg-surface text-text-muted'
                    }`}
                  >
                    {tayyor ? <Check className="size-5" strokeWidth={3} aria-hidden /> : <Ikonka className="size-5" aria-hidden />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`block font-semibold ${tayyor ? 'text-text-faint line-through' : 'text-text-strong'}`}
                    >
                      {i + 1}. {t(`tanishuv.dars.${d}.s` as MatnKaliti)}
                    </span>
                    {!tayyor && (
                      <span className="mt-0.5 block text-sm leading-relaxed text-text-muted">
                        {t(`tanishuv.dars.${d}.m` as MatnKaliti, {
                          misol: t(`tanishuv.misolMaqsad.${maqsad}` as MatnKaliti),
                          papka: t(`tanishuv.papkaNomi.${maqsad}` as MatnKaliti),
                        })}
                      </span>
                    )}
                    {/* 2-bob darslari bir-biriga bog'liq emas — istalganidan boshlasa bo'ladi */}
                    {!tayyor && (joriy || BOB2.includes(d)) && (
                      <button
                        type="button"
                        onClick={() => harakat(d)}
                        disabled={papkaYarat.isPending}
                        className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active:scale-95 disabled:opacity-60"
                      >
                        {d === 'papka'
                          ? t('tanishuv.panel.papkaOch', {
                              papka: t(`tanishuv.papkaNomi.${maqsad}` as MatnKaliti),
                            })
                          : d === 'topshiriq'
                            ? t('tanishuv.panel.mashqBoshla')
                            : t('tanishuv.panel.korsat')}
                        <ChevronRight className="size-4" aria-hidden />
                      </button>
                    )}
                  </span>
                </li>
                </Fragment>
              )
            })}
          </ol>
          <button
            type="button"
            onClick={() => {
              setOchiq(false)
              saqla({ yopilgan: true })
            }}
            className="mt-5 w-full cursor-pointer rounded-xl py-2.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
          >
            {t('tanishuv.panel.yashirish')}
          </button>
        </Oyna>
      )}

      {mashqOchiq && (
        <TopshiriqMashqi
          yop={() => setMashqOchiq(false)}
          tugadi={() => darsniBelgila(['topshiriq'])}
          // "Tushunarli" — keyingi darsga: ro'yxat o'sha darsda ochiladi
          davom={() => {
            setMashqOchiq(false)
            setOchiq(true)
          }}
        />
      )}

      {/* Har bir dars uchun maqtov */}
      {yangiYutuq && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-[55] flex justify-center px-4"
        >
          <div className="tanishuv-pop pointer-events-auto relative flex items-center gap-3 rounded-2xl bg-brand-primary px-5 py-3.5 text-white shadow-float">
            <Konfetti />
            <span className="text-3xl" aria-hidden>
              🎉
            </span>
            <span>
              <span className="block text-lg font-bold">
                {bob1Tugadi ? t('tanishuv.bob1Tugadi') : t(`tanishuv.maqtov.${soni % 4}` as MatnKaliti)}
              </span>
              <span className="block text-sm text-white/85">
                {t('tanishuv.yutuq', {
                  dars: t(`tanishuv.dars.${yangiYutuq}.s` as MatnKaliti),
                  n: soni,
                  jami: DARSLAR.length,
                })}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Yakuniy tabrik */}
      {hammasiTayyor && !yangiYutuq && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-ink/50 p-6 backdrop-blur-sm">
          <div className="tanishuv-pop relative w-full max-w-sm rounded-3xl bg-surface p-7 text-center shadow-float">
            <Konfetti kop />
            <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-amber-400/15">
              <Trophy className="size-10 text-amber-500" aria-hidden />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-text-strong">{t('tanishuv.tabrik.s')}</h2>
            <p className="mt-2 leading-relaxed text-text-muted">{t('tanishuv.tabrik.m')}</p>
            <button
              type="button"
              onClick={() => {
                if (holat.papkaId) papkaOchir.mutate(holat.papkaId)
                saqla({ tugadi: true, tugadiSoni: DARSLAR.length })
                router.push('/bugun')
              }}
              className="mt-6 w-full cursor-pointer rounded-2xl bg-brand-primary py-3.5 font-semibold text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
            >
              {t('tanishuv.tabrik.ochir')}
            </button>
            <button
              type="button"
              onClick={() => saqla({ tugadi: true, tugadiSoni: DARSLAR.length })}
              className="mt-2 w-full cursor-pointer rounded-2xl py-3 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
            >
              {t('tanishuv.tabrik.qoldir')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/** Kichik doira-ko'rsatkich: nechta dars bajarilgani */
function Halqa({ soni, jami }: { soni: number; jami: number }) {
  const r = 16
  const aylana = 2 * Math.PI * r
  return (
    <span className="relative flex size-11 shrink-0 items-center justify-center">
      <svg viewBox="0 0 40 40" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="4" className="stroke-surface-sunken" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          stroke="#f59e0b"
          strokeDasharray={aylana}
          strokeDashoffset={aylana * (1 - soni / jami)}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <GraduationCap className="size-5 text-amber-500" aria-hidden />
    </span>
  )
}
