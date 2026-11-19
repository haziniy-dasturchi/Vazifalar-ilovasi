'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tanlagich } from '@/components/ui/tanlagich'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useVazifaYaratish } from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import type { Recurrence, TaskPriority } from '@/types/vazifalar'

/**
 * Bo'lim oxiridagi "+ Vazifa qo'shish".
 *
 * Oldin faqat sarlavha so'rardi va sana, papka yoki muhimlikni
 * qo'yish uchun vazifani qo'shib, keyin uni ochib tahrirlash kerak
 * bo'lardi — ya'ni "tezkor" qo'shish aslida uzunroq yo'l edi.
 * Endi o'sha qatorning o'zida hammasi bor; oyna ochilmaydi.
 */
export function InlineQoshish({
  papkaId,
  bolimId = null,
  otaId = null,
  matn,
}: {
  papkaId: string
  bolimId?: string | null
  otaId?: string | null
  matn?: string
}) {
  const t = useT()
  const [ochiq, setOchiq] = useState(false)
  const [sarlavha, setSarlavha] = useState('')
  const [sana, setSana] = useState<string | null>(null)
  const [vaqt, setVaqt] = useState<string | null>(null)
  const [takrorlanish, setTakrorlanish] = useState<Recurrence | null>(null)
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(4)
  const [tanlanganPapka, setTanlanganPapka] = useState(papkaId)

  const yaratish = useVazifaYaratish()
  const { data: papkalar } = useFaolPapkalar()
  const { korsat } = useToast()

  // Subtask doim ota-vazifa papkasida qoladi — papkani tanlash
  // faqat mustaqil vazifa uchun ma'noga ega
  const papkaniTanlasaBoladi = otaId === null

  function tozala() {
    setSarlavha('')
    setSana(null)
    setVaqt(null)
    setTakrorlanish(null)
    setMuhimlik(4)
    setTanlanganPapka(papkaId)
  }

  function yop() {
    tozala()
    setOchiq(false)
  }

  async function qoshish() {
    const tozalangan = sarlavha.trim()
    if (!tozalangan) {
      yop()
      return
    }

    const yuboriladigan = {
      folder_id: papkaniTanlasaBoladi ? tanlanganPapka : papkaId,
      // Papka o'zgartirilgan bo'lsa, eski bo'limga bog'lab bo'lmaydi
      section_id: tanlanganPapka === papkaId ? bolimId : null,
      parent_id: otaId,
      title: tozalangan,
      due_date: sana,
      due_time: vaqt,
      recurrence: takrorlanish,
      priority: muhimlik,
    }

    // Maydon darhol bo'shaydi — ketma-ket qo'shish uzilmasin
    tozala()
    try {
      await yaratish.mutateAsync(yuboriladigan)
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  if (!ochiq) {
    return (
      <button
        type="button"
        onClick={() => setOchiq(true)}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-faint transition hover:bg-surface-muted hover:text-brand-onsoft"
      >
        <Plus className="size-4" aria-hidden />
        {matn ?? t('vazifa.qoshishTugma')}
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        qoshish()
      }}
      className="rounded-xl border border-border-subtle bg-surface p-2 shadow-card"
    >
      <OsuvchiMaydon
        qiymat={sarlavha}
        onChange={setSarlavha}
        onEnter={qoshish}
        onEscape={yop}
        placeholder={t('vazifa.nomiJoy')}
        ariaLabel={t('vazifa.nomiJoy')}
        maxLength={500}
        autoFocus
        engKattaBalandlik={160}
        className="min-h-touch bg-transparent px-2 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
      />

      {/* Sana, muhimlik va papka — oyna ochmasdan shu yerda */}
      <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
        <SanaTanlagich
          sana={sana}
          vaqt={vaqt}
          takrorlanish={takrorlanish}
          onSanaChange={(iso) => {
            setSana(iso)
            if (!iso) {
              setVaqt(null)
              setTakrorlanish(null)
            }
          }}
          onVaqtChange={setVaqt}
          onTakrorlanishChange={setTakrorlanish}
        />

        <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} ixcham />

        {papkaniTanlasaBoladi && papkalar && papkalar.length > 1 && (
          <div className="min-w-36 flex-1">
            <Tanlagich
              ariaLabel={t('vazifa.papka')}
              qiymat={tanlanganPapka}
              onChange={setTanlanganPapka}
              variantlar={papkalar.map((p) => ({
                qiymat: p.id,
                nom: p.name,
                rang: p.color,
              }))}
            />
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end gap-2 px-1 pb-1">
        <button
          type="button"
          onClick={yop}
          className="min-h-0 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-surface-muted"
        >
          {t('umumiy.bekor')}
        </button>
        <button
          type="submit"
          disabled={!sarlavha.trim()}
          className="min-h-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {t('umumiy.qoshish')}
        </button>
      </div>
    </form>
  )
}
