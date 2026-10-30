'use client'

import { Play } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { useJarayondagiVazifalar } from '@/lib/queries/vazifalar'
import { usePapkalar } from '@/lib/queries/papkalar'
import { iyerarxiya, subtasklar } from '@/lib/vazifa-yordam'

export function JarayondaKorinishi() {
  const { data, isPending, isError, refetch } = useJarayondagiVazifalar()
  const { data: papkalar } = usePapkalar()
  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))

  const { otalar, bolalar } = iyerarxiya(data ?? [])

  return (
    <Sahifa
      sarlavha="Jarayonda"
      tavsif={
        otalar.length > 0
          ? `${otalar.length} ta vazifa ustida ishlayapsiz`
          : undefined
      }
    >
      {isPending ? (
        <Yuklanmoqda qator={2} />
      ) : isError ? (
        <XatoHolati qayta={() => refetch()} />
      ) : otalar.length === 0 ? (
        <BoshHolat
          ikonka={Play}
          sarlavha="Hozircha hech narsa boshlanmagan"
          matn="Vazifani boshlash uchun uning yonidagi ▶ tugmasini bosing — kartochka sariq rangga kiradi."
        />
      ) : (
        <ul className="space-y-2">
          {otalar.map((v) => {
            const papka = papkaMap.get(v.folder_id)
            return (
              <VazifaQatori
                key={v.id}
                vazifa={v}
                subtasklar={subtasklar(bolalar, v.id)}
                papkaNomi={papka?.name}
                papkaRangi={papka?.color}
              />
            )
          })}
        </ul>
      )}
    </Sahifa>
  )
}
