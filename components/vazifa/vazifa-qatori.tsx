'use client'

import { useState } from 'react'
import {
  Check,
  ChevronRight,
  CornerUpLeft,
  Play,
  Repeat2,
} from 'lucide-react'
import { useVazifaHolati } from '@/lib/queries/vazifalar'
import { HavolaliMatn } from '@/components/ui/havolali-matn'
import { useToast } from '@/components/ui/toast'
import { VazifaOynasi } from '@/components/vazifa/vazifa-oynasi'
import { SuvDoira } from '@/components/vazifa/foiz-tanlagich'
import { MUHIMLIK_NOMI, MUHIMLIK_RANGI } from '@/lib/papka-stillari'
import {
  kechikishMatni,
  kechikkanmi,
  sanaMatni,
  vaqtHolati,
  vaqtMatni,
  type VaqtHolati,
} from '@/lib/sana'
import { eskidanRrule, takrorMatni, vazifaningKeyingiSanasi } from '@/lib/takrorlanish'
import { useT } from '@/components/app/til-provayder'
import type { Task } from '@/types/vazifalar'

/** Vaqt holatiga qarab rang: o'tgan — qizil, yaqin — sariq, kelgusi — yashil */
const VAQT_RANGI: Record<VaqtHolati, string> = {
  otgan: 'text-danger',
  hozir: 'text-amber-600',
  kelgusi: 'text-emerald-600',
}

