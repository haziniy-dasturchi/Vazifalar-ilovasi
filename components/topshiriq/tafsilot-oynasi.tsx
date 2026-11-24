'use client'

import { useMemo, useRef, useState } from 'react'
import {
  Clock,
  FileText,
  Paperclip,
  Repeat,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
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
  useTakrorniToxtatish,
  useTopshiriqIzohlari,
  useTopshiriqTarixi,
} from '@/lib/queries/topshiriq-jamoa'
import { useOnlaynmi } from '@/lib/queries/topshiriqlar'
import { toliqSana, vaqtMatni } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'
import type {
  Topshiriq,
  TopshiriqHodisasi,
  TopshiriqIzohi,
} from '@/types/vazifalar'

const HODISA_KALITI: Record<string, MatnKaliti> = {
  yuborildi: 'tj.hodisa.yuborildi',
  qabul: 'tj.hodisa.qabul',
  avto_qabul: 'tj.hodisa.avtoQabul',
  rad: 'tj.hodisa.rad',
  tekshiruvda: 'tj.hodisa.tekshiruvda',
  qaytarildi: 'tj.hodisa.qaytarildi',
  qayta_ochildi: 'tj.hodisa.qaytaOchildi',
  tasdiqlandi: 'tj.hodisa.tasdiqlandi',
  bajarildi: 'tj.hodisa.bajarildi',
  kutilmoqda: 'tj.hodisa.kutilmoqda',
}

const TAKROR_KALITI: Record<string, MatnKaliti> = {
  kunlik: 'tj.takror.kunlik',
  haftalik: 'tj.takror.haftalik',
  oylik: 'tj.takror.oylik',
}

