'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
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
  papkaId,
  bolimId,
}: {
  vazifa?: Task
  yop: () => void
  papkaId?: string
  bolimId?: string | null
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
    vazifa?.folder_id ?? papkaId ?? ''
  )
  const [sarlavha, setSarlavha] = useState(vazifa?.title ?? '')
  const [sana, setSana] = useState<string | null>(vazifa?.due_date ?? null)
  const [vaqt, setVaqt] = useState<string | null>(
    vazifa?.due_time ? vaqtMatni(vazifa.due_time) : null
  )
  const [takrorlanish, setTakrorlanish] = useState<Recurrence | null>(
    vazifa?.recurrence ?? null
  )
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(vazifa?.priority ?? 4)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)

  const papkaQiymati = tanlanganPapka || papkaId || kiruvchi?.id || ''
  const toliq = sarlavha.trim().length > 0 && papkaQiymati.length > 0
  const bajarilmoqda = yaratish.isPending || yangilash.isPending

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

  async function saqla() {
    if (!toliq || bajarilmoqda) return
    try {
      if (tahrir) {
        await yangilash.mutateAsync({
          id: vazifa!.id,
          title: sarlavha.trim(),
          due_date: sana,
          due_time: vaqt,
          recurrence: takrorlanish,
          priority: muhimlik,
          // Subtask doim ota-vazifa papkasida qoladi — bu yerda o'zgartirilmaydi
          ...(subtaskmi ? {} : { folder_id: papkaQiymati }),
        })
        korsat({ matn: 'Vazifa yangilandi', tone: 'muvaffaqiyat' })
      } else {
        await yaratish.mutateAsync({
          folder_id: papkaQiymati,
          section_id: bolimId ?? null,
          title: sarlavha,
          due_date: sana,
          due_time: vaqt,
          recurrence: takrorlanish,
          priority: muhimlik,
        })
        korsat({ matn: 'Vazifa qo‘shildi', tone: 'muvaffaqiyat' })
      }
      yop()
    } catch {
      korsat({
        matn: tahrir
          ? 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.'
          : 'Qo‘shib bo‘lmadi. Qayta urinib ko‘ring.',
        tone: 'xato',
      })
    }
  }

  async function ochirishniTasdiqla() {
    if (!vazifa) return
    try {
      await ochirish.mutateAsync(vazifa.id)
      korsat({ matn: 'Vazifa o‘chirildi', tone: 'muvaffaqiyat' })
      setOchirishOchiq(false)
      yop()
    } catch {
      korsat({ matn: 'O‘chirib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
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

          {!subtaskmi && (
            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-text-muted">
                Papka
              </span>
              <select
                value={papkaQiymati}
                onChange={(e) => setTanlanganPapka(e.target.value)}
                className="min-h-touch w-full rounded-xl border border-border-subtle bg-surface px-4 py-3 text-base text-text-strong outline-none focus:border-brand-primary"
              >
                {papkalar?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-7 flex items-center gap-3">
            {tahrir && (
              <button
                type="button"
                onClick={() => setOchirishOchiq(true)}
                aria-label="Vazifani o‘chirish"
                className="flex min-h-touch shrink-0 items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden />
                O‘chirish
              </button>
            )}
            <button
              type="submit"
              disabled={!toliq || bajarilmoqda}
              className="min-h-touch flex-1 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
            >
              {bajarilmoqda ? 'Saqlanmoqda…' : tahrir ? 'Saqlash' : 'Qo‘shish'}
            </button>
          </div>
        </form>
      </Oyna>

      {ochirishOchiq && vazifa && (
        <Tasdiq
          sarlavha="Vazifani o‘chirish"
          matn={`"${vazifa.title}" butunlay o‘chadi. Buni qaytarib bo‘lmaydi.`}
          tasdiqla={ochirishniTasdiqla}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </>
  )
}
