'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Check,
  CheckCheck,
  Clock,
  Inbox,
  RotateCcw,
  Send,
  Share2,
  ThumbsDown,
  Trash2,
  X,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { Oyna } from '@/components/ui/oyna'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useT } from '@/components/app/til-provayder'
import { useUzoqBosish } from '@/lib/uzoq-bosish'
import { Ban, ShieldCheck } from 'lucide-react'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import {
  useKelganTopshiriqlar,
  useRuxsatOzgartirish,
  useTopshiriqBekor,
  useTopshiriqKontaktlari,
  useTopshiriqQabul,
  useTopshiriqQaytarish,
  useTopshiriqRad,
  useTopshiriqTasdiqlash,
  useTopshiriqTopshirish,
  useTopshiriqlarniOchirish,
  useTopshiriqRuxsatlari,
  useTopshiriqTafsilotlari,
  useTopshiriqYuborish,
  useYozsaBoladimi,
  useYuborilganTopshiriqlar,
  type TopshiriqTafsiloti,
} from '@/lib/queries/topshiriqlar'
import { bugunISO, kunOraligi, toliqSana, vaqtMatni } from '@/lib/sana'
import { DOMEN } from '@/lib/huquqiy'
import type { MatnKaliti } from '@/lib/i18n'
import type { TaskPriority, Topshiriq, TopshiriqHolati } from '@/types/vazifalar'

/** Email shakli — bazadagi CHECK bilan bir xil mantiq */
const EMAIL_SHAKLI = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const HOLAT_KALITI: Record<TopshiriqHolati, MatnKaliti> = {
  kutilmoqda: 'topshiriq.holat.kutilmoqda',
  qabul: 'topshiriq.holat.qabul',
  tekshiruvda: 'topshiriq.holat.tekshiruvda',
  rad: 'topshiriq.holat.rad',
  bajarildi: 'topshiriq.holat.bajarildi',
}

const HOLAT_RANGI: Record<TopshiriqHolati, string> = {
  kutilmoqda: 'var(--text-muted)',
  qabul: 'var(--status-progress-line)',
  tekshiruvda: '#8b5cf6',
  rad: 'var(--danger)',
  bajarildi: 'var(--brand-accent)',
}

/**
 * Ro'yxat filtrlari. "Kechikkan" holat emas, balki ochiq
 * (javob kutilayotgan yoki ishdagi) topshiriqning muddati o'tgani —
 * rahbar uchun eng kerakli savol aynan shu.
 */
const FILTRLAR = [
  'hammasi',
  'kutilmoqda',
  'qabul',
  'tekshiruvda',
  'kechikkan',
  'bajarildi',
  'rad',
] as const
type Filtr = (typeof FILTRLAR)[number]

const FILTR_KALITI: Record<Filtr, MatnKaliti> = {
  hammasi: 'topshiriq.filtr.hammasi',
  kutilmoqda: 'topshiriq.filtr.kutilmoqda',
  qabul: 'topshiriq.filtr.qabul',
  tekshiruvda: 'topshiriq.filtr.tekshiruvda',
  kechikkan: 'topshiriq.filtr.kechikkan',
  bajarildi: 'topshiriq.filtr.bajarildi',
  rad: 'topshiriq.filtr.rad',
}

function kechikkanmi(t: Topshiriq, bugun: string): boolean {
  if (!t.muddat) return false
  if (t.holat !== 'kutilmoqda' && t.holat !== 'qabul') return false
  if (t.muddat < bugun) return true
  if (t.muddat > bugun || !t.muddat_vaqt) return false
  const hozir = new Date()
  const [soat, daqiqa] = t.muddat_vaqt.split(':').map(Number)
  return hozir.getHours() * 60 + hozir.getMinutes() > soat * 60 + daqiqa
}

function filtrgaMos(t: Topshiriq, f: Filtr, bugun: string): boolean {
  if (f === 'hammasi') return true
  if (f === 'kechikkan') return kechikkanmi(t, bugun)
  return t.holat === f
}

/**
 * Mendan harakat kutayotganlar tepada: kelganda — javob berilmagan,
 * yuborganda — tekshiruvdagi. Qolgani o'z tartibida (yangisi tepada).
 */
function navbat(t: Topshiriq, tab: TopshiriqTab): number {
  if (tab === 'kelgan') return t.holat === 'kutilmoqda' ? 0 : 1
  return t.holat === 'tekshiruvda' ? 0 : 1
}

/**
 * Qaysi bo'limda turganini eslab qolish uchun.
 *
 * Muammo: "Men yuborgan" bo'limida turib sahifa yangilansa, ilova
 * "Menga kelgan" ga qaytib ketardi -- odam har safar qaytadan
 * bosishga majbur edi.
 *
 * localStorage tanlandi: manzilga yozish (`?bolim=`) uchun sahifani
 * Suspense ga o'rash kerak bo'lardi, foyda esa bir xil.
 */
const TAB_KALITI = 'samara-topshiriq-tab'

type TopshiriqTab = 'kelgan' | 'yuborilgan'

