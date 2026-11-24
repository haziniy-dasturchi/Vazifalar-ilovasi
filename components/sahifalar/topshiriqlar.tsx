'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, Inbox, LayoutGrid, Send, UserPlus, WifiOff, X } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import {
  useKelganTopshiriqlar,
  useOnlaynmi,
  useTopshiriqTafsilotlari,
  useTopshiriqYangiliklari,
  useYuborilganTopshiriqlar,
} from '@/lib/queries/topshiriqlar'
import { bugunISO } from '@/lib/sana'
import { kechikkanmi } from '@/lib/topshiriq-yordam'
import type { Topshiriq } from '@/types/vazifalar'
import { Bloklanganlar } from '@/components/topshiriq/bloklanganlar'
import {
  HolatKartalari,
  KARTA_FILTRLARI,
  XodimlarHisoboti,
  type KartaFiltri,
} from '@/components/topshiriq/hisobot'
import { korinishHolati } from '@/components/topshiriq/holat'
import { TaklifQabulQiluvchi } from '@/components/topshiriq/jamoa-bolimi'
import { TopshiriqKartasi } from '@/components/topshiriq/karta'
import { TopshiriqFormasi } from '@/components/topshiriq/topshiriq-formasi'
import { UlashishOynasi } from '@/components/topshiriq/ulashish'

/**
 * Qaysi bo'limda turganini eslab qolish (sahifa yangilanganda
 * boshqa bo'limga sakrab ketmasin).
 */
const TAB_KALITI = 'samara-topshiriq-tab'

type Tab = 'yuborilgan' | 'kelgan'

/** Mendan harakat kutayotganlar tepada, yopilganlar pastda */
function navbat(t: Topshiriq, tab: Tab, yangi: boolean): number {
  if (yangi) return 0
  if (tab === 'yuborilgan' && t.holat === 'tekshiruvda') return 0
  if (t.holat === 'bajarildi' || t.holat === 'rad') return 2
  return 1
}

/**
 * Topshiriqlar: men bergan va menga berilgan ishlar.
 *
 * Soddalik — asosiy talab: kartalar katta yozuv bilan, har holat
 * o'z rangida, qabul/rad bosqichi yo'q (topshiriq darhol ijrochiga
 * tushadi), qaror faqat oxirida — natijani qabul qilish yoki rad etish.
 */
