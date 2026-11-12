'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tanlagich } from '@/components/ui/tanlagich'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { FoizTanlagich } from '@/components/vazifa/foiz-tanlagich'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useBolimlar } from '@/lib/queries/bolimlar'
import {
  useVazifaOchirish,
  useVazifaYangilash,
  useVazifaYaratish,
} from '@/lib/queries/vazifalar'
import { vaqtMatni } from '@/lib/sana'
import type { Recurrence, Task, TaskPriority } from '@/types/vazifalar'

/**
 * Vazifa oynasi — ikkala holatda ham ishlaydi:
 *  - `vazifa` berilmasa: yangi vazifa qo'shish
 *  - `vazifa` berilsa: mavjudini tahrirlash (o'chirish tugmasi bilan)
 */
export function VazifaOynasi({
  vazifa,
  yop,
  defaultDate,
  onSuccess,
}: {
  vazifa?: Task
  yop: () => void
  defaultDate?: string | null
  onSuccess?: (createdTask: Task) => void
}) {
  const tahrir = Boolean(vazifa)
  const subtaskmi = Boolean(vazifa?.parent_id)

  const { data: papkalar } = useFaolPapkalar()
  const yaratish = useVazifaYaratish()
  const yangilash = useVazifaYangilash()
  const ochirish = useVazifaOchirish()
  const { korsat } = useToast()

  const kiruvchi = papkalar?.find((p) => p.is_inbox)
  const [tanlanganPapka, setTanlanganPapka] = useState(
    vazifa?.folder_id ?? ''
  )
  const [tanlanganBolim, setTanlanganBolim] = useState(vazifa?.section_id ?? '')
  const [sarlavha, setSarlavha] = useState(vazifa?.title ?? '')
  const [sana, setSana] = useState<string | null>(
    vazifa?.due_date ?? (tahrir ? null : (defaultDate ?? null))
  )
  const [vaqt, setVaqt] = useState<string | null>(
    vazifa?.due_time ? vaqtMatni(vazifa.due_time) : null
  )
  const [takrorlanish, setTakrorlanish] = useState<Recurrence | null>(
    vazifa?.recurrence ?? null
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
      setTakrorlanish(null)
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
        due_date: sana,
        due_time: vaqt,
        recurrence: takrorlanish,
        priority: muhimlik,
        progress: foiz,
        // Subtask doim ota-vazifa papkasida va bo'limsiz qoladi
        ...(subtaskmi
          ? {}
          : { folder_id: papkaQiymati, section_id: tanlanganBolim || null }),
      })
      korsat({ matn: 'Vazifa yangilandi', tone: 'muvaffaqiyat' })
    } else {
      yaratish.mutate(
        {
          folder_id: papkaQiymati,
          section_id: tanlanganBolim || null,
          title: sarlavha,
          due_date: sana,
          due_time: vaqt,
          recurrence: takrorlanish,
          priority: muhimlik,
          progress: foiz,
        },
        {
          onSuccess: (createdTask) => {
            korsat({ matn: 'Vazifa qo\'shildi', tone: 'muvaffaqiyat' })
            onSuccess?.(createdTask as unknown as Task)
          },
        }
      )
    }
    yop()
  }

  async function ochirishniTasdiqla() {
    if (!vazifa) return
    try {
      await ochirish.mutateAsync(vazifa.id)
      korsat({ matn: 'Vazifa o\'chirildi', tone: 'muvaffaqiyat' })
      setOchirishOchiq(false)
      yop()
    } catch {
      korsat({ matn: 'O\'chirib bo\'lmadi. Qayta urinib ko\'ring.', tone: 'xato' })
    }
  }

  return (
    <>
      <Oyna sarlavha={tahrir ? 'Vazifani tahrirlash' : 'Yangi vazifa'} yop={yop}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            saqla()
          }}
        >
          <input
            value={sarlavha}
            onChange={(e) => setSarlavha(e.target.value)}
            placeholder="Nima qilish kerak?"
            maxLength={500}
            autoFocus
            className="min-h-touch w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-base text-text-strong outline-none placeholder:text-text-faint focus:border-brand-primary"
          />

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              Qachon
            </legend>
            <SanaTanlagich
              sana={sana}
              vaqt={vaqt}
              takrorlanish={takrorlanish}
              onSanaChange={sananiOrnat}
              onVaqtChange={setVaqt}
              onTakrorlanishChange={setTakrorlanish}
            />
          </fieldset>

          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              Muhimlik
            </legend>
            <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} />
          </fieldset>

          {/* Foiz — ixtiyoriy. Bir kunda tugamaydigan ishlar uchun:
              bugun 50% qilib, qolganini ertaga davom ettirish mumkin. */}
          <fieldset className="mt-5">
            <legend className="mb-2 text-sm font-medium text-text-muted">
              Bajarildi
            </legend>
            <FoizTanlagich qiymat={foiz} onChange={setFoiz} />
          </fieldset>

          {!subtaskmi && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-text-muted">Papka</p>
              <Tanlagich
                ariaLabel="Papka"
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
                {tanlanganPapkaLoyihalarmi ? 'Loyiha' : 'Bo\'lim'}
              </p>
              <Tanlagich
                ariaLabel={tanlanganPapkaLoyihalarmi ? 'Loyiha' : 'Bo\'lim'}
                qiymat={tanlanganBolim}
                onChange={setTanlanganBolim}
                variantlar={[
                  {
                    qiymat: '',
                    nom: tanlanganPapkaLoyihalarmi
                      ? 'Loyihasiz'
                      : 'Bo\'limsiz',
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
                aria-label="Vazifani o'chirish"
                className="flex min-h-touch shrink-0 items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden />
                O'chirish
              </button>
            )}
            <button
              type="submit"
              disabled={!toliq || bajarilmoqda}
              className="min-h-touch flex-1 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
            >
              {bajarilmoqda ? 'Saqlanmoqda…' : tahrir ? 'Saqlash' : 'Qo\'shish'}
            </button>
          </div>
        </form>
      </Oyna>

      {ochirishOchiq && vazifa && (
        <Tasdiq
          sarlavha="Vazifani o'chirish"
          matn={`"${vazifa.title}" butunlay o'chadi. Buni qaytarib bo'lmaydi.`}
          tasdiqla={ochirishniTasdiqla}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </>
  )
}
