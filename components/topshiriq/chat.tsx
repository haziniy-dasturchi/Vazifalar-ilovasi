'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  FileText,
  Mic,
  Paperclip,
  Send,
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
} from '@/lib/queries/topshiriq-jamoa'
import { useOnlaynmi } from '@/lib/queries/topshiriqlar'
import { toliqSana } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'
import type { TopshiriqHodisasi, TopshiriqIzohi } from '@/types/vazifalar'
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
}: {
  xabarlar: TopshiriqIzohi[]
  tarix: TopshiriqHodisasi[]
  qarshiIsm: string
  qarshiKalit: string
}) {
  const t = useT()
  const { id: menId } = useFoydalanuvchi()
  const oxiri = useRef<HTMLDivElement>(null)

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
}: {
  x: TopshiriqIzohi
  meniki: boolean
  ism: string
  /** Ikkinchi tomon avatari va ismining rangi uchun */
  kalit: string
  birinchi: boolean
  oxirgi: boolean
}) {
  const t = useT()
  const onlayn = useOnlaynmi()
  const ochirish = useIzohOchirish(x.topshiriq_id)
  const turi = x.fayl_turi ?? ''
  const rasm = turi.startsWith('image/')
  const video = turi.startsWith('video/')
  const ovoz = turi.startsWith('audio/')
  const { data: havola } = useHavola(x.fayl_yoli)

  // "Dum" faqat guruhdagi oxirgi pufakda — avatar tomonga qaragan burchak
  const burchak = oxirgi ? (meniki ? 'rounded-br-md' : 'rounded-bl-md') : ''

  return (
    <div className={`flex items-end gap-2 ${meniki ? 'justify-end pl-12' : 'justify-start pr-12'}`}>
      {!meniki && (
        <span className="w-8 shrink-0">{oxirgi && <Avatar ism={ism} kalit={kalit} katta />}</span>
      )}
      <div
        className={`group min-w-0 max-w-full rounded-2xl px-3 py-1.5 text-text-strong shadow-sm sm:max-w-[80%] ${burchak} ${
          meniki ? '' : 'bg-surface'
        }`}
        style={meniki ? { backgroundColor: MENIKI_FON } : undefined}
      >
        {!meniki && birinchi && (
          <p className="text-sm font-semibold" style={{ color: avatarRangi(kalit) }}>
            {ism}
          </p>
        )}

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
export function ChatYozuvchi({ topshiriqId }: { topshiriqId: string }) {
  const t = useT()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const qoshish = useIzohQoshish(topshiriqId)
  const [matn, setMatn] = useState('')
  const [fayl, setFayl] = useState<File | null>(null)
  const input = useRef<HTMLInputElement>(null)

  async function yubor(f: File | null = fayl, m = matn) {
    if ((!m.trim() && !f) || qoshish.isPending) return
    try {
      await qoshish.mutateAsync({ matn: m, fayl: f })
      setMatn('')
      setFayl(null)
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
