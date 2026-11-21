'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { IzohMaydoni } from '@/components/ui/izoh-maydoni'
import { KalitMaydon } from '@/components/vazifa/kalit-maydon'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tanlagich } from '@/components/ui/tanlagich'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useVazifaYaratish } from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useBolimlar } from '@/lib/queries/bolimlar'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { yangiId } from '@/lib/id'
import { bugunISO } from '@/lib/sana'
import { useKalitSozlar } from '@/lib/kalit-sozlar/use-kalit-sozlar'
import type { Task, TaskPriority } from '@/types/vazifalar'

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
  defaultDate = null,
  defaultStatus,
}: {
  papkaId: string
  bolimId?: string | null
  otaId?: string | null
  matn?: string
  /** Yangi vazifaga oldindan qo'yiladigan sana (masalan, "Bugun" sahifasida bugun) */
  defaultDate?: string | null
  /** Yangi vazifa qaysi holatda tug'ilsin ("Jarayonda" sahifasida 'in_progress') */
  defaultStatus?: Task['status']
}) {
  const t = useT()
  const [ochiq, setOchiq] = useState(false)
  const [sarlavha, setSarlavha] = useState('')
  const [izoh, setIzoh] = useState('')
  const [sana, setSana] = useState<string | null>(defaultDate)
  const [vaqt, setVaqt] = useState<string | null>(null)
  const [takrorlanish, setTakrorlanish] = useState<string | null>(null)
  const [takrorBoshi, setTakrorBoshi] = useState<string | null>(null)
  const [bajarilgandan, setBajarilgandan] = useState(false)
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(4)
  const [tanlanganPapka, setTanlanganPapka] = useState(papkaId)
  const [tanlanganBolim, setTanlanganBolim] = useState(bolimId ?? '')

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

  /*
    Papkani (va bo'limni) tanlash ikki holatda yopiq:
    - Subtask doim ota-vazifa papkasida qoladi.
    - Aniq bo'lim ichidan qo'shilayotganda (masalan, bitta loyiha
      kartasining o'zidan) vazifa AYNAN o'sha bo'limda qolishi kerak —
      papka almashtirgich bu yerda vazifani boshqa joyga olib
      ketib qo'yishi mumkin edi.
  */
  const papkaniTanlasaBoladi = otaId === null && bolimId === null
  const papkaQiymati = papkaniTanlasaBoladi ? tanlanganPapka : papkaId

  // Tanlangan papkaning bo'limlari — vazifa oynasidagi bilan bir xil mantiq
  const { data: bolimlar } = useBolimlar(otaId ? undefined : papkaQiymati)
  // "Loyihalar" papkasida bo'lim aslida loyiha — nomlanishi boshqa
  const tanlanganPapkaLoyihalarmi = Boolean(
    papkalar?.find((p) => p.id === papkaQiymati)?.is_projects
  )
  /*
    Loyihalar papkasida vazifa albatta biror loyihaga tegishli
    bo'lishi kerak — yolg'iz vazifa loyiha emas. Subtask uchun bu
    talab yo'q (u umuman bo'lim tanlamaydi).
  */
  const loyihaTanlanmagan =
    !otaId && tanlanganPapkaLoyihalarmi && !tanlanganBolim

  // Papka o'zgarsa, oldin tanlangan bo'lim endi boshqa papkaga tegishli
  // bo'lib qolishi mumkin — shu sababli qaytadan tanlashga majburlaymiz
  useEffect(() => {
    if (!bolimlar) return
    setTanlanganBolim((eski) =>
      bolimlar.some((b) => b.id === eski) ? eski : ''
    )
  }, [bolimlar])

  function tozala() {
    kalitlarniTozala()
    setSarlavha('')
    setIzoh('')
    setSana(defaultDate)
    setVaqt(null)
    setTakrorlanish(null)
    setTakrorBoshi(null)
    setBajarilgandan(false)
    setMuhimlik(4)
    setTanlanganPapka(papkaId)
    setTanlanganBolim(bolimId ?? '')
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

    // Loyihalar papkasida vazifa albatta biror loyihaga tegishli
    // bo'lishi kerak — yolg'iz vazifa loyiha emas. Forma OCHIQ qoladi,
    // shunda foydalanuvchi loyihani tanlab, yozganini yo'qotmaydi.
    if (loyihaTanlanmagan) {
      korsat({ matn: t('vazifa.loyihaShart'), tone: 'xato' })
      return
    }

    // Takrorlanish boshlanish sanasisiz ma'nosiz
    const saqlanadiganSana = takrorlanish ? (sana ?? bugunISO()) : sana

    const yuboriladigan = {
      id: yangiId(),
      folder_id: papkaQiymati,
      section_id: otaId ? null : tanlanganBolim || null,
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
      status: defaultStatus,
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
        className="group flex min-h-touch w-full cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-border-subtle bg-surface px-4 py-3 text-left transition hover:border-brand-primary hover:bg-brand-soft hover:shadow-card"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-onsoft transition group-hover:bg-brand-primary group-hover:text-white">
          <Plus className="size-5" aria-hidden />
        </span>
        <span className="text-base font-semibold text-text-muted transition group-hover:text-brand-onsoft">
          {matn ?? t('vazifa.qoshishTugma')}
        </span>
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

        {/*
          Loyihalar papkasida bu tanlagich HAR DOIM ko'rsatiladi
          (loyiha hali yo'q bo'lsa ham) — aks holda "nega
          saqlanmayapti" tushunarsiz qolardi.
        */}
        {papkaniTanlasaBoladi &&
          (tanlanganPapkaLoyihalarmi || (bolimlar && bolimlar.length > 0)) && (
            <div className="min-w-36 flex-1">
              <Tanlagich
                ariaLabel={
                  tanlanganPapkaLoyihalarmi ? t('vazifa.loyiha') : t('vazifa.bolim')
                }
                qiymat={tanlanganBolim}
                onChange={setTanlanganBolim}
                variantlar={[
                  {
                    qiymat: '',
                    nom: tanlanganPapkaLoyihalarmi
                      ? t('vazifa.loyihasiz')
                      : t('vazifa.bolimsiz'),
                  },
                  ...(bolimlar ?? []).map((b) => ({ qiymat: b.id, nom: b.name })),
                ]}
              />
            </div>
          )}
      </div>

      {loyihaTanlanmagan && (
        <p className="mt-1 px-1 text-sm text-danger">{t('vazifa.loyihaShart')}</p>
      )}

      <div className="mt-2 flex justify-end gap-2 px-1 pb-1">
        <button
          type="button"
          onClick={yop}
          className="min-h-0 cursor-pointer rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-surface-muted"
        >
          {t('umumiy.bekor')}
        </button>
        <button
          type="submit"
          disabled={!tahlil.nom || loyihaTanlanmagan}
          title={loyihaTanlanmagan ? t('vazifa.loyihaShart') : undefined}
          className="min-h-0 cursor-pointer rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t('umumiy.qoshish')}
        </button>
      </div>
    </form>
  )
}
