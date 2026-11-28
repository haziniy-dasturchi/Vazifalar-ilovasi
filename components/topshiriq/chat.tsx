'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Copy,
  FileText,
  Mic,
  Paperclip,
  Reply,
  Send,
  SmilePlus,
  Square,
  Trash2,
  X,
} from 'lucide-react'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { useSupabase } from '@/lib/supabase/use-supabase'
import {
  FAYL_CHEGARASI,
  faylHavolasi,
  useIzohOchirish,
  useIzohQoshish,
  useReaksiya,
} from '@/lib/queries/topshiriq-jamoa'
import { useOnlaynmi } from '@/lib/queries/topshiriqlar'
import { toliqSana } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'
import type { ReaksiyaTuri, TopshiriqHodisasi, TopshiriqIzohi } from '@/types/vazifalar'
import { avatarRangi } from './holat'
import { Avatar } from './karta'

/**
 * Suhbat foni — Telegram'dagi "gulqog'oz" o'rnida: brend rangidagi
 * mayda nuqtalar va yumshoq gradient. Faqat mavzu o'zgaruvchilaridan
 * yasalgan, shuning uchun qorong'i mavzuda ham o'zi moslashadi.
 */
export const CHAT_FONI: CSSProperties = {
  backgroundColor: 'var(--surface-sunken)',
  backgroundImage:
    'radial-gradient(color-mix(in srgb, var(--brand-accent) 22%, transparent) 1.2px, transparent 1.7px),' +
    'linear-gradient(165deg, color-mix(in srgb, var(--brand-accent) 14%, var(--surface-sunken)), var(--surface-sunken) 65%)',
  backgroundSize: '20px 20px, 100% 100%',
}

/** Fon ustidagi markaziy yozuvlar: sana, "Muhokama boshlandi", hodisalar */
export const PILL =
  'max-w-[85%] rounded-2xl bg-brand-primary/75 px-3 py-1 text-center text-xs font-medium text-white backdrop-blur-sm'

/** O'zimning xabarim foni: brend yashilining och tusi (Telegram'dagidek) */
const MENIKI_FON = 'color-mix(in srgb, var(--brand-accent) 20%, var(--surface))'

/**
 * Oltita reaksiya — tartibi tanlov oynasida ham, xabar ostida ham shu.
 * `kod` — public/emoji/ dagi Noto emoji fayli (Unicode kodi).
 */
const REAKSIYALAR: { tur: ReaksiyaTuri; emoji: string; kod: string; kalit: MatnKaliti }[] = [
  { tur: 'zor', emoji: '👍', kod: '1f44d', kalit: 'tk.reaksiya.zor' },
  { tur: 'qarsak', emoji: '👏', kod: '1f44f', kalit: 'tk.reaksiya.qarsak' },
  { tur: 'jilmayish', emoji: '😁', kod: '1f601', kalit: 'tk.reaksiya.jilmayish' },
  { tur: 'qahqah', emoji: '😂', kod: '1f602', kalit: 'tk.reaksiya.qahqah' },
  { tur: 'xafa', emoji: '😢', kod: '1f622', kalit: 'tk.reaksiya.xafa' },
  { tur: 'kelishuv', emoji: '🤝', kod: '1f91d', kalit: 'tk.reaksiya.kelishuv' },
]

/**
 * Reaksiya emojisi — Telegram'dagidek hamma qurilmada bir xil, chiroyli
 * (tizim shriftiga bog'liq emas). `jonli` bo'lsa animatsiya o'ynaydi.
 * Rasm yuklanmasa (masalan, eski kesh) — oddiy emoji belgisi qoladi.
 */
function Emoji({
  r,
  jonli = false,
  className = '',
}: {
  r: (typeof REAKSIYALAR)[number]
  jonli?: boolean
  className?: string
}) {
  const [xato, setXato] = useState(false)
  if (xato) return <span className={`leading-none ${className}`}>{r.emoji}</span>
  return (
    // eslint-disable-next-line @next/next/no-img-element -- statik eksport, kichik mahalliy fayl
    <img
      src={`/emoji/${r.kod}.${jonli ? 'webp' : 'svg'}`}
      alt={r.emoji}
      draggable={false}
      onError={() => setXato(true)}
      className={`pointer-events-none select-none ${className}`}
    />
  )
}

/**
 * Tanlov oynasidagi bitta emoji: ketma-ket "otilib" chiqadi, ustiga
 * kelinganda kattalashib jonlanadi (Telegram'dagidek).
 */
