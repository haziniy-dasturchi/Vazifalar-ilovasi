'use client'

import { CalendarDays } from 'lucide-react'
import { Guruh, Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { useKelgusiVazifalar } from '@/lib/queries/vazifalar'
import { usePapkalar } from '@/lib/queries/papkalar'
import { useBolimNomlari } from '@/lib/queries/bolimlar'
import { sanaMatni, toliqSana } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'
import type { Task } from '@/types/vazifalar'

export function KelgusiKorinishi() {
  const { data, isPending, isError, refetch } = useKelgusiVazifalar()
  const { data: papkalar } = usePapkalar()
  const bolimNomlari = useBolimNomlari()
  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))

  const { otalar, bolalar } = iyerarxiya(data ?? [])

  // Sana bo'yicha guruhlash
  const kunlar = new Map<string, Task[]>()
  for (const v of saralash(otalar)) {
    if (!v.due_date) continue
    const royxat = kunlar.get(v.due_date)
    if (royxat) royxat.push(v)
    else kunlar.set(v.due_date, [v])
  }
  const tartiblangan = [...kunlar.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )

  return (
    <Sahifa
      sarlavha="Kelgusi"
      tavsif="Keyingi 30 kun uchun rejalashtirilgan vazifalar"
    >
      {isPending ? (
        <Yuklanmoqda qator={3} />
      ) : isError ? (
        <XatoHolati qayta={() => refetch()} />
      ) : tartiblangan.length === 0 ? (
        <BoshHolat
          ikonka={CalendarDays}
          sarlavha="Kelgusiga reja yo‘q"
          matn="Hali vazifa yo‘q — + tugmasini bosib, sana belgilang."
        />
      ) : (
        tartiblangan.map(([sana, royxat]) => (
          <Guruh
            key={sana}
            sarlavha={`${sanaMatni(sana)} · ${toliqSana(sana)}`}
            soni={royxat.length}
          >
            <ul className="space-y-2">
              {royxat.map((v) => {
                const papka = papkaMap.get(v.folder_id)
                return (
                  <VazifaQatori
                    key={v.id}
                    vazifa={v}
                    subtasklar={subtasklar(bolalar, v.id)}
                    papkaNomi={papka?.name}
                    papkaRangi={papka?.color}
                    bolimNomi={
                      v.section_id ? bolimNomlari.get(v.section_id) : undefined
                    }
                  />
                )
              })}
            </ul>
          </Guruh>
        ))
      )}
    </Sahifa>
  )
}