export function VazifaQatori({
  vazifa,
  subtasklar = [],
  papkaNomi,
  papkaRangi,
  bolimNomi,
  qaytarishMumkinEmas = false,
}: {
  vazifa: Task
  subtasklar?: Task[]
  papkaNomi?: string
  papkaRangi?: string
  /** Papka ichidagi bo'lim (Loyihalar papkasida — loyiha nomi) */
  bolimNomi?: string
  /**
   * Takrorlanuvchi vazifa allaqachon keyingi sanaga ko'chib ketgan —
   * bazadagi haqiqiy holati endi "done" emas, shuning uchun "rejaga
   * qaytarish" so'rovi serverda xatolik beradi. Shu holatda doira
   * faqat ko'rsatish uchun, bosilmaydi.
   */
  qaytarishMumkinEmas?: boolean
}) {
  const t = useT()
  const holat = useVazifaHolati()
  const { korsat } = useToast()
  const [ochiq, setOchiq] = useState(false)
  const [tahrirOchiq, setTahrirOchiq] = useState(false)

  const bajarilgan = vazifa.status === 'done'
  const foiz = vazifa.progress ?? 0
  const jarayonda = vazifa.status === 'in_progress'
  const kechikkan = !bajarilgan && kechikkanmi(vazifa.due_date)
  const ochiqSubtask = subtasklar.filter((s) => s.status !== 'done').length
  // Eski yozuvlarda `rrule` hali bo'sh bo'lishi mumkin
  const takrorQoidasi = vazifa.rrule ?? eskidanRrule(vazifa.recurrence)

  async function harakat(
    tur: 'boshlash' | 'rejaga' | 'bajarish' | 'qaytarish'
  ) {
    try {
      await holat.mutateAsync({
        id: vazifa.id,
        harakat: tur,
        subtasklarBilan: tur === 'bajarish' && ochiqSubtask > 0,
        /*
          Keyingi sana AYNAN SHU PAYTDA hisoblanadi, serverga
          yuborilayotganda emas. Internet yo'q bo'lsa yozuv navbatda
          kunlab turishi mumkin — o'shanda hisoblansa, sana vazifa
          bajarilgan kundan emas, sinxronlashgan kundan chiqardi.
        */
        keyingiSana:
          tur === 'bajarish' ? vazifaningKeyingiSanasi(vazifa) : null,
      })
    } catch {
      korsat({ matn: 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <li>
      <div
        className={`group flex items-start gap-2 rounded-2xl p-2.5 transition sm:gap-3 sm:p-3 ${
          jarayonda
            ? 'border-l-4 border-status-progress-line bg-status-progress'
            : 'bg-surface shadow-card'
        } ${bajarilgan ? 'opacity-55' : ''}`}
      >
        {/* Belgilash doirasi — chegarasi muhimlik rangida, ichi esa
            bajarilgan foizga qarab "suv" bilan to'ladi */}
        <button
          type="button"
          onClick={
            qaytarishMumkinEmas
              ? undefined
              : () => harakat(bajarilgan ? 'qaytarish' : 'bajarish')
          }
          disabled={qaytarishMumkinEmas}
          aria-label={
            bajarilgan
              ? 'Rejaga qaytarish'
              : foiz > 0
                ? `Bajarildi (hozir ${foiz}%)`
                : 'Bajarildi'
          }
          title={MUHIMLIK_NOMI[vazifa.priority]}
          className={`flex size-10 min-h-0 shrink-0 items-center justify-center rounded-full sm:mt-0.5 sm:size-11 ${qaytarishMumkinEmas ? 'cursor-default' : ''}`}
        >
          <SuvDoira
            foiz={foiz}
            bajarilgan={bajarilgan}
            chegaraRangi={MUHIMLIK_RANGI[vazifa.priority]}
            olcham="kichik"
          />
        </button>

        <div
          role="button"
          tabIndex={0}
          onClick={() => setTahrirOchiq(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setTahrirOchiq(true)
            }
          }}
          className="min-w-0 flex-1 cursor-pointer py-1 sm:py-1.5"
        >
          {/* Uzun matn butun ekranni egallab ketmasin: telefonda
              3 qatordan keyin kesiladi (oldin 4 edi va bitta vazifa
              ekranning katta qismini egallardi). To‘lig‘ini ko‘rish
              uchun qatorni bosish kifoya — vazifa oynasi ochiladi. */}
          <p
            className={`line-clamp-3 text-[0.9375rem] leading-snug break-words sm:line-clamp-4 sm:text-base ${
              bajarilgan
                ? 'text-text-muted line-through'
                : 'text-text-strong'
            }`}
          >
            {vazifa.title}
          </p>

          {/* Izoh — bitta qatorda, kichik va xira. Bo'sh bo'lsa
              umuman ko'rinmaydi, shunda qator shishib ketmaydi. */}
          {vazifa.description?.trim() && (
            <p className="mt-0.5 truncate text-xs text-text-faint">
              <HavolaliMatn matn={vazifa.description} toxtat />
            </p>
          )}

          {/*
            Meta ma'lumot ataylab BITTA qatorda va o'ralmaydi.
            Oldin `flex-wrap` edi: loyiha nomi uzun bo'lsa u uch
            qatorga yoyilib, qator balandligini ikki baravar
            oshirib yuborardi (telefonda ayniqsa yomon ko'rinardi).
            Endi sig'magani uch nuqta bilan qisqaradi.
          */}
          <div className="mt-1 flex items-center gap-x-2 overflow-hidden text-xs whitespace-nowrap sm:gap-x-3">
            {vazifa.due_date && (
              <span
                className={`shrink-0 ${kechikkan ? 'font-medium text-danger' : 'text-text-muted'}`}
              >
                {kechikkan
                  ? kechikishMatni(vazifa.due_date)
                  : sanaMatni(vazifa.due_date)}
              </span>
            )}

            {vazifa.due_date && vazifa.due_time && (
              <span
                className={
                  bajarilgan
                    ? 'shrink-0 text-text-muted'
                    : `shrink-0 font-medium ${VAQT_RANGI[vaqtHolati(vazifa.due_date, vazifa.due_time)]}`
                }
              >
                {vaqtMatni(vazifa.due_time)}
              </span>
            )}

            {takrorQoidasi && (
              <span
                className="flex shrink-0 items-center gap-1 text-text-muted"
                title={takrorMatni(takrorQoidasi, t)}
              >
                <Repeat2 className="size-3.5" aria-hidden />
              </span>
            )}

            {papkaNomi && (
              <span
                className="flex min-w-0 items-center gap-1.5 text-text-muted"
                title={bolimNomi ? `${papkaNomi} › ${bolimNomi}` : papkaNomi}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: papkaRangi ?? '#9ca3af' }}
                  aria-hidden
                />
                {/*
                  Ikonka emas, oddiy "›" belgisi: SVG matn ichida
                  turganda uch nuqta (ellipsis) to'g'ri ishlamaydi.
                */}
                <span className="truncate">
                  {papkaNomi}
                  {bolimNomi && (
                    <>
                      <span className="px-1 opacity-60" aria-hidden>
                        ›
                      </span>
                      <span className="font-medium text-text-strong">
                        {bolimNomi}
                      </span>
                    </>
                  )}
                </span>
              </span>
            )}

            {subtasklar.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOchiq((v) => !v)
                }}
                aria-expanded={ochiq}
                className="flex min-h-0 shrink-0 items-center gap-1 rounded-md text-text-muted transition hover:text-brand-onsoft"
              >
                <ChevronRight
                  className={`size-3.5 transition ${ochiq ? 'rotate-90' : ''}`}
                  aria-hidden
                />
                {subtasklar.length - ochiqSubtask}/{subtasklar.length} qadam
              </button>
            )}
          </div>
        </div>

        {/* Holat tugmasi */}
        {!bajarilgan && (
          <button
            type="button"
            onClick={() => harakat(jarayonda ? 'rejaga' : 'boshlash')}
            aria-label={jarayonda ? 'Rejaga qaytarish' : 'Boshlash'}
            className={`flex size-10 min-h-0 shrink-0 items-center justify-center rounded-xl transition sm:size-11 ${
              jarayonda
                ? 'text-status-progress-text hover:bg-amber-200/60'
                : 'text-text-faint hover:bg-surface-muted hover:text-brand-onsoft'
            }`}
          >
            {jarayonda ? (
              <CornerUpLeft className="size-5" aria-hidden />
            ) : (
              <Play className="size-5" aria-hidden />
            )}
          </button>
        )}
      </div>

      {/* Subtasklar */}
      {ochiq && subtasklar.length > 0 && (
        <ul className="mt-2 ml-7 space-y-2 border-l-2 border-border-subtle pl-3">
          {subtasklar.map((s) => (
            <VazifaQatori key={s.id} vazifa={s} />
          ))}
        </ul>
      )}

      {tahrirOchiq && (
        <VazifaOynasi vazifa={vazifa} yop={() => setTahrirOchiq(false)} />
      )}
    </li>
  )
}