function TanlovEmojisi({
  r,
  tartib,
  tanlangan,
  yorliq,
  onClick,
}: {
  r: (typeof REAKSIYALAR)[number]
  tartib: number
  tanlangan: boolean
  yorliq: string
  onClick: () => void
}) {
  const [faol, setFaol] = useState(false)
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onPointerEnter={() => setFaol(true)}
      onPointerLeave={() => setFaol(false)}
      onFocus={() => setFaol(true)}
      onBlur={() => setFaol(false)}
      aria-label={yorliq}
      title={yorliq}
      className={`flex size-11 min-h-0 items-center justify-center rounded-full transition-transform duration-150 hover:scale-125 active:scale-95 ${
        tanlangan ? 'bg-brand-soft' : ''
      }`}
    >
      <span className="reaksiya-chiqish flex" style={{ animationDelay: `${tartib * 35}ms` }}>
        <Emoji r={r} jonli={faol} className="size-8" />
      </span>
    </button>
  )
}

/** Tanlov ochilganda jonli fayllarni oldindan yuklab qo'yamiz — hover kechikmasin */
let jonlilarYuklandi = false
function jonlilarniYukla() {
  if (jonlilarYuklandi || typeof window === 'undefined') return
  jonlilarYuklandi = true
  for (const r of REAKSIYALAR) new Image().src = `/emoji/${r.kod}.webp`
}

const HODISA: Record<string, MatnKaliti> = {
  yuborildi: 'tk.hodisa.yuborildi',
  qabul: 'tk.hodisa.qabul',
  rad: 'tk.hodisa.rad',
  tekshiruvda: 'tk.hodisa.tekshiruvda',
  qaytarildi: 'tk.hodisa.qaytarildi',
  qayta_ochildi: 'tk.hodisa.qaytaOchildi',
  tasdiqlandi: 'tk.hodisa.tasdiqlandi',
  bajarildi: 'tk.hodisa.bajarildi',
  tahrirlandi: 'tk.hodisa.tahrirlandi',
}