function vaqt(iso: string): string {
  const d = new Date(iso)
  return `${toliqSana(iso.slice(0, 10))}, ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}

function hajm(bayt: number | null): string {
  if (!bayt) return ''
  if (bayt < 1024 * 1024) return `${Math.max(1, Math.round(bayt / 1024))} KB`
  return `${(bayt / 1024 / 1024).toFixed(1)} MB`
}

type Yozuv =
  | { tur: 'hodisa'; vaqt: string; h: TopshiriqHodisasi }
  | { tur: 'izoh'; vaqt: string; i: TopshiriqIzohi }

/**
 * Topshiriqning to'liq ko'rinishi: tafsilotlar, o'zgarishlar tarixi
 * va izohlar zanjiri (fayllar bilan) — bitta vaqt chizig'ida.
 *
 * Nega bitta chiziqda: "kim, qachon, nima qildi" savoliga javob
 * izoh va holat o'zgarishini birga ko'rgandagina to'liq bo'ladi
 * ("qaytardi — sababi shu — keyin fayl yubordi — tasdiqladi").
 */
export function TafsilotOynasi({
  topshiriq,
  qarshiIsm,
  yop,
}: {
  topshiriq: Topshiriq
  qarshiIsm: string | null
  yop: () => void
}) {
  const t = useT()
  const { id: menId } = useFoydalanuvchi()
  const supabase = useSupabase()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const meniki = topshiriq.yuboruvchi_id === menId

  const { data: izohlar = [] } = useTopshiriqIzohlari(topshiriq.id)
  const { data: tarix = [] } = useTopshiriqTarixi(topshiriq.id)
  const qoshish = useIzohQoshish(topshiriq.id)
  const ochirish = useIzohOchirish(topshiriq.id)
  const takrorToxtat = useTakrorniToxtatish()

  const [matn, setMatn] = useState('')
  const [fayl, setFayl] = useState<File | null>(null)
  const faylInput = useRef<HTMLInputElement>(null)

  const chiziq = useMemo<Yozuv[]>(() => {
    const r: Yozuv[] = [
      ...tarix.map((h) => ({ tur: 'hodisa' as const, vaqt: h.created_at, h })),
      ...izohlar.map((i) => ({ tur: 'izoh' as const, vaqt: i.created_at, i })),
    ]
    return r.sort((a, b) => a.vaqt.localeCompare(b.vaqt))
  }, [tarix, izohlar])

  const kim = (id: string | null) =>
    id === menId ? t('tj.siz') : (qarshiIsm ?? t('tj.ikkinchiTomon'))

  async function yubor() {
    if ((!matn.trim() && !fayl) || qoshish.isPending) return
    try {
      await qoshish.mutateAsync({ matn, fayl })
      setMatn('')
      setFayl(null)
    } catch (e) {
      korsat({
        matn:
          e instanceof Error && e.message === 'fayl-katta'
            ? t('tj.faylKatta')
            : t('umumiy.bajarilmadi'),
        tone: 'xato',
      })
    }
  }

  async function faylniOch(yol: string) {
    try {
      const havola = await faylHavolasi(supabase, yol)
      window.open(havola, '_blank', 'noopener')
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <Oyna sarlavha={topshiriq.sarlavha} yop={yop} kenglik="keng">
      {/* Asosiy ma'lumotlar */}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-text-faint">{meniki ? t('tj.kimga') : t('tj.kimdan')}</dt>
        <dd className="min-w-0 truncate font-medium text-text-strong">
          {qarshiIsm ?? topshiriq.qabul_qiluvchi_email}
        </dd>
        {topshiriq.muddat && (
          <>
            <dt className="text-text-faint">{t('topshiriq.muddat')}</dt>
            <dd className="text-text-strong">
              {toliqSana(topshiriq.muddat)}
              {topshiriq.muddat_vaqt ? `, ${vaqtMatni(topshiriq.muddat_vaqt)}` : ''}
            </dd>
          </>
        )}
        {topshiriq.takror && (
          <>
            <dt className="text-text-faint">{t('tj.takrorlanadi')}</dt>
            <dd className="flex flex-wrap items-center gap-2 text-text-strong">
              <Repeat className="size-3.5" aria-hidden />
              {t(TAKROR_KALITI[topshiriq.takror])}
              {meniki && (
                <button
                  type="button"
                  disabled={!onlayn || takrorToxtat.isPending}
                  onClick={async () => {
                    try {
                      await takrorToxtat.mutateAsync(topshiriq.id)
                      korsat({ matn: t('tj.takrorToxtadi'), tone: 'muvaffaqiyat' })
                    } catch {
                      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
                    }
                  }}
                  className="min-h-0 rounded-lg border border-border-subtle px-2 py-0.5 text-xs font-medium text-text-muted transition hover:bg-surface-muted disabled:opacity-50"
                >
                  {t('tj.takrorniToxtatish')}
                </button>
              )}
            </dd>
          </>
        )}
        {topshiriq.baho != null && (
          <>
            <dt className="text-text-faint">{t('tj.baho')}</dt>
            <dd>
              <Yulduzlar qiymat={topshiriq.baho} />
            </dd>
          </>
        )}
      </dl>

      {topshiriq.izoh && (
        <p className="mt-3 rounded-xl bg-surface-muted px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-text-strong">
          {topshiriq.izoh}
        </p>
      )}

      {/* Vaqt chizig'i */}
      <h3 className="mt-5 mb-2 text-sm font-semibold text-text-muted">
        {t('tj.faoliyat')}
      </h3>
      <ol className="space-y-2.5">
        {chiziq.map((y) =>
          y.tur === 'hodisa' ? (
            <li key={`h${y.h.id}`} className="flex gap-2 text-xs text-text-faint">
              <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="min-w-0">
                <span className="font-medium text-text-muted">{kim(y.h.kim_id)}</span>{' '}
                {t(HODISA_KALITI[y.h.hodisa] ?? 'tj.hodisa.ozgardi')}
                {y.h.izoh ? ` — “${y.h.izoh}”` : ''}
                <span className="ml-1.5 whitespace-nowrap">· {vaqt(y.h.created_at)}</span>
              </span>
            </li>
          ) : (
            <li
              key={`i${y.i.id}`}
              className={`flex ${y.i.muallif_id === menId ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`group max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  y.i.muallif_id === menId
                    ? 'bg-brand-soft text-text-strong'
                    : 'bg-surface-muted text-text-strong'
                }`}
              >
                <p className="mb-0.5 text-[11px] font-semibold text-text-muted">
                  {kim(y.i.muallif_id)} · {vaqt(y.i.created_at)}
                </p>
                {y.i.matn && (
                  <p className="leading-relaxed whitespace-pre-wrap">{y.i.matn}</p>
                )}
                {y.i.fayl_yoli && (
                  <button
                    type="button"
                    onClick={() => faylniOch(y.i.fayl_yoli!)}
                    className="mt-1 flex max-w-full min-h-0 items-center gap-2 rounded-lg border border-border-subtle bg-surface px-2.5 py-1.5 text-left text-xs transition hover:bg-surface-muted"
                  >
                    <FileText className="size-4 shrink-0 text-brand-onsoft" aria-hidden />
                    <span className="min-w-0 truncate font-medium">{y.i.fayl_nomi}</span>
                    <span className="shrink-0 text-text-faint">{hajm(y.i.fayl_hajmi)}</span>
                  </button>
                )}
                {y.i.muallif_id === menId && (
                  <button
                    type="button"
                    onClick={() => ochirish.mutate(y.i)}
                    disabled={!onlayn}
                    aria-label={t('umumiy.ochirish')}
                    className="mt-1 flex min-h-0 items-center gap-1 text-[11px] text-text-faint opacity-70 transition hover:text-danger disabled:opacity-40"
                  >
                    <Trash2 className="size-3" aria-hidden />
                    {t('umumiy.ochirish')}
                  </button>
                )}
              </div>
            </li>
          )
        )}
        {chiziq.length === 0 && (
          <li className="text-xs text-text-faint">{t('tj.faoliyatBosh')}</li>
        )}
      </ol>

      {/* Izoh yozish */}
      <div className="mt-4 rounded-2xl border border-border-control bg-surface p-2">
        {fayl && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs">
            <FileText className="size-4 shrink-0 text-brand-onsoft" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{fayl.name}</span>
            <span className="shrink-0 text-text-faint">{hajm(fayl.size)}</span>
            <button
              type="button"
              onClick={() => setFayl(null)}
              aria-label={t('umumiy.bekor')}
              className="min-h-0 rounded p-0.5 text-text-faint hover:text-danger"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        )}
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={() => faylInput.current?.click()}
            disabled={!onlayn}
            aria-label={t('tj.faylBiriktirish')}
            title={t('tj.faylBiriktirish')}
            className="flex size-10 min-h-0 shrink-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-muted disabled:opacity-40"
          >
            <Paperclip className="size-5" aria-hidden />
          </button>
          <input
            ref={faylInput}
            type="file"
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
              onEnter={yubor}
              placeholder={onlayn ? t('tj.izohJoy') : t('tj.offlineIzoh')}
              ariaLabel={t('tj.izohJoy')}
              maxLength={4000}
              engKattaBalandlik={140}
              className="min-h-10 rounded-xl px-2 py-2 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
            />
          </div>
          <button
            type="button"
            onClick={yubor}
            disabled={!onlayn || qoshish.isPending || (!matn.trim() && !fayl)}
            aria-label={t('topshiriq.yubor')}
            className="flex size-10 min-h-0 shrink-0 items-center justify-center rounded-xl bg-brand-primary text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
          >
            <Send className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </Oyna>
  )
}

export function Yulduzlar({
  qiymat,
  ozgartir,
}: {
  qiymat: number
  ozgartir?: (b: number) => void
}) {
  const t = useT()
  return (
    <span className="inline-flex items-center gap-0.5" role={ozgartir ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) =>
        ozgartir ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={qiymat === n}
            aria-label={t('tj.yulduz', { son: n })}
            onClick={() => ozgartir(qiymat === n ? 0 : n)}
            className="min-h-0 p-1"
          >
            <Star
              className={`size-7 ${n <= qiymat ? 'fill-amber-400 text-amber-400' : 'text-text-faint'}`}
              aria-hidden
            />
          </button>
        ) : (
          <Star
            key={n}
            className={`size-4 ${n <= qiymat ? 'fill-amber-400 text-amber-400' : 'text-text-faint'}`}
            aria-hidden
          />
        )
      )}
    </span>
  )
}
