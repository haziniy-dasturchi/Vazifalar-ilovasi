'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
 * ikkinchi tomon; kunlar ajratgich bilan; holat o'zgarishlari markazda
 * kichik yozuv bo'lib — "kim, qachon, nima qildi" chatning o'zida.
 */
export function ChatXabarlari({
  xabarlar,
  tarix,
  qarshiIsm,
}: {
  xabarlar: TopshiriqIzohi[]
  tarix: TopshiriqHodisasi[]
  qarshiIsm: string
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

  let oldingiKun = ''
  return (
    <div className="space-y-2">
      {yozuvlar.length === 0 && (
        <p className="py-10 text-center text-base text-text-faint">{t('tk.chatBosh')}</p>
      )}
      {yozuvlar.map((y) => {
        const kun = mahalliyKun(y.vaqt)
        const ajratgich = kun !== oldingiKun
        oldingiKun = kun
        return (
          <div key={y.tur === 'hodisa' ? `h${y.h.id}` : `x${y.x.id}`}>
            {ajratgich && (
              <div className="my-3 flex justify-center">
                <span className="rounded-full bg-surface-sunken px-3 py-1 text-sm font-medium text-text-muted">
                  {toliqSana(kun)}
                </span>
              </div>
            )}
            {y.tur === 'hodisa' ? (
              <div className="flex justify-center px-6">
                <span className="text-center text-sm text-text-faint">
                  <b className="font-semibold text-text-muted">{kim(y.h.kim_id)}</b>{' '}
                  {t(HODISA[y.h.hodisa] ?? 'tk.hodisa.ozgardi')}
                  {y.h.izoh ? `: “${y.h.izoh}”` : ''} · {soatMatni(y.h.created_at)}
                </span>
              </div>
            ) : (
              <XabarPufagi x={y.x} meniki={y.x.muallif_id === menId} ism={kim(y.x.muallif_id)} />
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

function XabarPufagi({ x, meniki, ism }: { x: TopshiriqIzohi; meniki: boolean; ism: string }) {
  const t = useT()
  const onlayn = useOnlaynmi()
  const ochirish = useIzohOchirish(x.topshiriq_id)
  const turi = x.fayl_turi ?? ''
  const rasm = turi.startsWith('image/')
  const video = turi.startsWith('video/')
  const ovoz = turi.startsWith('audio/')
  const { data: havola } = useHavola(x.fayl_yoli)

  return (
    <div className={`flex ${meniki ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`group max-w-[85%] rounded-2xl px-3.5 py-2 shadow-sm sm:max-w-[70%] ${
          meniki
            ? 'rounded-br-md bg-brand-primary text-white'
            : 'rounded-bl-md bg-surface text-text-strong'
        }`}
      >
        {!meniki && <p className="mb-0.5 text-sm font-semibold text-brand-onsoft">{ism}</p>}

        {x.fayl_yoli && rasm && havola && (
          <a href={havola} target="_blank" rel="noopener noreferrer" className="mb-1 block">
            {/* eslint-disable-next-line @next/next/no-img-element -- imzolangan vaqtinchalik havola */}
            <img
              src={havola}
              alt={x.fayl_nomi ?? ''}
              className="max-h-72 w-full rounded-xl object-cover"
            />
          </a>
        )}
        {x.fayl_yoli && video && havola && (
          <video src={havola} controls className="mb-1 max-h-72 w-full rounded-xl" />
        )}
        {x.fayl_yoli && ovoz && havola && (
          <audio src={havola} controls className="mb-1 h-10 w-64 max-w-full" />
        )}
        {x.fayl_yoli && !rasm && !video && !ovoz && (
          <a
            href={havola ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`mb-1 flex items-center gap-2.5 rounded-xl px-3 py-2 ${
              meniki ? 'bg-white/15' : 'bg-surface-muted'
            }`}
          >
            <FileText className="size-6 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-base font-medium">{x.fayl_nomi}</span>
              <span className={`block text-sm ${meniki ? 'text-white/70' : 'text-text-faint'}`}>
                {hajm(x.fayl_hajmi)}
              </span>
            </span>
          </a>
        )}

        {x.matn && <p className="text-base leading-relaxed whitespace-pre-wrap">{x.matn}</p>}

        <div className={`mt-0.5 flex items-center justify-end gap-2 text-xs ${meniki ? 'text-white/70' : 'text-text-faint'}`}>
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
      <div className="flex items-center gap-3 rounded-2xl bg-surface p-2 shadow-card">
        <button
          type="button"
          onClick={ovoz.bekor}
          aria-label={t('umumiy.bekor')}
          className="flex size-11 min-h-0 items-center justify-center rounded-full text-danger transition hover:bg-danger-soft"
        >
          <Trash2 className="size-5" aria-hidden />
        </button>
        <span className="flex flex-1 items-center gap-2 text-base text-text-strong">
          <span className="size-3 animate-pulse rounded-full bg-danger" aria-hidden />
          {t('tk.ovozYozilmoqda')} {Math.floor(ovoz.soniya / 60)}:
          {String(ovoz.soniya % 60).padStart(2, '0')}
        </span>
        <button
          type="button"
          onClick={ovoz.toxtat}
          aria-label={t('topshiriq.yubor')}
          className="flex size-11 min-h-0 items-center justify-center rounded-full bg-brand-primary text-white transition hover:bg-brand-primary-hover"
        >
          <Send className="size-5" aria-hidden />
        </button>
      </div>
    )
  }

  const bosh = !matn.trim() && !fayl
  return (
    <div className="rounded-2xl bg-surface p-2 shadow-card">
      {fayl && (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-base">
          <FileText className="size-5 shrink-0 text-brand-onsoft" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{fayl.name}</span>
          <span className="shrink-0 text-sm text-text-faint">{hajm(fayl.size)}</span>
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
      <div className="flex items-end gap-1">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={!onlayn}
          aria-label={t('tj.faylBiriktirish')}
          title={t('tk.mediaFayl')}
          className="flex size-11 min-h-0 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
        >
          <Paperclip className="size-5" aria-hidden />
        </button>
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
        <div className="min-w-0 flex-1">
          <OsuvchiMaydon
            qiymat={matn}
            onChange={setMatn}
            onEnter={() => yubor()}
            placeholder={onlayn ? t('tk.xabarJoy') : t('tj.offlineIzoh')}
            ariaLabel={t('tk.xabarJoy')}
            maxLength={4000}
            engKattaBalandlik={160}
            className="min-h-11 px-2 py-2.5 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
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
            className="flex size-11 min-h-0 shrink-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
          >
            <Mic className="size-5" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => yubor()}
            disabled={!onlayn || qoshish.isPending}
            aria-label={t('topshiriq.yubor')}
            className="flex size-11 min-h-0 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
          >
            {qoshish.isPending ? <Square className="size-4 animate-pulse" aria-hidden /> : <Send className="size-5" aria-hidden />}
          </button>
        )}
      </div>
    </div>
  )
}