const soatMatni = (iso: string) => {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const mahalliyKun = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const hajm = (b: number | null) =>
  !b ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1048576).toFixed(1)} MB`

/** Xabarning qisqa ko'rinishi — javob iqtibosi uchun (Telegram kabi) */
function qisqaMatn(x: TopshiriqIzohi, t: ReturnType<typeof useT>): string {
  if (x.matn) return x.matn.replace(/\s+/g, ' ')
  const turi = x.fayl_turi ?? ''
  if (turi.startsWith('audio/')) return t('tk.ovozliXabar')
  if (turi.startsWith('image/')) return t('tk.rasm')
  if (turi.startsWith('video/')) return t('tk.video')
  return x.fayl_nomi ?? ''
}

/** Javob iqtibosining rangi: menikimi — brend, aks holda ikkinchi tomon rangi */
const iqtibosRangi = (meniki: boolean, kalit: string) =>
  meniki ? 'var(--brand-accent)' : avatarRangi(kalit)

/**
 * Iqtibos: chap chiziq, ism va xabarning bir qatori. Pufak ichida ham,
 * yozish maydoni ustida ham bir xil ko'rinadi.
 */
function Iqtibos({ ism, matn, rang }: { ism: string; matn: string; rang: string }) {
  return (
    <span
      className="flex min-w-0 flex-col rounded-lg border-l-[3px] py-0.5 pr-2 pl-2 text-left text-sm leading-snug"
      style={{ borderColor: rang, backgroundColor: `color-mix(in srgb, ${rang} 12%, transparent)` }}
    >
      {ism && (
        <span className="truncate font-semibold" style={{ color: rang }}>
          {ism}
        </span>
      )}
      <span className={`truncate text-text-muted ${ism ? '' : 'italic'}`}>{matn}</span>
    </span>
  )
}

type Yozuv =
  | { tur: 'hodisa'; vaqt: string; h: TopshiriqHodisasi }
  | { tur: 'xabar'; vaqt: string; x: TopshiriqIzohi }

/**
 * Topshiriq bo'yicha suhbat (Telegram naqshida): o'ngda men, chapda
 * ikkinchi tomon avatari bilan; kunlar va holat o'zgarishlari markazda
 * kichik yozuv bo'lib — "kim, qachon, nima qildi" chatning o'zida.
 * Bir odamning ketma-ket xabarlari guruhlanadi: ism faqat birinchisida,
 * avatar faqat oxirgisida (Telegram kabi).
 */
export function ChatXabarlari({
  xabarlar,
  tarix,
  qarshiIsm,
  qarshiKalit,
  onJavob,
}: {
  xabarlar: TopshiriqIzohi[]
  tarix: TopshiriqHodisasi[]
  qarshiIsm: string
  qarshiKalit: string
  /** "Javob berish" tanlanganda — yozish maydoniga iqtibos qo'yiladi */
  onJavob: (x: TopshiriqIzohi) => void
}) {
  const t = useT()
  const { id: menId } = useFoydalanuvchi()
  const oxiri = useRef<HTMLDivElement>(null)
  const boyicha = useMemo(() => new Map(xabarlar.map((x) => [x.id, x])), [xabarlar])

  // Iqtibos bosilganda asl xabarga o'tib, uni bir lahza yoritamiz
  const [yongan, setYongan] = useState<string | null>(null)
  const yonishTaymer = useRef<number | null>(null)
  function aslgaOt(id: string) {
    document.getElementById(`izoh-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    setYongan(id)
    if (yonishTaymer.current) window.clearTimeout(yonishTaymer.current)
    yonishTaymer.current = window.setTimeout(() => setYongan(null), 1600)
  }
  useEffect(() => () => {
    if (yonishTaymer.current) window.clearTimeout(yonishTaymer.current)
  }, [])

  const yozuvlar = useMemo<Yozuv[]>(
    () =>
      [
        ...tarix.map((h) => ({ tur: 'hodisa' as const, vaqt: h.created_at, h })),
        ...xabarlar.map((x) => ({ tur: 'xabar' as const, vaqt: x.created_at, x })),
      ].sort((a, b) => a.vaqt.localeCompare(b.vaqt)),
    [tarix, xabarlar]
  )

  // YANGI xabar kelganda pastga tushamiz (Telegram kabi). Sahifa
  // birinchi ochilganda esa yo'q — avval topshiriqning o'zi ko'rinsin.
  const oldingiSoni = useRef<number | null>(null)
  useEffect(() => {
    const songgi = yozuvlar[yozuvlar.length - 1]
    // Faqat haqiqatan yangi (hozirgina yozilgan) xabar — eski chat
    // yuklanib kelganda emas
    const yangimi = songgi && Date.now() - new Date(songgi.vaqt).getTime() < 120_000
    if (oldingiSoni.current !== null && yozuvlar.length > oldingiSoni.current && yangimi) {
      oxiri.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }
    oldingiSoni.current = yozuvlar.length
  }, [yozuvlar.length])

  const kim = (id: string | null) => (id === menId ? t('tj.siz') : qarshiIsm)

  /** Shu yozuv bilan bir guruhdami: bir kun, bir muallif, ikkalasi ham xabar */
  const birGuruh = (a: Yozuv | undefined, b: Yozuv | undefined) =>
    a?.tur === 'xabar' &&
    b?.tur === 'xabar' &&
    a.x.muallif_id === b.x.muallif_id &&
    mahalliyKun(a.vaqt) === mahalliyKun(b.vaqt)

  if (yozuvlar.length === 0) {
    return (
      <div className="flex justify-center py-2">
        <span className={PILL}>{t('tk.chatBosh')}</span>
      </div>
    )
  }

  return (
    <div>
      {yozuvlar.map((y, i) => {
        const oldingi = yozuvlar[i - 1]
        const keyingi = yozuvlar[i + 1]
        const kun = mahalliyKun(y.vaqt)
        const ajratgich = !oldingi || mahalliyKun(oldingi.vaqt) !== kun
        const davomi = birGuruh(oldingi, y)
        return (
          <div
            key={y.tur === 'hodisa' ? `h${y.h.id}` : `x${y.x.id}`}
            className={davomi ? 'mt-1' : 'mt-2.5'}
          >
            {ajratgich && (
              <div className="mb-2.5 flex justify-center">
                <span className={PILL}>{toliqSana(kun)}</span>
              </div>
            )}
            {y.tur === 'hodisa' ? (
              <div className="flex justify-center">
                <span className={PILL}>
                  <b className="font-semibold">{kim(y.h.kim_id)}</b>{' '}
                  {t(HODISA[y.h.hodisa] ?? 'tk.hodisa.ozgardi')}
                  {y.h.izoh ? `: “${y.h.izoh}”` : ''} · {soatMatni(y.h.created_at)}
                </span>
              </div>
            ) : (
              <XabarPufagi
                x={y.x}
                meniki={y.x.muallif_id === menId}
                ism={kim(y.x.muallif_id)}
                kalit={qarshiKalit}
                birinchi={!davomi}
                oxirgi={!birGuruh(y, keyingi)}
                asl={
                  y.x.javob_izoh_id
                    ? (boyicha.get(y.x.javob_izoh_id) ?? null)
                    : undefined
                }
                aslIsmi={(a) => kim(a.muallif_id)}
                yongan={yongan === y.x.id}
                onJavob={() => onJavob(y.x)}
                aslgaOt={aslgaOt}
              />
            )}
          </div>
        )
      })}
      <div ref={oxiri} />
    </div>
  )
}

