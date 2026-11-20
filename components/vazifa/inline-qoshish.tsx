'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { IzohMaydoni } from '@/components/ui/izoh-maydoni'
import { KalitMaydon } from '@/components/vazifa/kalit-maydon'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tanlagich } from '@/components/ui/tanlagich'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useVazifaYaratish } from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { bugunISO } from '@/lib/sana'
import { useKalitSozlar } from '@/lib/kalit-sozlar/use-kalit-sozlar'
import type { TaskPriority } from '@/types/vazifalar'

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
  const [izoh, setIzoh] = useState('')
  const [sana, setSana] = useState<string | null>(null)
  const [vaqt, setVaqt] = useState<string | null>(null)
  const [takrorlanish, setTakrorlanish] = useState<string | null>(null)
  const [takrorBoshi, setTakrorBoshi] = useState<string | null>(null)
  const [bajarilgandan, setBajarilgandan] = useState(false)
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(4)
  const [tanlanganPapka, setTanlanganPapka] = useState(papkaId)

  const { tahlil, bekorQil, tozala: kalitlarniTozala } = useKalitSozlar(
    sarlavha,
    (o) => {
      if (o.sana !== undefined) setSana(o.sana)
      if (o.vaqt !== undefined) setVaqt(o.vaqt)
      if (o.rrule !== undefined) takrorniOrnat(o.rrule)
      if (o.muhimlik !== undefined) setMuhimlik(o.muhimlik ?? 4)
    }
  )

  const yaratish = useVazifaYaratish()
  const { data: papkalar } = useFaolPapkalar()
  const { korsat } = useToast()

  // Subtask doim ota-vazifa papkasida qoladi — papkani tanlash
  // faqat mustaqil vazifa uchun ma'noga ega
  const papkaniTanlasaBoladi = otaId === null

  function tozala() {
    kalitlarniTozala()
    setSarlavha('')
    setIzoh('')
    setSana(null)
    setVaqt(null)
    setTakrorlanish(null)
    setTakrorBoshi(null)
    setBajarilgandan(false)
    setMuhimlik(4)
    setTanlanganPapka(papkaId)
  }

  function yop() {
    tozala()
    setOchiq(false)
  }

  /** Qoida o'zgarsa sanash shu kundan boshlanadi (vazifa oynasidagidek) */
  function takrorniOrnat(qoida: string | null) {
    setTakrorlanish(qoida)
    if (qoida) {
      setTakrorBoshi(sana ?? bugunISO())
    } else {
      setTakrorBoshi(null)
      setBajarilgandan(false)
    }
  }

  async function qoshish() {
    // Kalit so'zlar olib tashlangan nom saqlanadi
    const tozalangan = tahlil.nom
    if (!tozalangan) {
      yop()
      return
    }

    // Takrorlanish boshlanish sanasisiz ma'nosiz
    const saqlanadiganSana = takrorlanish ? (sana ?? bugunISO()) : sana

    const yuboriladigan = {
      folder_id: papkaniTanlasaBoladi ? tanlanganPapka : papkaId,
      // Papka o'zgartirilgan bo'lsa, eski bo'limga bog'lab bo'lmaydi
      section_id: tanlanganPapka === papkaId ? bolimId : null,
      parent_id: otaId,
      title: tozalangan,
      description: izoh.trim() || null,
      due_date: saqlanadiganSana,
      due_time: vaqt,
      rrule: takrorlanish,
      rrule_start: takrorlanish
        ? (takrorBoshi ?? saqlanadiganSana ?? bugunISO())
        : null,
      rrule_from_completion: takrorlanish ? bajarilgandan : false,
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
      <KalitMaydon
        qiymat={sarlavha}
        belgilar={tahlil.belgilar}
        onChange={setSarlavha}
        onEnter={qoshish}
        onEscape={yop}
        onBekor={bekorQil}
        placeholder={t('vazifa.nomiJoy')}
        ariaLabel={t('vazifa.nomiJoy')}
        maxLength={500}
        autoFocus
        engKattaBalandlik={160}
        className="min-h-touch px-2 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint"
      />

      <div className="px-2">
        <IzohMaydoni
          qiymat={izoh}
          onChange={setIzoh}
          onEnter={qoshish}
          onEscape={yop}
        />
      </div>

      {/* Sana, muhimlik va papka — oyna ochmasdan shu yerda */}
      <div className="mt-1 flex flex-wrap items-center gap-2 px-1">
        <SanaTanlagich
          sana={takrorlanish ? (sana ?? bugunISO()) : sana}
          vaqt={vaqt}
          takrorlanish={takrorlanish}
          bajarilgandan={bajarilgandan}
          onSanaChange={(iso) => {
            setSana(iso)
            if (!iso) {
              setVaqt(null)
              takrorniOrnat(null)
            }
          }}
          onVaqtChange={setVaqt}
          onTakrorlanishChange={takrorniOrnat}
          onBajarilgandanChange={setBajarilgandan}
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
          disabled={!tahlil.nom}
          className="min-h-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {t('umumiy.qoshish')}
        </button>
      </div>
    </form>
  )
}
