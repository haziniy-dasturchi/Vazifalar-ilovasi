'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { IzohMaydoni } from '@/components/ui/izoh-maydoni'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tanlagich } from '@/components/ui/tanlagich'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { FoizTanlagich } from '@/components/vazifa/foiz-tanlagich'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useBolimlar } from '@/lib/queries/bolimlar'
import {
  useVazifaOchirish,
  useVazifaYangilash,
  useVazifaYaratish,
} from '@/lib/queries/vazifalar'
import { bugunISO, vaqtMatni } from '@/lib/sana'
import { eskidanRrule } from '@/lib/takrorlanish'
import type { Task, TaskPriority } from '@/types/vazifalar'

/**
 * Vazifa oynasi — ikkala holatda ham ishlaydi:
 *  - `vazifa` berilmasa: yangi vazifa qo'shish
 *  - `vazifa` berilsa: mavjudini tahrirlash (o'chirish tugmasi bilan)
 */
export function VazifaOynasi({
  vazifa,
  yop,
  defaultDate,
  defaultStatus,
}: {
  vazifa?: Task
  yop: () => void
  /** Yangi vazifa uchun oldindan qo‘yiladigan sana (tahrirlashda e'tiborsiz) */
  defaultDate?: string | null
  /**
   * Yangi vazifa qaysi holatda tug‘ilsin. "Jarayonda" sahifasi buni
   * 'in_progress' qilib beradi — shunda qo‘shilgan ish darhol o‘sha
   * ro‘yxatda paydo bo‘ladi.
   */
  defaultStatus?: Task['status']
}) {
  const tahrir = Boolean(vazifa)
  const subtaskmi = Boolean(vazifa?.parent_id)

  const { data: papkalar } = useFaolPapkalar()
  const yaratish = useVazifaYaratish()
  const yangilash = useVazifaYangilash()
  const ochirish = useVazifaOchirish()
  const { korsat } = useToast()
  const t = useT()

  const kiruvchi = papkalar?.find((p) => p.is_inbox)
  const [tanlanganPapka, setTanlanganPapka] = useState(
    vazifa?.folder_id ?? ''
  )
  const [tanlanganBolim, setTanlanganBolim] = useState(vazifa?.section_id ?? '')
  const [sarlavha, setSarlavha] = useState(vazifa?.title ?? '')
  const [izoh, setIzoh] = useState(vazifa?.description ?? '')
  const [sana, setSana] = useState<string | null>(
    vazifa?.due_date ?? (tahrir ? null : (defaultDate ?? null))
  )
  const [vaqt, setVaqt] = useState<string | null>(
    vazifa?.due_time ? vaqtMatni(vazifa.due_time) : null
  )
  /*
    Takrorlanish RRULE matni sifatida yuritiladi. Eski yozuvlarda
    `rrule` hali bo'sh bo'lishi mumkin (migratsiyagacha ochilgan
    qurilma keshi), shuning uchun eski ustundan o'giriladi.
  */
  const [takrorlanish, setTakrorlanish] = useState<string | null>(
    vazifa?.rrule ?? eskidanRrule(vazifa?.recurrence ?? null)
  )
  /** DTSTART — "N marta" va "shu sanagacha" chegaralari shundan sanaladi */
  const [takrorBoshi, setTakrorBoshi] = useState<string | null>(
    vazifa?.rrule_start ?? vazifa?.due_date ?? null
  )
  const [bajarilgandan, setBajarilgandan] = useState(
    vazifa?.rrule_from_completion ?? false
  )
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(vazifa?.priority ?? 4)
  const [foiz, setFoiz] = useState<number>(vazifa?.progress ?? 0)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)

  const papkaQiymati = tanlanganPapka || kiruvchi?.id || ''
  const toliq = sarlavha.trim().length > 0 && papkaQiymati.length > 0
  const bajarilmoqda = yaratish.isPending || yangilash.isPending

  // "Loyihalar" papkasida bo'limlar aslida loyihalar — nomlanishi boshqa
  const tanlanganPapkaLoyihalarmi = Boolean(
    papkalar?.find((p) => p.id === papkaQiymati)?.is_projects
  )

  const { data: bolimlar } = useBolimlar(subtaskmi ? undefined : papkaQiymati)

  // Papka o'zgarsa, oldin tanlangan bo'lim endi boshqa papkaga tegishli
  // bo'lib qolishi mumkin — shu sababli qaytadan tanlashga majburlaymiz.
  // Hali yuklanmagan bo'lsa (undefined), tegmaymiz — aks holda tahrirlashda
  // boshlang'ich qiymat yuklanishidan oldin tozalanib ketardi.
  useEffect(() => {
    if (!bolimlar) return
    setTanlanganBolim((eski) =>
      bolimlar.some((b) => b.id === eski) ? eski : ''
    )
  }, [bolimlar])

  /**
   * Sana olib tashlansa, vaqt va takrorlanish ham olib tashlanadi —
   * ikkalasi ham faqat sana bilan ma'noga ega.
   */
  function sananiOrnat(iso: string | null) {
    setSana(iso)
    if (!iso) {
      setVaqt(null)
      takrorniOrnat(null)
    }
  }

  /**
   * Qoida o'zgarsa, sanash boshlanadigan kun ham yangilanadi.
   * Aks holda "10 marta" degan chegara eski, allaqachon o'tib
   * ketgan sanadan hisoblanib, vazifa darhol tugab qolardi.
   */
  function takrorniOrnat(qoida: string | null) {
    setTakrorlanish(qoida)
    if (qoida) {
      setTakrorBoshi(sana ?? bugunISO())
    } else {
      setTakrorBoshi(null)
      setBajarilgandan(false)
    }
  }

  /** Saqlashga yuboriladigan takrorlanish maydonlari */
  function takrorMaydonlari() {
    return {
      rrule: takrorlanish,
      rrule_start: takrorlanish ? (takrorBoshi ?? sana ?? bugunISO()) : null,
      rrule_from_completion: takrorlanish ? bajarilgandan : false,
    }
  }

  /**
   * Natija KUTILMAYDI: o'zgarish keshda darhol ko'rinadi, serverga
   * yuborish navbatga tushadi. Shu sababli internet yo'q paytda ham
   * oyna darhol yopiladi va ish yo'qolmaydi.
   */
  function saqla() {
    if (!toliq || bajarilmoqda) return
    if (tahrir) {
      yangilash.mutate({
        id: vazifa!.id,
        title: sarlavha.trim(),
        // Bo'sh izoh bazada NULL bo'lib turadi: "bor, lekin bo'sh"
        // degan uchinchi holat chalkashlikdan boshqa narsa bermaydi
        description: izoh.trim() || null,
        due_date: sana,
        due_time: vaqt,
        ...takrorMaydonlari(),
        priority: muhimlik,
        progress: foiz,
        // Subtask doim ota-vazifa papkasida va bo'limsiz qoladi
        ...(subtaskmi
          ? {}
          : { folder_id: papkaQiymati, section_id: tanlanganBolim || null }),
      })
      korsat({ matn: t('vazifa.yangilandi'), tone: 'muvaffaqiyat' })
    } else {
      yaratish.mutate({
        folder_id: papkaQiymati,
        section_id: tanlanganBolim || null,
        title: sarlavha,
        description: izoh.trim() || null,
        due_date: sana,
        due_time: vaqt,
        ...takrorMaydonlari(),
        priority: muhimlik,
        progress: foiz,
        status: defaultStatus,
      })
      korsat({ matn: t('vazifa.qoshildi'), tone: 'muvaffaqiyat' })
    }
    yop()
  }

  async function ochirishniTasdiqla() {
    if (!vazifa) return
    try {
      await ochirish.mutateAsync(vazifa.id)
      korsat({ matn: t('vazifa.ochirildi'), tone: 'muvaffaqiyat' })
      setOchirishOchiq(false)
      yop()
    } catch {
      korsat({ matn: t('vazifa.ochirilmadi'), tone: 'xato' })
    }
  }

  return (
    <>
      <Oyna sarlavha={tahrir ? t('vazifa.tahrirlash') : t('vazifa.yangi')} yop={yop}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saqla()
          }}
        >
          {/* Uzun nom to'liq ko'rinishi uchun o'suvchi maydon —
              bir qatorli <input> da matnning faqat boshi ko'rinardi */}
          <OsuvchiMaydon
            qiymat={sarlavha}
            onChange={setSarlavha}
            onEnter={saqla}
            placeholder={t('vazifa.nomiJoy')}
            maxLength={500}
            autoFocus
            ariaLabel={t('vazifa.nomiJoy')}
            className="min-h-touch rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
          />

          {/* Izoh — nom ostida, kichik va xira (Todoist naqshi) */}
          <div className="mt-1 px-1">
            <IzohMaydoni qiymat={izoh} onChange={setIzoh} onEnter={saqla} />
          </div>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              {t('vazifa.qachon')}
            </legend>
            <SanaTanlagich
              sana={sana}
              vaqt={vaqt}
              takrorlanish={takrorlanish}
              bajarilgandan={bajarilgandan}
              onSanaChange={sananiOrnat}
              onVaqtChange={setVaqt}
              onTakrorlanishChange={takrorniOrnat}
              onBajarilgandanChange={setBajarilgandan}
            />
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              {t('vazifa.muhimlik')}
            </legend>
            <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} />
          </fieldset>

          {/* Foiz — ixtiyoriy. Bir kunda tugamaydigan ishlar uchun:
              bugun 50% qilib, qolganini ertaga davom ettirish mumkin. */}
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              {t('vazifa.bajarildi')}
            </legend>
            <FoizTanlagich qiymat={foiz} onChange={setFoiz} />
          </fieldset>

          {!subtaskmi && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-text-muted">{t('vazifa.papka')}</p>
              <Tanlagich
                ariaLabel={t('vazifa.papka')}
                qiymat={papkaQiymati}
                onChange={setTanlanganPapka}
                variantlar={(papkalar ?? []).map((p) => ({
                  qiymat: p.id,
                  nom: p.name,
                  rang: p.color,
                }))}
              />
            </div>
          )}

          {!subtaskmi && bolimlar && bolimlar.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-text-muted">
                {tanlanganPapkaLoyihalarmi ? t('vazifa.loyiha') : t('vazifa.bolim')}
              </p>
              <Tanlagich
                ariaLabel={tanlanganPapkaLoyihalarmi ? t('vazifa.loyiha') : t('vazifa.bolim')}
                qiymat={tanlanganBolim}
                onChange={setTanlanganBolim}
                variantlar={[
                  {
                    qiymat: '',
                    nom: tanlanganPapkaLoyihalarmi
                      ? t('vazifa.loyihasiz')
                      : t('vazifa.bolimsiz'),
                  },
                  ...bolimlar.map((b) => ({ qiymat: b.id, nom: b.name })),
                ]}
              />
            </div>
          )}

          <div className="mt-7 flex items-center gap-3">
            {tahrir && (
              <button
                type="button"
                onClick={() => setOchirishOchiq(true)}
                aria-label={t('vazifa.ochirishSarlavha')}
                className="flex min-h-touch shrink-0 items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-danger transition hover:bg-danger-soft"
              >
                <Trash2 className="size-4" aria-hidden />
                {t('umumiy.ochirish')}
              </button>
            )}
            <button
              type="submit"
              disabled={!toliq || bajarilmoqda}
              className="min-h-touch flex-1 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
            >
              {bajarilmoqda
                ? t('umumiy.saqlanmoqda')
                : tahrir
                  ? t('umumiy.saqlash')
                  : t('umumiy.qoshish')}
            </button>
          </div>
        </form>
      </Oyna>

      {ochirishOchiq && vazifa && (
        <Tasdiq
          sarlavha={t('vazifa.ochirishSarlavha')}
          matn={t('vazifa.ochirishTasdiq', { nom: vazifa.title })}
          tasdiqla={ochirishniTasdiqla}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </>
  )
}
