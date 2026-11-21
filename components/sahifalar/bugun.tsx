'use client'

import { ListChecks } from 'lucide-react'
import { Guruh, Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { InlineQoshish } from '@/components/vazifa/inline-qoshish'
import { useBugungiVazifalar } from '@/lib/queries/vazifalar'
import { usePapkalar } from '@/lib/queries/papkalar'
import { useBolimNomlari } from '@/lib/queries/bolimlar'
import { bugunISO, sarlavhaSana } from '@/lib/sana'
import { bugungiBajarilganlar, iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'

export function BugunKorinishi() {
  const { data, isPending, isError, refetch } = useBugungiVazifalar()
  const { data: papkalar } = usePapkalar()
  const bolimNomlari = useBolimNomlari()

  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))
  const bugun = bugunISO()
  // Pastdagi tezkor qo'shish qaysi papkadan boshlanishini bildiradi —
  // Kiruvchi hali yuklanmagan paytda maydon ko'rsatilmaydi
  const kiruvchi = papkalar?.find((p) => p.is_inbox)

  const { otalar, bolalar } = iyerarxiya(data ?? [])

  const kechikkan = saralash(
    otalar.filter(
      (v) => v.status !== 'done' && v.due_date !== null && v.due_date < bugun
    )
  )
  const bugungi = saralash(
    otalar.filter((v) => v.status !== 'done' && v.due_date === bugun)
  )
  const { bajarilgan, takrorBajarilganIdlari } = bugungiBajarilganlar(
    otalar,
    bugun
  )

  const hammasiBosh =
    kechikkan.length === 0 && bugungi.length === 0 && bajarilgan.length === 0

  function qator(v: (typeof otalar)[number]) {
    const papka = papkaMap.get(v.folder_id)
    return (
      <VazifaQatori
        key={v.id}
        vazifa={v}
        subtasklar={subtasklar(bolalar, v.id)}
        papkaNomi={papka?.name}
        papkaRangi={papka?.color}
        bolimNomi={v.section_id ? bolimNomlari.get(v.section_id) : undefined}
        qaytarishMumkinEmas={takrorBajarilganIdlari.has(v.id)}
      />
    )
  }

  return (
    <Sahifa sarlavha="Bugun" tavsif={sarlavhaSana()}>
      {isPending ? (
        <Yuklanmoqda />
      ) : isError ? (
        <XatoHolati qayta={() => refetch()} />
      ) : hammasiBosh ? (
        <BoshHolat
          ikonka={ListChecks}
          sarlavha="Bugunga vazifa yo‘q"
          matn="Hali vazifa yo‘q — pastdagi maydondan qo‘shing."
        />
      ) : (
        <>
          {kechikkan.length > 0 && (
            <Guruh sarlavha="Kechikkan" soni={kechikkan.length} rang="#dc2626">
              <ul className="space-y-2">{kechikkan.map(qator)}</ul>
            </Guruh>
          )}

          {bugungi.length > 0 && (
            <Guruh sarlavha="Bugun" soni={bugungi.length}>
              <ul className="space-y-2">{bugungi.map(qator)}</ul>
            </Guruh>
          )}

          {bugungi.length === 0 && kechikkan.length === 0 && (
            <BoshHolat
              rasm="/illustrations/empty-today-done.svg"
              sarlavha="Bugungi ishlar tugadi"
              matn="Bugun rejalashtirilgan vazifalar qolmadi."
            />
          )}
        </>
      )}

      {/*
        Todoist uslubidagi tezkor qo'shish — ochiq vazifalar bilan
        "Bugun bajarildi" orasida turadi (ochiq ro'yxat davomidek).
        Bajarilganlar pastda qolishi kerak, aks holda yangi qo'shilgan
        ish bajarilganlar orasiga "tushib qolgandek" ko'rinardi. Sana
        "bugun" bilan oldindan to'ldirilgan, chunki shu sahifaga
        qo'shilgan ish aynan bugunga tegishli bo'lishi kutiladi.
      */}
      {kiruvchi && !isPending && !isError && (
        <InlineQoshish papkaId={kiruvchi.id} defaultDate={bugun} />
      )}

      {!isPending && !isError && bajarilgan.length > 0 && (
        <div className="mt-6">
          <Guruh sarlavha="Bugun bajarildi" soni={bajarilgan.length}>
            <ul className="space-y-2">{bajarilgan.map(qator)}</ul>
          </Guruh>
        </div>
      )}
    </Sahifa>
  )
}