export function TopshiriqlarKorinishi() {
  const t = useT()
  const { korsat } = useToast()
  const [tab, setTabHolat] = useState<TopshiriqTab>('kelgan')

  // Serverda localStorage yo'q, shuning uchun o'qish chizilgandan
  // keyin bo'ladi (aks holda hidratsiya nomuvofiqligi chiqardi)
  useEffect(() => {
    const saqlangan = localStorage.getItem(TAB_KALITI)
    if (saqlangan === 'yuborilgan' || saqlangan === 'kelgan') {
      setTabHolat(saqlangan)
    }
  }, [])

  function setTab(yangi: TopshiriqTab) {
    setTabHolat(yangi)
    setTanlangan(new Set())
    setFiltr('hammasi')
    try {
      localStorage.setItem(TAB_KALITI, yangi)
    } catch {
      // Maxfiy rejimda localStorage yopiq bo'lishi mumkin —
      // bunda shunchaki eslab qolinmaydi
    }
  }
  const [yuborishOchiq, setYuborishOchiq] = useState(false)

  const kelgan = useKelganTopshiriqlar()
  const yuborilgan = useYuborilganTopshiriqlar()
  // Qarshi tomon ismi va ish jarayoni — bitta so'rovda, ikkala
  // bo'lim uchun. Migratsiya qo'llanmagan bo'lsa bo'sh qaytadi
  // va kartalar avvalgidek ko'rinadi.
  const { data: tafsilotRoyxati } = useTopshiriqTafsilotlari()
  // Xarita AYNAN shu yerda yasaladi: kesh JSON bo'lgani uchun
  // `Map` ni so'rov natijasida saqlab bo'lmaydi (izohga qarang)
  const tafsilotlar = useMemo(
    () =>
      new Map(
        // `Array.isArray` ataylab: saqlangan keshda eski, noto'g'ri
        // shakldagi qiymat yotgan bo'lishi mumkin. Unda ham sahifa
        // qulamasligi kerak -- bo'sh ro'yxat bilan ishlayveradi.
        (Array.isArray(tafsilotRoyxati) ? tafsilotRoyxati : []).map((x) => [
          x.topshiriq_id,
          x,
        ])
      ),
    [tafsilotRoyxati]
  )

  /*
    Belgilab, bittada o'chirish.

    Tanlov bo'lim almashganda tozalanadi: "Menga kelgan" da
    belgilab qo'yib, "Men yuborgan" ga o'tib o'chirish tugmasini
    bosish — kutilmagan natija bo'lardi.
  */
  const [tanlangan, setTanlangan] = useState<Set<string>>(new Set())
  const [ochirishOchiq, setOchirishOchiq] = useState(false)
  const ochirish = useTopshiriqlarniOchirish()

  function tanlovniAlmashtir(id: string) {
    setTanlangan((eski) => {
      const yangi = new Set(eski)
      if (yangi.has(id)) yangi.delete(id)
      else yangi.add(id)
      return yangi
    })
  }

  const kutilayotgan =
    kelgan.data?.filter((x) => x.holat === 'kutilmoqda').length ?? 0
  const tekshiruvdagi =
    yuborilgan.data?.filter((x) => x.holat === 'tekshiruvda').length ?? 0

  const [filtr, setFiltr] = useState<Filtr>('hammasi')
  const bugun = bugunISO()
  const joriy = tab === 'kelgan' ? kelgan : yuborilgan
  const hammasi = useMemo(
    () =>
      [...(joriy.data ?? [])].sort((a, b) => navbat(a, tab) - navbat(b, tab)),
    [joriy.data, tab]
  )
  const sanoq = useMemo(() => {
    const s = {} as Record<Filtr, number>
    for (const f of FILTRLAR) {
      s[f] = hammasi.filter((x) => filtrgaMos(x, f, bugun)).length
    }
    return s
  }, [hammasi, bugun])
  const korinadigan = hammasi.filter((x) => filtrgaMos(x, filtr, bugun))

  return (
    <Sahifa
      sarlavha={t('topshiriq.bolimi')}
      harakat={
        <button
          type="button"
          onClick={() => setYuborishOchiq(true)}
          className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <Send className="size-4" aria-hidden />
          {t('topshiriq.yangi')}
        </button>
      }
    >
      <div
        role="tablist"
        className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1"
      >
        {(['kelgan', 'yuborilgan'] as const).map((k) => {
          const tanlangan = tab === k
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tanlangan}
              onClick={() => setTab(k)}
              className={`flex min-h-0 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                tanlangan
                  ? 'bg-surface text-text-strong shadow-card'
                  : 'text-text-muted hover:text-text-strong'
              }`}
            >
              {t(k === 'kelgan' ? 'topshiriq.kelgan' : 'topshiriq.yuborilgan')}
              {(k === 'kelgan' ? kutilayotgan : tekshiruvdagi) > 0 && (
                <span className="rounded-full bg-brand-primary px-2 py-0.5 text-xs font-semibold text-white">
                  {k === 'kelgan' ? kutilayotgan : tekshiruvdagi}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/*
        Tanlov paneli faqat biror narsa belgilanganda chiqadi —
        bo'sh turganda joy egallab, ro'yxatni pastga surib
        yuborishi shart emas.
      */}
      {tanlangan.size > 0 && (
        <div className="sticky top-0 z-20 mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border-subtle bg-surface px-3 py-2 shadow-card">
          <span className="flex-1 text-sm font-medium text-text-strong">
            {t('topshiriq.tanlandi', { son: tanlangan.size })}
          </span>
          <button
            type="button"
            onClick={() => setTanlangan(new Set())}
            className="min-h-0 rounded-lg px-3 py-1.5 text-sm text-text-muted transition hover:bg-surface-muted"
          >
            {t('umumiy.bekor')}
          </button>
          <button
            type="button"
            onClick={() => setOchirishOchiq(true)}
            className="flex min-h-0 items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Trash2 className="size-4" aria-hidden />
            {t('umumiy.ochirish')}
          </button>
        </div>
      )}

      {ochirishOchiq && (
        <Tasdiq
          sarlavha={t('umumiy.ochirish')}
          matn={t('topshiriq.ochirishTasdiq', { son: tanlangan.size })}
          tasdiqla={async () => {
            try {
              await ochirish.mutateAsync([...tanlangan])
              korsat({
                matn: t('topshiriq.ochirildi', { son: tanlangan.size }),
                tone: 'muvaffaqiyat',
              })
              setTanlangan(new Set())
              setOchirishOchiq(false)
            } catch {
              korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
            }
          }}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}

      {/*
        Telefonda katakcha yo'q, shuning uchun tanlashni qanday
        boshlashni aytib qo'yamiz. Kompyuterda katakcha ko'rinib
        turibdi — u yerda bu maslahat ortiqcha (`sm:hidden`).
      */}
      {tanlangan.size === 0 && (
        <p className="mb-2 px-1 text-xs text-text-faint sm:hidden">
          {t('topshiriq.bosibTuring')}
        </p>
      )}

      {joriy.isPending ? (
        <Yuklanmoqda qator={2} />
      ) : joriy.isError ? (
        <XatoHolati qayta={() => joriy.refetch()} />
      ) : hammasi.length === 0 ? (
        tab === 'kelgan' ? (
          <BoshHolat
            ikonka={Inbox}
            sarlavha={t('topshiriq.boshKelgan')}
            matn={t('topshiriq.boshKelganMatn')}
          />
        ) : (
          <BoshHolat
            ikonka={Send}
            sarlavha={t('topshiriq.boshYuborilgan')}
            matn={t('topshiriq.boshYuborilganMatn')}
          />
        )
      ) : (
        <>
          {/*
            Holat filtrlari, sonlari bilan. Bo'shlari yashiriladi —
            "Rad etilgan 0" kabi tugmalar faqat joy egallaydi.
            Telefonda yonga suriladi, qatorga sig'masa ham buzilmaydi.
          */}
          <div className="-mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {FILTRLAR.filter(
              (f) => f === 'hammasi' || f === filtr || sanoq[f] > 0
            ).map((f) => {
              const faol = filtr === f
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={faol}
                  onClick={() => setFiltr(f)}
                  className={`flex min-h-0 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    faol
                      ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
                      : f === 'kechikkan'
                        ? 'border-border-subtle text-danger hover:bg-danger-soft'
                        : 'border-border-subtle text-text-muted hover:bg-surface-muted hover:text-text-strong'
                  }`}
                >
                  {t(FILTR_KALITI[f])}
                  <span className="tabular-nums opacity-70">{sanoq[f]}</span>
                </button>
              )
            })}
          </div>

          {korinadigan.length === 0 ? (
            <p className="rounded-2xl bg-surface px-4 py-8 text-center text-sm text-text-muted shadow-card">
              {t('topshiriq.filtrBosh')}
            </p>
          ) : (
            <ul className="space-y-3">
              {korinadigan.map((x) =>
                tab === 'kelgan' ? (
                  <KelganKarta
                    key={x.id}
                    topshiriq={x}
                    tafsilot={tafsilotlar.get(x.id)}
                    kechikkan={kechikkanmi(x, bugun)}
                    tanlanganmi={tanlangan.has(x.id)}
                    tanlashRejimi={tanlangan.size > 0}
                    tanlovniAlmashtir={() => tanlovniAlmashtir(x.id)}
                  />
                ) : (
                  <YuborilganKarta
                    key={x.id}
                    topshiriq={x}
                    tafsilot={tafsilotlar.get(x.id)}
                    kechikkan={kechikkanmi(x, bugun)}
                    tanlanganmi={tanlangan.has(x.id)}
                    tanlashRejimi={tanlangan.size > 0}
                    tanlovniAlmashtir={() => tanlovniAlmashtir(x.id)}
                  />
                )
              )}
            </ul>
          )}
        </>
      )}

      {/*
        Bloklanganlar ro'yxati sahifaning eng pastida: kundalik
        ishga xalaqit bermaydi, lekin kimnidir noto'g'ri bloklab
        qo'yilgan bo'lsa, uni topish oson.
      */}
      <Bloklanganlar />

      {yuborishOchiq && (
        <YuborishOynasi yop={() => setYuborishOchiq(false)} />
      )}
    </Sahifa>
  )
}

function HolatBelgisi({ holat }: { holat: TopshiriqHolati }) {
  const t = useT()
  return (
    <span
      className="shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{
        color: HOLAT_RANGI[holat],
        backgroundColor: 'var(--surface-muted)',
      }}
    >
      {t(HOLAT_KALITI[holat])}
    </span>
  )
}