export function TopshiriqlarKorinishi() {
  const t = useT()
  const { id: menId } = useFoydalanuvchi()
  const onlayn = useOnlaynmi()
  const [tab, setTabHolat] = useState<Tab>('yuborilgan')
  const [filtr, setFiltr] = useState<KartaFiltri | null>(null)
  const [shaxs, setShaxs] = useState<string | null>(null)
  const [korinish, setKorinish] = useState<'kartalar' | 'xodimlar'>('kartalar')
  const [yangiOchiq, setYangiOchiq] = useState(false)
  const [tahrir, setTahrir] = useState<Topshiriq | null>(null)
  const [taklifOchiq, setTaklifOchiq] = useState(false)

  useEffect(() => {
    try {
      const s = localStorage.getItem(TAB_KALITI)
      if (s === 'kelgan' || s === 'yuborilgan') setTabHolat(s)
    } catch {
      // Maxfiy rejimda localStorage yopiq bo'lishi mumkin
    }
  }, [])

  function setTab(yangi: Tab) {
    setTabHolat(yangi)
    setFiltr(null)
    setShaxs(null)
    setKorinish('kartalar')
    try {
      localStorage.setItem(TAB_KALITI, yangi)
    } catch {
      // eslab qolinmasa ham bo'ladi
    }
  }

  const kelgan = useKelganTopshiriqlar()
  const yuborilgan = useYuborilganTopshiriqlar()
  const { data: tafsilotRoyxati } = useTopshiriqTafsilotlari()
  const { data: yangiliklar } = useTopshiriqYangiliklari()

  // Kesh JSON — Map shu yerda yasaladi (keshda saqlanmaydi)
  const tafsilotlar = useMemo(
    () =>
      new Map(
        (Array.isArray(tafsilotRoyxati) ? tafsilotRoyxati : []).map((x) => [x.topshiriq_id, x])
      ),
    [tafsilotRoyxati]
  )
  const yangilik = useMemo(
    () => new Map((Array.isArray(yangiliklar) ? yangiliklar : []).map((x) => [x.topshiriq_id, x])),
    [yangiliklar]
  )

  const bugun = bugunISO()
  const joriy = tab === 'kelgan' ? kelgan : yuborilgan

  const holatlar = useMemo(() => {
    const m = new Map<string, ReturnType<typeof korinishHolati>>()
    for (const x of joriy.data ?? []) {
      m.set(x.id, korinishHolati(x, tafsilotlar.get(x.id)?.vazifa_holati, kechikkanmi(x, bugun)))
    }
    return m
  }, [joriy.data, tafsilotlar, bugun])

  const shaxsniki = useMemo(
    () => (joriy.data ?? []).filter((x) => !shaxs || x.qabul_qiluvchi_email === shaxs),
    [joriy.data, shaxs]
  )

  const sanoq = useMemo(() => {
    const s = Object.fromEntries(KARTA_FILTRLARI.map((f) => [f, 0])) as Record<KartaFiltri, number>
    for (const x of shaxsniki) {
      const h = holatlar.get(x.id)
      // "Qaytarildi" ham ishdagi topshiriq — "Jarayonda" ga qo'shiladi
      const k = h === 'qaytarildi' ? 'jarayonda' : h
      if (k && k in s) s[k as KartaFiltri] += 1
    }
    return s
  }, [shaxsniki, holatlar])

  const korinadigan = useMemo(
    () =>
      shaxsniki
        .filter((x) => {
          if (!filtr) return true
          const h = holatlar.get(x.id)
          return filtr === 'jarayonda' ? h === 'jarayonda' || h === 'qaytarildi' : h === filtr
        })
        .sort((a, b) => {
          const ya = yangilik.get(a.id)
          const yb = yangilik.get(b.id)
          return (
            navbat(a, tab, Boolean(ya?.yangi_xabarlar || ya?.ochilmagan)) -
            navbat(b, tab, Boolean(yb?.yangi_xabarlar || yb?.ochilmagan))
          )
        }),
    [shaxsniki, filtr, holatlar, yangilik, tab]
  )

  const ismlar = useMemo(() => {
    const m = new Map<string, string>()
    for (const x of yuborilgan.data ?? []) {
      const ism = tafsilotlar.get(x.id)?.qarshi_ism
      if (ism) m.set(x.qabul_qiluvchi_email, ism)
    }
    return m
  }, [yuborilgan.data, tafsilotlar])

  // Bo'lim tugmalaridagi raqam: yangi xabarlar, ochilmaganlar, tekshiruvdagilar
  function belgi(royxat: Topshiriq[] | undefined, tekshiruv: boolean) {
    return (royxat ?? []).reduce((s, x) => {
      const y = yangilik.get(x.id)
      return (
        s +
        (y?.yangi_xabarlar ?? 0) +
        (y?.ochilmagan ? 1 : 0) +
        (tekshiruv && x.holat === 'tekshiruvda' ? 1 : 0)
      )
    }, 0)
  }
  const belgilar: Record<Tab, number> = {
    yuborilgan: belgi(yuborilgan.data, true),
    kelgan: belgi(kelgan.data, false),
  }

  return (
    <Sahifa
      keng
      sarlavha={t('topshiriq.bolimi')}
      harakat={
        <button
          type="button"
          onClick={() => setYangiOchiq(true)}
          className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-base font-semibold text-white shadow-card transition hover:bg-brand-primary-hover"
        >
          <Send className="size-5" aria-hidden />
          <span className="hidden sm:inline">{t('topshiriq.yangi')}</span>
          <span className="sm:hidden">{t('tk.yuborishQisqa')}</span>
        </button>
      }
    >
      {/* Bo'limlar: avval men bergan ishlar */}
      <div role="tablist" className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-surface-sunken p-1.5">
        {(['yuborilgan', 'kelgan'] as const).map((k) => {
          const faol = tab === k
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={faol}
              onClick={() => setTab(k)}
              className={`flex min-h-touch items-center justify-center gap-2 rounded-xl px-3 text-base font-semibold transition ${
                faol ? 'bg-surface text-text-strong shadow-card' : 'text-text-muted hover:text-text-strong'
              }`}
            >
              {k === 'yuborilgan' ? <Send className="size-5" aria-hidden /> : <Inbox className="size-5" aria-hidden />}
              {t(k === 'yuborilgan' ? 'topshiriq.yuborilgan' : 'topshiriq.kelgan')}
              {belgilar[k] > 0 && (
                <span className="min-w-6 rounded-full bg-danger px-1.5 py-0.5 text-center text-sm leading-none font-bold text-white">
                  {belgilar[k] > 99 ? '99+' : belgilar[k]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {!onlayn && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-status-progress px-4 py-3 text-base text-status-progress-text">
          <WifiOff className="size-5 shrink-0" aria-hidden />
          {t('tj.offline')}
        </p>
      )}

      {joriy.isPending ? (
        <Yuklanmoqda qator={3} />
      ) : joriy.isError ? (
        <XatoHolati qayta={() => joriy.refetch()} />
      ) : (joriy.data ?? []).length === 0 ? (
        <div className="rounded-2xl bg-surface p-6 text-center shadow-card">
          <BoshHolat
            ikonka={tab === 'kelgan' ? Inbox : Send}
            sarlavha={t(tab === 'kelgan' ? 'topshiriq.boshKelgan' : 'topshiriq.boshYuborilgan')}
            matn={t(tab === 'kelgan' ? 'tk.boshKelganMatn' : 'tk.boshYuborilganMatn')}
          />
          {tab === 'yuborilgan' && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setYangiOchiq(true)}
                className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
              >
                <Send className="size-5" aria-hidden />
                {t('topshiriq.yangi')}
              </button>
              <button
                type="button"
                onClick={() => setTaklifOchiq(true)}
                className="flex min-h-touch items-center gap-2 rounded-xl border border-border-control px-5 text-base font-semibold text-text-strong transition hover:bg-surface-muted"
              >
                <UserPlus className="size-5" aria-hidden />
                {t('tk.taklifQilish')}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {tab === 'yuborilgan' && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl bg-surface-sunken p-1" role="tablist">
                {(['kartalar', 'xodimlar'] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    role="tab"
                    aria-selected={korinish === k}
                    onClick={() => setKorinish(k)}
                    className={`flex min-h-0 items-center gap-2 rounded-lg px-4 py-2 text-base font-medium transition ${
                      korinish === k ? 'bg-surface text-text-strong shadow-card' : 'text-text-muted hover:text-text-strong'
                    }`}
                  >
                    {k === 'kartalar' ? <LayoutGrid className="size-4" aria-hidden /> : <BarChart3 className="size-4" aria-hidden />}
                    {t(k === 'kartalar' ? 'tk.topshiriqlar' : 'tj.xodimlarBoyicha')}
                  </button>
                ))}
              </div>
              {shaxs && (
                <button
                  type="button"
                  onClick={() => setShaxs(null)}
                  className="flex min-h-0 max-w-full items-center gap-2 rounded-full bg-brand-soft px-4 py-2 text-base font-semibold text-brand-onsoft"
                >
                  <span className="truncate">{ismlar.get(shaxs) ?? shaxs}</span>
                  <X className="size-4 shrink-0" aria-hidden />
                </button>
              )}
            </div>
          )}

          {tab === 'yuborilgan' && korinish === 'xodimlar' ? (
            <XodimlarHisoboti
              royxat={yuborilgan.data ?? []}
              ismlar={ismlar}
              tanla={(email) => {
                setShaxs(email)
                setKorinish('kartalar')
                setFiltr(null)
              }}
            />
          ) : (
            <>
              <HolatKartalari
                sanoq={sanoq}
                faol={filtr ?? ''}
                tanla={(f) => setFiltr(filtr === f ? null : f)}
              />
              {korinadigan.length === 0 ? (
                <p className="rounded-2xl bg-surface px-4 py-10 text-center text-base text-text-muted shadow-card">
                  {t('topshiriq.filtrBosh')}
                </p>
              ) : (
                <ul className="grid gap-4 md:grid-cols-2">
                  {korinadigan.map((x) => {
                    const tf = tafsilotlar.get(x.id)
                    const y = yangilik.get(x.id)
                    return (
                      <TopshiriqKartasi
                        key={x.id}
                        topshiriq={x}
                        menYuborganman={x.yuboruvchi_id === menId}
                        qarshiIsm={tf?.qarshi_ism ?? null}
                        vazifaHolati={tf?.vazifa_holati}
                        foiz={tf?.foiz}
                        kechikkan={kechikkanmi(x, bugun)}
                        yangiXabar={y?.yangi_xabarlar ?? 0}
                        ochilmagan={Boolean(y?.ochilmagan)}
                        onlayn={onlayn}
                        tahrirla={() => setTahrir(x)}
                      />
                    )
                  })}
                </ul>
              )}
            </>
          )}
        </>
      )}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={() => setTaklifOchiq(true)}
          className="flex min-h-touch items-center gap-2 rounded-xl px-4 text-base font-semibold text-brand-onsoft transition hover:bg-brand-soft"
        >
          <UserPlus className="size-5" aria-hidden />
          {t('tk.taklifQilish')}
        </button>
      </div>

      <Bloklanganlar />
      <TaklifQabulQiluvchi />

      {yangiOchiq && <TopshiriqFormasi yop={() => setYangiOchiq(false)} />}
      {tahrir && <TopshiriqFormasi tahrir={tahrir} yop={() => setTahrir(null)} />}
      {taklifOchiq && <UlashishOynasi yop={() => setTaklifOchiq(false)} />}
    </Sahifa>
  )
}