function useHavola(yol: string | null) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['topshiriqlar', 'fayl-havola', yol],
    enabled: Boolean(yol),
    // Imzolangan havola 10 daqiqa yashaydi — 8 daqiqada yangilanadi
    staleTime: 8 * 60_000,
    gcTime: 9 * 60_000,
    queryFn: () => faylHavolasi(supabase, yol as string),
  })
}

function XabarPufagi({
  x,
  meniki,
  ism,
  kalit,
  birinchi,
  oxirgi,
  asl,
  aslIsmi,
  yongan,
  onJavob,
  aslgaOt,
}: {
  x: TopshiriqIzohi
  meniki: boolean
  ism: string
  /** Ikkinchi tomon avatari va ismining rangi uchun */
  kalit: string
  birinchi: boolean
  oxirgi: boolean
  /** Javob berilgan xabar: undefined — javob emas, null — asl o'chirilgan */
  asl: TopshiriqIzohi | null | undefined
  aslIsmi: (a: TopshiriqIzohi) => string
  /** Iqtibos orqali shu xabarga o'tilganda bir lahza yoritiladi */
  yongan: boolean
  onJavob: () => void
  aslgaOt: (id: string) => void
}) {
  const t = useT()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const ochirish = useIzohOchirish(x.topshiriq_id)
  const turi = x.fayl_turi ?? ''
  const rasm = turi.startsWith('image/')
  const video = turi.startsWith('video/')
  const ovoz = turi.startsWith('audio/')
  const { data: havola } = useHavola(x.fayl_yoli)
  const { id: menId } = useFoydalanuvchi()
  const reaksiya = useReaksiya(x.topshiriq_id)
  const [tanlov, setTanlov] = useState(false)
  const pufak = useRef<HTMLDivElement>(null)

  const meningReaksiyam = x.reaksiyalar?.find((r) => r.foydalanuvchi_id === menId)?.reaksiya ?? null
  const sanoq = REAKSIYALAR.map((r) => ({
    ...r,
    son: (x.reaksiyalar ?? []).filter((y) => y.reaksiya === r.tur).length,
  })).filter((r) => r.son > 0)

  // Yangi qo'yilgan reaksiya xabar ostida bir lahza "jonlanadi" (Telegram kabi)
  const [jonlanayotgan, setJonlanayotgan] = useState<ReaksiyaTuri | null>(null)
  const jonTaymer = useRef<number | null>(null)
  useEffect(() => () => {
    if (jonTaymer.current) window.clearTimeout(jonTaymer.current)
  }, [])

  function bos(tur: ReaksiyaTuri) {
    setTanlov(false)
    if (!onlayn) return
    // O'sha reaksiyani qayta bosish — olib tashlash (Telegram kabi)
    const olibTashlash = meningReaksiyam === tur
    reaksiya.mutate({ izohId: x.id, reaksiya: olibTashlash ? null : tur })
    if (!olibTashlash) {
      setJonlanayotgan(tur)
      if (jonTaymer.current) window.clearTimeout(jonTaymer.current)
      jonTaymer.current = window.setTimeout(() => setJonlanayotgan(null), 2500)
    }
  }

  // Tanlov oynasi tashqariga bosilganda yopiladi
  useEffect(() => {
    if (!tanlov) return
    jonlilarniYukla()
    const yop = (e: PointerEvent) => {
      if (!pufak.current?.contains(e.target as Node)) setTanlov(false)
    }
    document.addEventListener('pointerdown', yop)
    return () => document.removeEventListener('pointerdown', yop)
  }, [tanlov])

  // Telefonda xabarni chapga surish — javob berish (Telegram kabi)
  const [surish, setSurish] = useState(0)
  const tegish = useRef<{ x: number; y: number; gorizontal: boolean | null } | null>(null)
  const SURISH_CHEGARASI = 56

  function javobBer() {
    setTanlov(false)
    onJavob()
  }

  async function nusxala() {
    setTanlov(false)
    if (!x.matn) return
    try {
      await navigator.clipboard.writeText(x.matn)
      korsat({ matn: t('tk.matnNusxalandi'), tone: 'muvaffaqiyat' })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  // "Dum" faqat guruhdagi oxirgi pufakda — avatar tomonga qaragan burchak
  const burchak = oxirgi ? (meniki ? 'rounded-br-md' : 'rounded-bl-md') : ''
  const MENYU_BAND =
    'flex min-h-10 w-full items-center gap-3 px-3.5 text-left text-[0.9375rem] text-text-strong transition hover:bg-surface-muted'

  return (
    <div
      id={`izoh-${x.id}`}
      onTouchStart={(e) => {
        const b = e.touches[0]
        tegish.current = { x: b.clientX, y: b.clientY, gorizontal: null }
      }}
      onTouchMove={(e) => {
        const s = tegish.current
        if (!s) return
        const b = e.touches[0]
        const dx = b.clientX - s.x
        const dy = b.clientY - s.y
        // Yo'nalish birinchi siljishda aniqlanadi: tik bo'lsa — oddiy aylantirish
        if (s.gorizontal === null && Math.abs(dx) + Math.abs(dy) > 8) {
          s.gorizontal = Math.abs(dx) > Math.abs(dy) * 1.5
        }
        if (s.gorizontal) setSurish(Math.max(-80, Math.min(0, dx)))
      }}
      onTouchEnd={() => {
        if (surish <= -SURISH_CHEGARASI) javobBer()
        setSurish(0)
        tegish.current = null
      }}
      onTouchCancel={() => {
        setSurish(0)
        tegish.current = null
      }}
      className={`relative -mx-2 flex items-end gap-2 rounded-xl px-2 transition-colors duration-700 ${
        yongan ? 'bg-brand-primary/15' : ''
      } ${meniki ? 'justify-end pl-14' : 'justify-start pr-14'}`}
    >
      {/* Surilganda o'ng chetda chiqadigan "javob" belgisi */}
      {surish < 0 && (
        <span
          aria-hidden
          className="absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-brand-primary/75 text-white transition-transform"
          style={{ transform: `translateY(-50%) scale(${Math.min(1, -surish / SURISH_CHEGARASI)})` }}
        >
          <Reply className="size-4" />
        </span>
      )}
      {!meniki && (
        <span className="w-8 shrink-0">{oxirgi && <Avatar ism={ism} kalit={kalit} katta />}</span>
      )}
      <div
        ref={pufak}
        // Xabarni bosish (yoki uzoq bosish) — reaksiya tanlovi; ichidagi
        // havola, tugma va pleyerlar o'z ishini qiladi
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a,button,audio,video')) return
          setTanlov((v) => !v)
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          setTanlov(true)
        }}
        className={`group relative min-w-0 max-w-full cursor-pointer rounded-2xl px-3 py-1.5 text-text-strong shadow-sm select-text sm:max-w-[80%] ${burchak} ${
          meniki ? '' : 'bg-surface'
        }`}
        style={{
          ...(meniki ? { backgroundColor: MENIKI_FON } : null),
          transform: surish ? `translateX(${surish}px)` : undefined,
          transition: surish ? 'none' : 'transform 0.2s',
        }}
      >
        {tanlov && (
          // Telegram'dagidek: reaksiyalar ustida, amallar menyusi ostida
          <div
            role="menu"
            aria-label={t('tk.javobBerish')}
            className={`absolute top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl bg-surface py-1 shadow-float ${
              meniki ? 'right-0' : 'left-0'
            }`}
          >
            <button type="button" role="menuitem" onClick={javobBer} className={MENYU_BAND}>
              <Reply className="size-5 text-text-muted" aria-hidden />
              {t('tk.javobBerish')}
            </button>
            {x.matn && (
              <button type="button" role="menuitem" onClick={nusxala} className={MENYU_BAND}>
                <Copy className="size-5 text-text-muted" aria-hidden />
                {t('tk.matnNusxalash')}
              </button>
            )}
            {meniki && onlayn && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setTanlov(false)
                  ochirish.mutate(x)
                }}
                className={`${MENYU_BAND} text-danger`}
              >
                <Trash2 className="size-5" aria-hidden />
                {t('umumiy.ochirish')}
              </button>
            )}
          </div>
        )}
        {tanlov && (
          <div
            role="menu"
            aria-label={t('tk.reaksiyaQoshish')}
            className={`absolute bottom-full z-20 mb-1.5 flex gap-0.5 rounded-full bg-surface p-1 shadow-float ${
              meniki ? 'right-0' : 'left-0'
            }`}
          >
            {REAKSIYALAR.map((r, i) => (
              <TanlovEmojisi
                key={r.tur}
                r={r}
                tartib={i}
                tanlangan={meningReaksiyam === r.tur}
                yorliq={t(r.kalit)}
                onClick={() => bos(r.tur)}
              />
            ))}
          </div>
        )}

        {!meniki && birinchi && (
          <p className="text-sm font-semibold" style={{ color: avatarRangi(kalit) }}>
            {ism}
          </p>
        )}

        {/* Qaysi xabarga javob — bosilsa asl xabarga o'tadi */}
        {asl !== undefined &&
          (asl ? (
            <button
              type="button"
              onClick={() => aslgaOt(asl.id)}
              className="mt-0.5 mb-1 flex min-h-0 w-full max-w-full"
            >
              <Iqtibos
                ism={aslIsmi(asl)}
                matn={qisqaMatn(asl, t)}
                rang={iqtibosRangi(asl.muallif_id === menId, kalit)}
              />
            </button>
          ) : (
            <span className="mt-0.5 mb-1 flex">
              <Iqtibos ism="" matn={t('tk.xabarOchirilgan')} rang="var(--text-faint)" />
            </span>
          ))}

        {x.fayl_yoli && rasm && havola && (
          <a href={havola} target="_blank" rel="noopener noreferrer" className="my-1 block">
            {/* eslint-disable-next-line @next/next/no-img-element -- imzolangan vaqtinchalik havola */}
            <img
              src={havola}
              alt={x.fayl_nomi ?? ''}
              className="max-h-72 w-full rounded-xl object-cover"
            />
          </a>
        )}
        {x.fayl_yoli && video && havola && (
          <video src={havola} controls className="my-1 max-h-72 w-full rounded-xl" />
        )}
        {x.fayl_yoli && ovoz && havola && (
          <audio src={havola} controls className="my-1 h-10 w-64 max-w-full" />
        )}
        {x.fayl_yoli && !rasm && !video && !ovoz && (
          <a
            href={havola ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="my-1 flex items-center gap-2.5 rounded-xl bg-black/5 px-3 py-2"
          >
            <FileText className="size-6 shrink-0 text-brand-onsoft" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[0.9375rem] font-medium">{x.fayl_nomi}</span>
              <span className="block text-xs text-text-faint">{hajm(x.fayl_hajmi)}</span>
            </span>
          </a>
        )}

        {/* Vaqt matn oxirida, o'ng pastda (Telegram kabi) */}
        <div className="flex flex-wrap items-end justify-end gap-x-2">
          {x.matn && (
            <p className="mr-auto min-w-0 text-[0.9375rem] leading-relaxed break-words whitespace-pre-wrap">
              {x.matn}
            </p>
          )}
          <span className="flex shrink-0 items-center gap-1.5 pb-0.5 text-[11px] text-text-faint">
            <button
              type="button"
              onClick={javobBer}
              aria-label={t('tk.javobBerish')}
              title={t('tk.javobBerish')}
              className="hidden min-h-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100 md:block"
            >
              <Reply className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setTanlov((v) => !v)}
              aria-label={t('tk.reaksiyaQoshish')}
              title={t('tk.reaksiyaQoshish')}
              className="hidden min-h-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100 md:block"
            >
              <SmilePlus className="size-3.5" aria-hidden />
            </button>
            {meniki && (
              <button
                type="button"
                onClick={() => ochirish.mutate(x)}
                disabled={!onlayn}
                aria-label={t('umumiy.ochirish')}
                className="min-h-0 rounded p-0.5 opacity-0 transition group-hover:opacity-100 focus:opacity-100 disabled:hidden"
              >
                <Trash2 className="size-3.5" aria-hidden />
              </button>
            )}
            {soatMatni(x.created_at)}
          </span>
        </div>

        {/* Reaksiyalar — Telegram'dagidek xabar ostida, soni bilan */}
        {sanoq.length > 0 && (
          <div className="mt-1 mb-0.5 flex flex-wrap gap-1">
            {sanoq.map((r) => {
              const tanlangan = meningReaksiyam === r.tur
              return (
                <button
                  key={r.tur}
                  type="button"
                  onClick={() => bos(r.tur)}
                  disabled={!onlayn}
                  aria-pressed={tanlangan}
                  aria-label={`${t(r.kalit)}: ${r.son}`}
                  className={`flex min-h-0 items-center gap-1 rounded-full py-0.5 pr-2 pl-1.5 text-sm font-semibold transition ${
                    tanlangan ? 'bg-brand-primary text-white' : 'bg-brand-soft text-brand-onsoft hover:brightness-95'
                  }`}
                >
                  <Emoji r={r} jonli={jonlanayotgan === r.tur} className="size-5" />
                  {r.son}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/** Ovoz yozish: MediaRecorder. Ruxsat bo'lmasa — sababini aytamiz. */
function useOvozYozish(tayyor: (fayl: File) => void) {
  const [yozilmoqda, setYozilmoqda] = useState(false)
  const [soniya, setSoniya] = useState(0)
  const yozuvchi = useRef<MediaRecorder | null>(null)
  const bekorQilindi = useRef(false)
  const taymer = useRef<number | null>(null)

  async function boshla(): Promise<boolean> {
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return false
    let oqim: MediaStream
    try {
      oqim = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      return false
    }
    const tur = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find(
      (x) => MediaRecorder.isTypeSupported?.(x)
    )
    const r = new MediaRecorder(oqim, tur ? { mimeType: tur } : undefined)
    const bolaklar: Blob[] = []
    bekorQilindi.current = false
    r.ondataavailable = (e) => e.data.size > 0 && bolaklar.push(e.data)
    r.onstop = () => {
      oqim.getTracks().forEach((tr) => tr.stop())
      if (taymer.current) window.clearInterval(taymer.current)
      setYozilmoqda(false)
      if (bekorQilindi.current || bolaklar.length === 0) return
      const mime = (r.mimeType || 'audio/webm').split(';')[0]
      const kengaytma = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm'
      tayyor(new File(bolaklar, `ovoz-${Date.now()}.${kengaytma}`, { type: mime }))
    }
    r.start()
    yozuvchi.current = r
    setSoniya(0)
    setYozilmoqda(true)
    taymer.current = window.setInterval(() => {
      setSoniya((s) => {
        // 5 daqiqadan uzun ovoz — avtomatik to'xtaydi (fayl hajmi chegarasi)
        if (s + 1 >= 300) yozuvchi.current?.stop()
        return s + 1
      })
    }, 1000)
    return true
  }

  function toxtat() {
    yozuvchi.current?.stop()
  }
  function bekor() {
    bekorQilindi.current = true
    yozuvchi.current?.stop()
  }
  return { yozilmoqda, soniya, boshla, toxtat, bekor }
}

/** Katta yumaloq tugma (mikrofon / yuborish) — Telegram'dagidek maydondan tashqarida */
const DOIRA_TUGMA =
  'flex size-12 min-h-0 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white shadow-card transition hover:bg-brand-primary-hover active:scale-95 disabled:opacity-40'

/** Xabar yozish maydoni: matn, fayl/rasm, ovozli xabar */
export function ChatYozuvchi({
  topshiriqId,
  javob,
  javobIsm,
  javobKalit,
  javobMeniki,
  javobBekor,
}: {
  topshiriqId: string
  /** Qaysi xabarga javob yozilyapti (Reply) */
  javob: TopshiriqIzohi | null
  javobIsm: string
  /** Iqtibos rangi uchun — ikkinchi tomon kaliti */
  javobKalit: string
  javobMeniki: boolean
  javobBekor: () => void
}) {
  const t = useT()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const qoshish = useIzohQoshish(topshiriqId)
  const [matn, setMatn] = useState('')
  const [fayl, setFayl] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const maydon = useRef<HTMLTextAreaElement>(null)

  // "Javob berish" bosilganda — darhol yozishga tayyor
  useEffect(() => {
    if (javob) maydon.current?.focus()
  }, [javob])

  async function yubor(f: File | null = fayl, m = matn) {
    if ((!m.trim() && !f) || qoshish.isPending) return
    try {
      await qoshish.mutateAsync({ matn: m, fayl: f, javobId: javob?.id ?? null })
      setMatn('')
      setFayl(null)
      javobBekor()
    } catch (e) {
      korsat({
        matn: e instanceof Error && e.message === 'fayl-katta' ? t('tj.faylKatta') : t('umumiy.bajarilmadi'),
        tone: 'xato',
      })
    }
  }

  const ovoz = useOvozYozish((f) => yubor(f, ''))

  if (ovoz.yozilmoqda) {
    return (
      <div className="flex items-end gap-2">
        <div className="flex min-h-12 flex-1 items-center gap-2 rounded-3xl bg-surface px-1.5 shadow-card">
          <button
            type="button"
            onClick={ovoz.bekor}
            aria-label={t('umumiy.bekor')}
            className="flex size-10 min-h-0 items-center justify-center rounded-full text-danger transition hover:bg-danger-soft"
          >
            <Trash2 className="size-5" aria-hidden />
          </button>
          <span className="flex flex-1 items-center gap-2 text-[0.9375rem] text-text-strong">
            <span className="size-2.5 animate-pulse rounded-full bg-danger" aria-hidden />
            {t('tk.ovozYozilmoqda')} {Math.floor(ovoz.soniya / 60)}:
            {String(ovoz.soniya % 60).padStart(2, '0')}
          </span>
        </div>
        <button type="button" onClick={ovoz.toxtat} aria-label={t('topshiriq.yubor')} className={DOIRA_TUGMA}>
          <Send className="size-5" aria-hidden />
        </button>
      </div>
    )
  }

  const bosh = !matn.trim() && !fayl
  return (
    <div className="flex items-end gap-2">
      <div className="min-w-0 flex-1 rounded-3xl bg-surface shadow-card">
        {javob && (
          <div className="flex items-center gap-2 pt-2 pr-1 pl-3">
            <Reply className="size-5 shrink-0 text-brand-accent" aria-hidden />
            <span className="flex min-w-0 flex-1">
              <Iqtibos
                ism={t('tk.javobKimga', { kim: javobIsm })}
                matn={qisqaMatn(javob, t)}
                rang={iqtibosRangi(javobMeniki, javobKalit)}
              />
            </span>
            <button
              type="button"
              onClick={javobBekor}
              aria-label={t('tk.javobBekor')}
              title={t('tk.javobBekor')}
              className="flex size-9 min-h-0 shrink-0 items-center justify-center rounded-full text-text-faint transition hover:bg-surface-muted hover:text-text-strong"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
        {fayl && (
          <div className="mx-2 mt-2 flex items-center gap-2 rounded-2xl bg-surface-muted px-3 py-2 text-sm">
            <FileText className="size-5 shrink-0 text-brand-onsoft" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{fayl.name}</span>
            <span className="shrink-0 text-xs text-text-faint">{hajm(fayl.size)}</span>
            <button
              type="button"
              onClick={() => setFayl(null)}
              aria-label={t('umumiy.bekor')}
              className="min-h-0 rounded p-1 text-text-faint hover:text-danger"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
        <div className="flex items-end">
          <div className="min-w-0 flex-1 pl-4">
            <OsuvchiMaydon
              qiymat={matn}
              onChange={setMatn}
              onEnter={() => yubor()}
              onEscape={javob ? javobBekor : undefined}
              maydonRef={maydon}
              placeholder={onlayn ? t('tk.xabarJoy') : t('tj.offlineIzoh')}
              ariaLabel={t('tk.xabarJoy')}
              maxLength={4000}
              engKattaBalandlik={160}
              className="min-h-12 py-3 text-[0.9375rem] leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
            />
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={!onlayn}
            aria-label={t('tj.faylBiriktirish')}
            title={t('tk.mediaFayl')}
            className="flex size-12 min-h-0 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:text-brand-onsoft disabled:opacity-40"
          >
            <Paperclip className="size-5" aria-hidden />
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null
            e.target.value = ''
            if (f && f.size > FAYL_CHEGARASI) {
              korsat({ matn: t('tj.faylKatta'), tone: 'xato' })
              return
            }
            setFayl(f)
          }}
        />
      </div>
      {bosh ? (
        <button
          type="button"
          disabled={!onlayn}
          onClick={async () => {
            const boldi = await ovoz.boshla()
            if (!boldi) korsat({ matn: t('tk.mikrofonYoq'), tone: 'xato' })
          }}
          aria-label={t('tk.ovozliXabar')}
          title={t('tk.ovozliXabar')}
          className={DOIRA_TUGMA}
        >
          <Mic className="size-5" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => yubor()}
          disabled={!onlayn || qoshish.isPending}
          aria-label={t('topshiriq.yubor')}
          className={DOIRA_TUGMA}
        >
          {qoshish.isPending ? <Square className="size-4 animate-pulse" aria-hidden /> : <Send className="size-5" aria-hidden />}
        </button>
      )}
    </div>
  )
}