// =============================================================
// Menga kelgan topshiriq
// =============================================================
function KelganKarta({
  topshiriq,
  tafsilot,
  kechikkan,
  tanlanganmi,
  tanlashRejimi,
  tanlovniAlmashtir,
}: {
  topshiriq: Topshiriq
  tafsilot?: TopshiriqTafsiloti
  kechikkan: boolean
  tanlanganmi: boolean
  tanlashRejimi: boolean
  tanlovniAlmashtir: () => void
}) {
  const t = useT()
  const uzoqBosish = useUzoqBosish(tanlovniAlmashtir)
  const { korsat } = useToast()
  const qabul = useTopshiriqQabul()
  const rad = useTopshiriqRad()
  const topshirish = useTopshiriqTopshirish()
  const ruxsat = useRuxsatOzgartirish()
  const [radOchiq, setRadOchiq] = useState(false)
  const [blokOchiq, setBlokOchiq] = useState(false)
  const [topshirishOchiq, setTopshirishOchiq] = useState(false)
  const [sabab, setSabab] = useState('')
  const [natija, setNatija] = useState('')

  const javobBerilmagan = topshiriq.holat === 'kutilmoqda'

  async function topshir() {
    try {
      await topshirish.mutateAsync({ id: topshiriq.id, izoh: natija })
      setTopshirishOchiq(false)
      setNatija('')
      korsat({
        matn: topshiriq.tekshirish
          ? t('topshiriq.topshirildi')
          : t('topshiriq.bajarildiXabar'),
        tone: 'muvaffaqiyat',
      })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  async function qabulQil() {
    try {
      await qabul.mutateAsync(topshiriq.id)
      korsat({ matn: t('topshiriq.qabulQilindi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  async function radEt() {
    try {
      await rad.mutateAsync({ id: topshiriq.id, sabab })
      setRadOchiq(false)
      setSabab('')
      korsat({ matn: t('topshiriq.radEtildi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <li
      {...uzoqBosish}
      onClick={tanlashRejimi ? tanlovniAlmashtir : undefined}
      className={`rounded-2xl p-4 shadow-card transition select-none sm:select-text ${
        // Tanlangani FONI bilan ajralib turadi. Faqat halqa
        // (ring) yetarli emasdi: telefonda ingichka chiziq
        // ko'zga tashlanmay, qaysi biri belgilangani bilinmasdi.
        tanlanganmi
          ? 'bg-brand-soft ring-2 ring-brand-onsoft'
          : 'bg-surface'
      } ${tanlashRejimi ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <TanlashKatagi
          tanlanganmi={tanlanganmi}
          tanlashRejimi={tanlashRejimi}
          almashtir={tanlovniAlmashtir}
          nom={topshiriq.sarlavha}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">{topshiriq.sarlavha}</p>
          {/* Kim so'rayapti — mendan ish talab qilinmoqda, kimligini
              bilishim shart. Ism bo'lmasa email ko'rsatiladi. */}
          <p className="mt-0.5 truncate text-sm text-text-muted">
            {t('topshiriq.kimdan', { kim: tafsilot?.qarshi_ism ?? '…' })}
          </p>
        </div>
        <HolatBelgisi holat={topshiriq.holat} />
      </div>

      {topshiriq.izoh && (
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
          {topshiriq.izoh}
        </p>
      )}

      <MuddatQatori topshiriq={topshiriq} kechikkan={kechikkan} />

      {topshiriq.holat === 'rad' && topshiriq.rad_sababi && (
        <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {topshiriq.rad_sababi}
        </p>
      )}

      {/* Yuboruvchi natijani qaytargan — nima yetishmayotgani */}
      {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
        <div className="mt-2 rounded-xl bg-status-progress px-3 py-2 text-sm text-status-progress-text">
          <p className="font-semibold">{t('topshiriq.qaytarildiSarlavha')}</p>
          <p className="mt-0.5 leading-relaxed">{topshiriq.qaytarish_sababi}</p>
        </div>
      )}

      {topshiriq.holat === 'tekshiruvda' && (
        <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-sm text-text-muted">
          {t('topshiriq.tekshirilmoqda')}
        </p>
      )}

      {topshiriq.holat === 'qabul' && !tanlashRejimi && (
        <button
          type="button"
          onClick={() => setTopshirishOchiq(true)}
          className="mt-3 flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          <CheckCheck className="size-4" aria-hidden />
          {t('topshiriq.bajardim')}
        </button>
      )}

      {topshirishOchiq && (
        <Oyna
          sarlavha={t('topshiriq.bajardim')}
          yop={() => setTopshirishOchiq(false)}
        >
          <p className="mb-3 text-sm leading-relaxed text-text-muted">
            {topshiriq.tekshirish
              ? t('topshiriq.topshirishIzohi')
              : t('topshiriq.topshirishIzohiOddiy')}
          </p>
          <OsuvchiMaydon
            qiymat={natija}
            onChange={setNatija}
            placeholder={t('topshiriq.natijaJoy')}
            ariaLabel={t('topshiriq.natija')}
            maxLength={2000}
            autoFocus
            engKattaBalandlik={180}
            className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTopshirishOchiq(false)}
              className="min-h-touch rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
            >
              {t('umumiy.bekor')}
            </button>
            <button
              type="button"
              onClick={topshir}
              disabled={topshirish.isPending}
              className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              <Send className="size-4" aria-hidden />
              {t('topshiriq.topshirish')}
            </button>
          </div>
        </Oyna>
      )}

      {javobBerilmagan && !tanlashRejimi && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={qabulQil}
            disabled={qabul.isPending}
            className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {t('topshiriq.qabul')}
          </button>
          <button
            type="button"
            onClick={() => setRadOchiq(true)}
            className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
          >
            <X className="size-4" aria-hidden />
            {t('topshiriq.rad')}
          </button>
        </div>
      )}

      {/*
        Bloklash ataylab kichik va past darajada: kundalik harakat
        emas, lekin kerak bo'lganda qo'l ostida bo'lishi shart.
        Rad etishni kutish shart emas -- darhol to'xtatish mumkin.
      */}
      {/* Email bo'lmasa bloklab ham bo'lmaydi — tugma ko'rsatilmaydi
          (bu holat faqat migratsiya qo'llanmaganda yuz beradi) */}
      {tafsilot?.qarshi_email && !tanlashRejimi && (
        <button
          type="button"
          onClick={() => setBlokOchiq(true)}
          className="mt-3 flex min-h-0 items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-text-faint transition hover:text-danger"
        >
          <Ban className="size-3.5" aria-hidden />
          {t('topshiriq.bloklash')}
        </button>
      )}

      {blokOchiq && (
        <Tasdiq
          sarlavha={t('topshiriq.bloklash')}
          matn={t('topshiriq.blokTasdiq', {
            kim: tafsilot?.qarshi_ism ?? t('topshiriq.bunOdam'),
          })}
          tasdiqla={async () => {
            try {
              await ruxsat.mutateAsync({
                email: tafsilot?.qarshi_email ?? '',
                holat: 'blok',
              })
              setBlokOchiq(false)
              korsat({ matn: t('topshiriq.bloklandi'), tone: 'muvaffaqiyat' })
            } catch {
              korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
            }
          }}
          yop={() => setBlokOchiq(false)}
          bajarilmoqda={ruxsat.isPending}
        />
      )}

      {radOchiq && (
        <Oyna sarlavha={t('topshiriq.radSababi')} yop={() => setRadOchiq(false)}>
          <OsuvchiMaydon
            qiymat={sabab}
            onChange={setSabab}
            placeholder={t('topshiriq.radSababiJoy')}
            ariaLabel={t('topshiriq.radSababi')}
            maxLength={1000}
            autoFocus
            engKattaBalandlik={180}
            className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRadOchiq(false)}
              className="min-h-touch rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
            >
              {t('umumiy.bekor')}
            </button>
            <button
              type="button"
              onClick={radEt}
              disabled={rad.isPending}
              className="flex min-h-touch items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              <ThumbsDown className="size-4" aria-hidden />
              {t('topshiriq.radYubor')}
            </button>
          </div>
        </Oyna>
      )}
    </li>
  )
}

// =============================================================
// Men yuborgan topshiriq — holatini kuzatish
// =============================================================
function YuborilganKarta({
  topshiriq,
  tafsilot,
  kechikkan,
  tanlanganmi,
  tanlashRejimi,
  tanlovniAlmashtir,
}: {
  topshiriq: Topshiriq
  tafsilot?: TopshiriqTafsiloti
  kechikkan: boolean
  tanlanganmi: boolean
  tanlashRejimi: boolean
  tanlovniAlmashtir: () => void
}) {
  const t = useT()
  const uzoqBosish = useUzoqBosish(tanlovniAlmashtir)
  const { korsat } = useToast()
  const bekor = useTopshiriqBekor()
  const tasdiqlash = useTopshiriqTasdiqlash()
  const qaytarish = useTopshiriqQaytarish()
  const [bekorOchiq, setBekorOchiq] = useState(false)
  const [qaytarishOchiq, setQaytarishOchiq] = useState(false)
  const [sabab, setSabab] = useState('')

  async function tasdiqla() {
    try {
      await tasdiqlash.mutateAsync(topshiriq.id)
      korsat({ matn: t('topshiriq.tasdiqlandi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  async function qaytar() {
    try {
      await qaytarish.mutateAsync({ id: topshiriq.id, sabab })
      setQaytarishOchiq(false)
      setSabab('')
      korsat({ matn: t('topshiriq.qaytarildi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <li
      {...uzoqBosish}
      onClick={tanlashRejimi ? tanlovniAlmashtir : undefined}
      className={`rounded-2xl p-4 shadow-card transition select-none sm:select-text ${
        // Tanlangani FONI bilan ajralib turadi. Faqat halqa
        // (ring) yetarli emasdi: telefonda ingichka chiziq
        // ko'zga tashlanmay, qaysi biri belgilangani bilinmasdi.
        tanlanganmi
          ? 'bg-brand-soft ring-2 ring-brand-onsoft'
          : 'bg-surface'
      } ${tanlashRejimi ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <TanlashKatagi
          tanlanganmi={tanlanganmi}
          tanlashRejimi={tanlashRejimi}
          almashtir={tanlovniAlmashtir}
          nom={topshiriq.sarlavha}
        />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">{topshiriq.sarlavha}</p>
          {/* Ism faqat qabul qilingandan keyin keladi (maxfiylik
              qoidasi bazada) -- shunda email ostiga tushadi. */}
          {tafsilot?.qarshi_ism ? (
            <>
              <p className="mt-0.5 truncate text-sm font-medium text-text-strong">
                {tafsilot.qarshi_ism}
              </p>
              <p className="truncate text-xs text-text-faint">
                {topshiriq.qabul_qiluvchi_email}
              </p>
            </>
          ) : (
            <p className="mt-0.5 truncate text-sm text-text-muted">
              {topshiriq.qabul_qiluvchi_email}
            </p>
          )}
        </div>
        <HolatBelgisi holat={topshiriq.holat} />
      </div>

      {topshiriq.holat === 'rad' && topshiriq.rad_sababi && (
        <p className="mt-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
          {topshiriq.rad_sababi}
        </p>
      )}

      <MuddatQatori topshiriq={topshiriq} kechikkan={kechikkan} />

      {/*
        Ish jarayoni -- faqat yuboruvchiga va faqat qabul
        qilingandan keyin. Vazifa matni, izohi va papkasi
        ko'rinmaydi: xodimning shaxsiy ro'yxati boshliqqa
        ochilmasligi kerak. Tekshiruvda esa foiz ma'nosiz —
        o'rniga ijrochining natija izohi va qaror tugmalari.
      */}
      {topshiriq.holat !== 'tekshiruvda' && <IshJarayoni tafsilot={tafsilot} />}

      {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
        <p className="mt-2 rounded-xl bg-surface-muted px-3 py-2 text-sm text-text-muted">
          {t('topshiriq.sizQaytargansiz', { sabab: topshiriq.qaytarish_sababi })}
        </p>
      )}

      {topshiriq.holat === 'tekshiruvda' && (
        <div className="mt-3 rounded-xl border border-border-subtle px-3 py-2.5">
          <p className="text-xs font-semibold text-text-muted">
            {t('topshiriq.natija')}
          </p>
          <p className="mt-0.5 text-sm leading-relaxed text-text-strong">
            {topshiriq.topshirish_izohi || t('topshiriq.natijaYoq')}
          </p>
        </div>
      )}

      {topshiriq.holat === 'tekshiruvda' && !tanlashRejimi && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={tasdiqla}
            disabled={tasdiqlash.isPending}
            className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            <Check className="size-4" aria-hidden />
            {t('topshiriq.tasdiqlash')}
          </button>
          <button
            type="button"
            onClick={() => setQaytarishOchiq(true)}
            className="flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-text-strong transition hover:bg-surface-muted"
          >
            <RotateCcw className="size-4" aria-hidden />
            {t('topshiriq.qaytarish')}
          </button>
        </div>
      )}

      {qaytarishOchiq && (
        <Oyna
          sarlavha={t('topshiriq.qaytarishSababi')}
          yop={() => setQaytarishOchiq(false)}
        >
          <OsuvchiMaydon
            qiymat={sabab}
            onChange={setSabab}
            placeholder={t('topshiriq.qaytarishSababiJoy')}
            ariaLabel={t('topshiriq.qaytarishSababi')}
            maxLength={1000}
            autoFocus
            engKattaBalandlik={180}
            className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setQaytarishOchiq(false)}
              className="min-h-touch rounded-xl px-4 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
            >
              {t('umumiy.bekor')}
            </button>
            <button
              type="button"
              onClick={qaytar}
              disabled={qaytarish.isPending || sabab.trim() === ''}
              className="flex min-h-touch items-center gap-2 rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
            >
              <RotateCcw className="size-4" aria-hidden />
              {t('topshiriq.qaytarish')}
            </button>
          </div>
        </Oyna>
      )}

      {/* Javob kelmaguncha bekor qilish mumkin.
          Tanlash rejimida yashiriladi: karta butunlay tanlash
          maydoniga aylanadi va tasodifiy bosish bo'lmaydi. */}
      {topshiriq.holat === 'kutilmoqda' && !tanlashRejimi && (
        <button
          type="button"
          onClick={() => setBekorOchiq(true)}
          className="mt-3 flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-danger transition hover:bg-danger-soft"
        >
          <Trash2 className="size-4" aria-hidden />
          {t('topshiriq.bekor')}
        </button>
      )}

      {bekorOchiq && (
        <Tasdiq
          sarlavha={t('topshiriq.bekor')}
          matn={topshiriq.sarlavha}
          tasdiqla={async () => {
            try {
              await bekor.mutateAsync(topshiriq.id)
              setBekorOchiq(false)
              korsat({
                matn: t('topshiriq.bekorQilindi'),
                tone: 'muvaffaqiyat',
              })
            } catch {
              korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
            }
          }}
          yop={() => setBekorOchiq(false)}
          bajarilmoqda={bekor.isPending}
        />
      )}
    </li>
  )
}

// =============================================================
// Yuborish oynasi
// =============================================================
function YuborishOynasi({ yop }: { yop: () => void }) {
  const t = useT()
  const { korsat } = useToast()
  const { email: ozEmail } = useFoydalanuvchi()
  const yuborish = useTopshiriqYuborish()
  const kontaktlar = useTopshiriqKontaktlari()

  const [email, setEmail] = useState('')
  const [sarlavha, setSarlavha] = useState('')
  const [izoh, setIzoh] = useState('')
  const [muddat, setMuddat] = useState('')
  const [vaqt, setVaqt] = useState('')
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(4)
  const [tekshirish, setTekshirish] = useState(true)
  // Kontaktlar ro'yxati bo'lsa, email maydoni yashirin turadi —
  // ko'p hollarda odam ro'yxatdan tanlaydi, yozmaydi
  const [yangiOdam, setYangiOdam] = useState(false)

  const toza = email.trim().toLowerCase()
  const emailTogri = EMAIL_SHAKLI.test(toza)
  const ozigami = toza === ozEmail.toLowerCase()

  /*
    Taqiq bazada (RLS) tekshiriladi, ya'ni yuborgandan keyin rad
    etiladi va odam faqat quruq "saqlanmadi" xatosini ko'rardi.
    Shuning uchun email yozilishi bilan oldindan so'raymiz va
    sababini tushuntiramiz.
  */
  const { data: yozsaBoladi } = useYozsaBoladimi(toza)
  const taqiqlangan = emailTogri && !ozigami && yozsaBoladi === false

  const toliq =
    emailTogri && !ozigami && !taqiqlangan && sarlavha.trim().length > 0

  const emailMaydoni = yangiOdam || kontaktlar.length === 0
  const tanlanganKontakt = kontaktlar.find((k) => k.email === toza)

  async function yubor() {
    if (!toliq || yuborish.isPending) return
    try {
      await yuborish.mutateAsync({
        qabul_qiluvchi_email: toza,
        sarlavha,
        izoh,
        muddat: muddat || null,
        muddat_vaqt: muddat && vaqt ? vaqt : null,
        muhimlik,
        tekshirish,
      })
      korsat({ matn: t('topshiriq.yuborildi'), tone: 'muvaffaqiyat' })
      yop()
    } catch (xato) {
      /*
        Taqiq baza darajasida (RLS) qo'yilgan. Oldindan tekshirib
        turamiz, lekin tekshiruv bilan yuborish orasida odam
        bloklab ulgurishi mumkin — shunda ham quruq "saqlanmadi"
        emas, sababini aytamiz.
      */
      const xabar = xato instanceof Error ? xato.message : ''
      const bloklangan = xabar.includes('row-level security')
      korsat({
        matn: bloklangan
          ? t('topshiriq.taqiqlangan')
          : t('topshiriq.yuborilmadi'),
        tone: 'xato',
      })
    }
  }

  return (
    <Oyna sarlavha={t('topshiriq.yangi')} yop={yop}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          yubor()
        }}
      >
        <p className="mb-1.5 text-sm font-medium text-text-muted">
          {t('topshiriq.kimga')}
        </p>

        {/*
          Kontaktlar — kim bilan topshiriq almashgan bo'lsam. Email
          har safar qayta yozilmaydi: bir bosishda tanlanadi.
        */}
        {kontaktlar.length > 0 && (
          <div className="-mx-1 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto px-1 py-0.5">
            {kontaktlar.map((k) => {
              const faol = k.email === toza
              return (
                <button
                  key={k.email}
                  type="button"
                  aria-pressed={faol}
                  onClick={() => {
                    setEmail(k.email)
                    setYangiOdam(false)
                  }}
                  className={`flex min-h-0 max-w-full items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition ${
                    faol
                      ? 'border-brand-onsoft bg-brand-soft text-brand-onsoft'
                      : 'border-border-subtle text-text-strong hover:bg-surface-muted'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                      faol ? 'bg-brand-primary text-white' : 'bg-surface-muted text-text-muted'
                    }`}
                  >
                    {bosHarflar(k.ism ?? k.email)}
                  </span>
                  <span className="truncate">{k.ism ?? k.email}</span>
                </button>
              )
            })}
            {!emailMaydoni && (
              <button
                type="button"
                onClick={() => {
                  setYangiOdam(true)
                  setEmail('')
                }}
                className="min-h-0 rounded-full border border-dashed border-border-control px-3 py-1 text-sm font-medium text-brand-onsoft transition hover:bg-brand-soft"
              >
                {t('topshiriq.yangiOdam')}
              </button>
            )}
          </div>
        )}

        {/* Tanlangan kontaktning emaili — adashib ketmaslik uchun */}
        {!emailMaydoni && tanlanganKontakt?.ism && (
          <p className="mt-1.5 truncate px-1 text-xs text-text-faint">{toza}</p>
        )}

        {emailMaydoni && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('topshiriq.kimgaJoy')}
            aria-label={t('topshiriq.kimga')}
            autoFocus
            maxLength={200}
            className={`min-h-touch w-full rounded-xl border border-border-control bg-surface px-4 text-base text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft ${
              kontaktlar.length > 0 ? 'mt-2' : ''
            }`}
          />
        )}

        {/*
          Odam hali ilovada bo'lmasa — havola yuboriladi. Topshiriq
          baribir saqlanadi va u ro'yxatdan o'tishi bilan ko'rinadi.
        */}
        <TaklifTugmasi />

        {toza !== '' && !emailTogri && (
          <p className="mt-1.5 text-sm text-danger">
            {t('topshiriq.emailNotogri')}
          </p>
        )}
        {ozigami && (
          <p className="mt-1.5 text-sm text-danger">
            {t('topshiriq.ozigaBolmaydi')}
          </p>
        )}

        <label className="mt-5 mb-1.5 block text-sm font-medium text-text-muted">
          {t('topshiriq.sarlavha')}
        </label>
        <OsuvchiMaydon
          qiymat={sarlavha}
          onChange={setSarlavha}
          onEnter={yubor}
          placeholder={t('vazifa.nomiJoy')}
          ariaLabel={t('topshiriq.sarlavha')}
          maxLength={500}
          engKattaBalandlik={160}
          className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />

        <label className="mt-5 mb-1.5 block text-sm font-medium text-text-muted">
          {t('topshiriq.izoh')}
        </label>
        <OsuvchiMaydon
          qiymat={izoh}
          onChange={setIzoh}
          placeholder={t('topshiriq.izohJoy')}
          ariaLabel={t('topshiriq.izoh')}
          maxLength={2000}
          engKattaBalandlik={180}
          className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
        />

        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div>
            <label
              htmlFor="topshiriq-muddat"
              className="mb-1.5 block text-sm font-medium text-text-muted"
            >
              {t('topshiriq.muddat')}
            </label>
            <div className="flex gap-2">
              <input
                id="topshiriq-muddat"
                type="date"
                value={muddat}
                min={bugunISO()}
                onChange={(e) => {
                  setMuddat(e.target.value)
                  if (!e.target.value) setVaqt('')
                }}
                className="min-h-touch rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
              />
              {/* Soat faqat sana tanlangach — sanasiz soat ma'nosiz */}
              {muddat && (
                <input
                  type="time"
                  value={vaqt}
                  onChange={(e) => setVaqt(e.target.value)}
                  aria-label={t('topshiriq.soat')}
                  className="min-h-touch rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
                />
              )}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-text-muted">
              {t('vazifa.muhimlik')}
            </p>
            <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} ixcham />
          </div>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-border-subtle px-4 py-3">
          <input
            type="checkbox"
            checked={tekshirish}
            onChange={(e) => setTekshirish(e.target.checked)}
            className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brand-primary"
          />
          <span>
            <span className="block text-sm font-semibold text-text-strong">
              {t('topshiriq.tekshirishKerak')}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
              {t('topshiriq.tekshirishKerakIzoh')}
            </span>
          </span>
        </label>

        {taqiqlangan ? (
          <div className="mt-5 rounded-xl bg-danger-soft px-4 py-3">
            <p className="text-sm font-semibold text-danger">
              {t('topshiriq.taqiqlangan')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              {t('topshiriq.taqiqlanganIzoh')}
            </p>
          </div>
        ) : (
          <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-text-muted">
            {t('topshiriq.yuborishIzohi')}
          </p>
        )}

        <button
          type="submit"
          disabled={!toliq || yuborish.isPending}
          className="mt-5 flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden />
          {yuborish.isPending ? t('umumiy.kuting') : t('topshiriq.yubor')}
        </button>
      </form>
    </Oyna>
  )
}

// =============================================================
// Ish jarayoni — faqat yuboruvchiga ko'rinadi
// =============================================================
/**
 * Boshliq yuborgan ishi qay darajada bajarilganini ko'radi.
 *
 * Ataylab juda kam ma'lumot: holat va foiz. Vazifa matni, izohi,
 * papkasi va qolgan tafsilotlari ko'rsatilmaydi — xodimning
 * shaxsiy ro'yxati boshqa odamga ochilib qolmasligi kerak.
 * Cheklov bazada ham bor, bu yerda faqat chizish.
 */
function IshJarayoni({ tafsilot }: { tafsilot?: TopshiriqTafsiloti }) {
  const t = useT()
  if (!tafsilot) return null

  if (tafsilot.ochirilganmi) {
    return (
      <p className="mt-2 text-xs font-medium text-danger">
        {t('topshiriq.vazifaOchirilgan')}
      </p>
    )
  }

  if (!tafsilot.vazifa_holati) return null

  const foiz = tafsilot.foiz ?? 0
  const tugagan = tafsilot.vazifa_holati === 'done'
  const matn = tugagan
    ? t('topshiriq.tugallangan')
    : tafsilot.vazifa_holati === 'in_progress'
      ? t('topshiriq.jarayonda')
      : t('topshiriq.boshlanmagan')

  return (
    <div className="mt-2.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-text-muted">{matn}</span>
        <span className="font-semibold text-text-strong">{foiz}%</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${foiz}%`,
            backgroundColor: tugagan ? '#10b981' : 'var(--brand-accent)',
          }}
        />
      </div>
    </div>
  )
}

// =============================================================
// Bloklanganlar va ruxsat berilganlar
// =============================================================
/**
 * Kim menga topshiriq yubora oladi.
 *
 * Bu ro'yxat ataylab sahifaning oxirida va yig'ilgan holda:
 * odam uni kamdan-kam ochadi. Lekin kerak bo'lganda — masalan
 * boshlig'ini bexosdan bloklab qo'ysa — bir bosishda topadi va
 * qaytaradi. Oxirgi so'z doim shu yerda: yuboruvchi emas,
 * qabul qiluvchi hal qiladi.
 */
function Bloklanganlar() {
  const t = useT()
  const { korsat } = useToast()
  const { data: royxat } = useTopshiriqRuxsatlari()
  const ozgartir = useRuxsatOzgartirish()
  const [ochiq, setOchiq] = useState(false)

  const bloklangan = (royxat ?? []).filter((r) => r.holat === 'blok')
  const ruxsatli = (royxat ?? []).filter((r) => r.holat === 'ruxsat')

  if (bloklangan.length === 0 && ruxsatli.length === 0) return null

  async function ozgartirish(email: string, holat: 'ruxsat' | null) {
    try {
      await ozgartir.mutateAsync({ email, holat })
      korsat({
        matn: holat === 'ruxsat' ? t('topshiriq.ruxsatBerildi') : t('topshiriq.blokOlindi'),
        tone: 'muvaffaqiyat',
      })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOchiq((v) => !v)}
        aria-expanded={ochiq}
        className="flex w-full min-h-0 items-center gap-2 rounded-xl px-1 py-2 text-left transition hover:bg-surface-muted"
      >
        <ShieldCheck className="size-4 shrink-0 text-text-faint" aria-hidden />
        <span className="flex-1 text-sm font-semibold text-text-muted">
          {t('topshiriq.kimYozaOladi')}
        </span>
        <span className="shrink-0 text-sm text-text-faint">
          {bloklangan.length + ruxsatli.length}
        </span>
      </button>

      {ochiq && (
        <>
          <p className="mt-1 mb-2 px-1 text-xs leading-relaxed text-text-faint">
            {t('topshiriq.kimYozaOladiIzoh')}
          </p>

          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {[...bloklangan, ...ruxsatli].map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-3 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-text-strong">
                  {r.yuboruvchi_email}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.holat === 'blok'
                      ? 'bg-danger-soft text-danger'
                      : 'bg-brand-soft text-brand-onsoft'
                  }`}
                >
                  {r.holat === 'blok'
                    ? t('topshiriq.bloklangan')
                    : t('topshiriq.ruxsatli')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    ozgartirish(
                      r.yuboruvchi_email,
                      r.holat === 'blok' ? 'ruxsat' : null
                    )
                  }
                  disabled={ozgartir.isPending}
                  className="min-h-0 shrink-0 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
                >
                  {r.holat === 'blok'
                    ? t('topshiriq.ruxsatBerish')
                    : t('topshiriq.blokniOlish')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/**
 * Kartaning oldidagi belgilash katagi.
 *
 * `<label>` ichida: barmoq bilan bosish maydoni katta bo'lishi
 * uchun. `aria-label` da topshiriq nomi — ekran o'qigichda
 * "Tanlash, Tanlash, Tanlash" o'rniga qaysi birini tanlayotgani
 * eshitiladi.
 */
function TanlashKatagi({
  tanlanganmi,
  tanlashRejimi,
  almashtir,
  nom,
}: {
  tanlanganmi: boolean
  tanlashRejimi: boolean
  almashtir: () => void
  nom: string
}) {
  const t = useT()
  return (
    <>
      {/*
        TELEFON uchun doira belgisi.

        Faqat tanlash rejimida chiqadi va IKKALA holatni ham
        ko'rsatadi: belgilangani to'ldirilgan va ichida belgi,
        belgilanmagani esa bo'sh halqa. Oldin faqat kartaning
        atrofidagi ingichka chiziq bor edi va telefonda qaysi
        biri tanlanganini ajratib bo'lmasdi.
      */}
      {tanlashRejimi && (
        <span
          aria-hidden
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition sm:hidden ${
            tanlanganmi
              ? 'border-brand-onsoft bg-brand-primary'
              : 'border-border-control bg-surface'
          }`}
        >
          {tanlanganmi && (
            <Check className="size-4 text-white" strokeWidth={3} aria-hidden />
          )}
        </span>
      )}

      {/*
        Katakcha faqat KOMPYUTERDA (`hidden sm:flex`).

        Telefonda u ro'yxatni xunuk qiladi va joy egallaydi,
        shuning uchun u yerda tanlash boshqacha boshlanadi:
        kartani bosib turish bilan (Telegram naqshi).
      */}
      <label
        onClick={(e) => e.stopPropagation()}
        className="hidden shrink-0 cursor-pointer items-center justify-center p-1 sm:flex"
      >
        <input
          type="checkbox"
          checked={tanlanganmi}
          onChange={almashtir}
          aria-label={`${t('topshiriq.tanlash')}: ${nom}`}
          className="size-5 cursor-pointer accent-brand-primary"
        />
      </label>
    </>
  )
}

/**
 * Yuborilgan sana va muddat.
 *
 * Oldin faqat quruq sana turardi ("Muddat: 21-noyabr") va odam
 * uni o'zi hisoblab, "bu necha kun bo'ladi?" deb o'ylab ko'rishi
 * kerak edi. Endi ikkalasi ham aytiladi: qaysi kundan qaysi
 * kungacha va necha kun. Muddat belgilanmagan bo'lsa faqat
 * yuborilgan sana ko'rinadi.
 */
function MuddatQatori({
  topshiriq,
  kechikkan,
}: {
  topshiriq: Topshiriq
  kechikkan: boolean
}) {
  const t = useT()
  const yuborilgan = topshiriq.created_at.slice(0, 10)
  const soat = vaqtMatni(topshiriq.muddat_vaqt ?? null)

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-faint">
      <span className="flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        {t('topshiriq.yuborilganSana', { sana: toliqSana(yuborilgan) })}
      </span>

      {topshiriq.muddat && (
        <>
          <span
            className={`font-medium ${kechikkan ? 'text-danger' : 'text-text-muted'}`}
          >
            {t('topshiriq.dedlayn', {
              boshi: toliqSana(yuborilgan),
              oxiri: soat
                ? `${toliqSana(topshiriq.muddat)}, ${soat}`
                : toliqSana(topshiriq.muddat),
            })}
          </span>
          {kechikkan && (
            <span className="rounded-full bg-danger-soft px-2 py-0.5 font-semibold text-danger">
              {t('topshiriq.filtr.kechikkan')}
            </span>
          )}
          <span>
            {t('topshiriq.muddatKun', {
              kun: kunOraligi(yuborilgan, topshiriq.muddat),
            })}
          </span>
        </>
      )}
    </p>
  )
}

/** "Azizbek Xoldarov" -> "AX", "ali@mail.uz" -> "A" */
function bosHarflar(matn: string): string {
  const qism = matn.split('@')[0].trim().split(/\s+/).filter(Boolean)
  return qism
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Hamkasbni ilovaga taklif qilish.
 *
 * Topshiriq ro'yxatdan o'tmagan emailga ham yuboriladi va odam
 * kirishi bilan paydo bo'ladi — lekin u buni bilishi kerak. Shuning
 * uchun bir bosishda havola ulashiladi. Telefonda tizimning "Ulashish"
 * oynasi (Telegram ham shu yerda), u bo'lmasa — to'g'ridan-to'g'ri
 * Telegram ulashish sahifasi.
 */
function TaklifTugmasi() {
  const t = useT()
  const matn = t('topshiriq.taklifMatni')

  async function ulash() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: matn, url: DOMEN })
        return
      } catch (e) {
        // Odam oynani o'zi yopdi — boshqa yo'l kerak emas
        if (e instanceof DOMException && e.name === 'AbortError') return
      }
    }
    const havola = `https://t.me/share/url?url=${encodeURIComponent(
      DOMEN
    )}&text=${encodeURIComponent(matn)}`
    window.open(havola, '_blank', 'noopener')
  }

  return (
    <button
      type="button"
      onClick={ulash}
      className="mt-2 flex min-h-0 items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-brand-onsoft transition hover:underline"
    >
      <Share2 className="size-3.5" aria-hidden />
      {t('topshiriq.taklifQilish')}
    </button>
  )
}
