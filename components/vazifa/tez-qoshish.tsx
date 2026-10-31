'use client'

import { useState } from 'react'
import { addDays } from 'date-fns'
import { Oyna } from '@/components/ui/oyna'
import { SanaTanlagich } from '@/components/ui/sana-tanlagich'
import { useToast } from '@/components/ui/toast'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useVazifaYaratish } from '@/lib/queries/vazifalar'
import { bugunISO, isoGa } from '@/lib/sana'

/**
 * Tez qo'shish oynasi (1-bosqich darajasi).
 * To'liq ko'rinishi — sana, deadline va muhimlik tugmalari bilan — 2-bosqichda.
 */
export function TezQoshish({
  yop,
  papkaId,
  bolimId,
}: {
  yop: () => void
  papkaId?: string
  bolimId?: string | null
}) {
  const { data: papkalar } = useFaolPapkalar()
  const yaratish = useVazifaYaratish()
  const { korsat } = useToast()

  const kiruvchi = papkalar?.find((p) => p.is_inbox)
  const [tanlanganPapka, setTanlanganPapka] = useState(papkaId ?? '')
  const [sarlavha, setSarlavha] = useState('')
  const [sana, setSana] = useState<string | null>(null)
  const [vaqt, setVaqt] = useState<string | null>(null)

  const papkaQiymati = tanlanganPapka || papkaId || kiruvchi?.id || ''
  const toliq = sarlavha.trim().length > 0 && papkaQiymati.length > 0

  const SANALAR = [
    { nom: 'Bugun', qiymat: bugunISO() },
    { nom: 'Ertaga', qiymat: isoGa(addDays(new Date(), 1)) },
  ]

  /** Sana olib tashlansa, vaqt ham olib tashlanadi (vaqt faqat sana bilan ma'noga ega) */
  function sananiOrnat(iso: string | null) {
    setSana(iso)
    if (!iso) setVaqt(null)
  }

  /** Bugun/Ertaga tugmasi — qayta bosilsa, sana tozalanadi */
  function tezSanaTanlash(qiymat: string) {
    sananiOrnat(sana === qiymat ? null : qiymat)
  }

  async function qoshish() {
    if (!toliq || yaratish.isPending) return
    try {
      await yaratish.mutateAsync({
        folder_id: papkaQiymati,
        section_id: bolimId ?? null,
        title: sarlavha,
        due_date: sana,
        due_time: vaqt,
      })
      korsat({ matn: 'Vazifa qo‘shildi', tone: 'muvaffaqiyat' })
      yop()
    } catch {
      korsat({ matn: 'Qo‘shib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <Oyna sarlavha="Yangi vazifa" yop={yop}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          qoshish()
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
          <div className="flex flex-wrap items-center gap-2">
            {SANALAR.map((s) => {
              const tanlangan = sana === s.qiymat
              return (
                <button
                  key={s.nom}
                  type="button"
                  onClick={() => tezSanaTanlash(s.qiymat)}
                  aria-pressed={tanlangan}
                  className={`min-h-0 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                    tanlangan
                      ? 'border-brand-primary bg-brand-soft text-brand-primary'
                      : 'border-border-subtle text-text-strong hover:bg-surface-muted'
                  }`}
                >
                  {s.nom}
                </button>
              )
            })}
            <SanaTanlagich
              sana={sana}
              vaqt={vaqt}
              onSanaChange={sananiOrnat}
              onVaqtChange={setVaqt}
            />
          </div>
        </fieldset>

        {!papkaId && (
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

        <button
          type="submit"
          disabled={!toliq || yaratish.isPending}
          className="mt-7 w-full rounded-xl bg-brand-primary px-6 py-4 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {yaratish.isPending ? 'Qo‘shilmoqda…' : 'Qo‘shish'}
        </button>
      </form>
    </Oyna>
  )
}
