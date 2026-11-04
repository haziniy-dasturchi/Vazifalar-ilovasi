'use client'

import { useState } from 'react'
import { addDays } from 'date-fns'
import { Moon } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { Tanlagich } from '@/components/ui/tanlagich'
import { useToast } from '@/components/ui/toast'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { useErtangiVazifalar, useVazifaYaratish } from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useBolimNomlari } from '@/lib/queries/bolimlar'
import { isoGa, toliqSana } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'
import type { Folder, Task } from '@/types/vazifalar'

const IQTIBOS =
  'Musulmon odam ertaga nima bo‘lishini bilmaydi, ammo ertaga nima qilishini bilishi kerak.'
const IQTIBOS_MUALLIFI = 'Doniyor Nasriddinov'

export function KechkiRejaKorinishi() {
  const ertaga = isoGa(addDays(new Date(), 1))

  const { data, isPending, isError, refetch } = useErtangiVazifalar()
  const { data: papkalar } = useFaolPapkalar()
  const bolimNomlari = useBolimNomlari()
  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))

  const { otalar, bolalar } = iyerarxiya(data ?? [])
  const tartiblangan = saralash(otalar)

  function qator(v: Task) {
    const papka = papkaMap.get(v.folder_id)
    return (
      <VazifaQatori
        key={v.id}
        vazifa={v}
        subtasklar={subtasklar(bolalar, v.id)}
        papkaNomi={papka?.name}
        papkaRangi={papka?.color}
        bolimNomi={v.section_id ? bolimNomlari.get(v.section_id) : undefined}
      />
    )
  }

  return (
    <Sahifa
      sarlavha="Kechki reja"
      tavsif={`Ertaga uchun — ${toliqSana(ertaga)}`}
      belgi={
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
          <Moon className="size-5 text-brand-primary" aria-hidden />
        </span>
      }
    >
      <IqtibosKartasi />

      <ErtangaQoshish papkalar={papkalar} ertaga={ertaga} />

      <div className="mt-7">
        {isPending ? (
          <Yuklanmoqda />
        ) : isError ? (
          <XatoHolati qayta={() => refetch()} />
        ) : tartiblangan.length === 0 ? (
          <BoshHolat
            ikonka={Moon}
            sarlavha="Ertaga uchun reja yo‘q"
            matn="Yuqoridagi maydondan foydalanib, ertangi kun uchun vazifa qo‘shing."
          />
        ) : (
          <ul className="space-y-2">{tartiblangan.map(qator)}</ul>
        )}
      </div>
    </Sahifa>
  )
}

function IqtibosKartasi() {
  return (
    <div className="mb-6 rounded-2xl bg-brand-primary px-5 py-5 text-white shadow-card">
      <p className="text-base leading-relaxed font-medium italic">
        “{IQTIBOS}”
      </p>
      <p className="mt-3 text-sm text-white/70">— {IQTIBOS_MUALLIFI}</p>
    </div>
  )
}

function ErtangaQoshish({
  papkalar,
  ertaga,
}: {
  papkalar?: Folder[]
  ertaga: string
}) {
  const kiruvchi = papkalar?.find((p) => p.is_inbox)
  const [sarlavha, setSarlavha] = useState('')
  const [vaqt, setVaqt] = useState('')
  const [tanlanganPapka, setTanlanganPapka] = useState('')
  const yaratish = useVazifaYaratish()
  const { korsat } = useToast()

  const papkaQiymati = tanlanganPapka || kiruvchi?.id || ''
  const toliq = sarlavha.trim().length > 0 && papkaQiymati.length > 0

  async function qoshish(e: React.FormEvent) {
    e.preventDefault()
    if (!toliq || yaratish.isPending) return

    const sarlavhaQiymati = sarlavha.trim()
    const vaqtQiymati = vaqt
    setSarlavha('')
    setVaqt('')

    try {
      await yaratish.mutateAsync({
        folder_id: papkaQiymati,
        title: sarlavhaQiymati,
        due_date: ertaga,
        due_time: vaqtQiymati || null,
      })
    } catch {
      korsat({ matn: 'Qo‘shib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <form
      onSubmit={qoshish}
      className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-card"
    >
      <input
        value={sarlavha}
        onChange={(e) => setSarlavha(e.target.value)}
        placeholder="Ertaga nima qilasiz?"
        maxLength={500}
        className="min-h-touch w-full bg-transparent text-base text-text-strong outline-none placeholder:text-text-faint"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div className="min-w-40 flex-1">
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

        <input
          type="time"
          value={vaqt}
          onChange={(e) => setVaqt(e.target.value)}
          aria-label="Vaqt (ixtiyoriy)"
          className="min-h-touch rounded-xl border border-border-subtle bg-surface px-3 text-sm text-text-strong outline-none focus:border-brand-primary"
        />

        <button
          type="submit"
          disabled={!toliq || yaratish.isPending}
          className="min-h-touch rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          {yaratish.isPending ? '…' : 'Qo‘shish'}
        </button>
      </div>
    </form>
  )
}
