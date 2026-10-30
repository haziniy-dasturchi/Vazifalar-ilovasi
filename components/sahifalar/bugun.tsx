'use client'

import { useState } from 'react'
import { ListChecks, Plus } from 'lucide-react'
import { Guruh, Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { TezQoshish } from '@/components/vazifa/tez-qoshish'
import { useBugungiVazifalar } from '@/lib/queries/vazifalar'
import { usePapkalar } from '@/lib/queries/papkalar'
import { bugunISO, sarlavhaSana } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'

export function BugunKorinishi() {
  const { data, isPending, isError, refetch } = useBugungiVazifalar()
  const { data: papkalar } = usePapkalar()
  const [qoshishOchiq, setQoshishOchiq] = useState(false)

  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))
  const bugun = bugunISO()

  const { otalar, bolalar } = iyerarxiya(data ?? [])

  const kechikkan = saralash(
    otalar.filter(
      (v) => v.status !== 'done' && v.due_date !== null && v.due_date < bugun
    )
  )
  const bugungi = saralash(
    otalar.filter((v) => v.status !== 'done' && v.due_date === bugun)
  )
  const bajarilgan = otalar.filter((v) => v.status === 'done')

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
      />
    )
  }

  return (
    <Sahifa
      sarlavha="Bugun"
      tavsif={sarlavhaSana()}
      harakat={
        <button
          type="button"
          onClick={() => setQoshishOchiq(true)}
          className="hidden items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary-hover md:flex"
        >
          <Plus className="size-4" aria-hidden />
          Vazifa
        </button>
      }
    >
      {isPending ? (
        <Yuklanmoqda />
      ) : isError ? (
        <XatoHolati qayta={() => refetch()} />
      ) : hammasiBosh ? (
        <BoshHolat
          ikonka={ListChecks}
          sarlavha="Bugunga vazifa yo‘q"
          matn="Hali vazifa yo‘q — + tugmasini bosing."
          harakat={{ matn: 'Vazifa qo‘shish', bajar: () => setQoshishOchiq(true) }}
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
              ikonka={ListChecks}
              sarlavha="Bugungi ishlar tugadi"
              matn="Bugun rejalashtirilgan vazifalar qolmadi."
              harakat={{
                matn: 'Yana vazifa qo‘shish',
                bajar: () => setQoshishOchiq(true),
              }}
            />
          )}

          {bajarilgan.length > 0 && (
            <Guruh sarlavha="Bugun bajarildi" soni={bajarilgan.length}>
              <ul className="space-y-2">{bajarilgan.map(qator)}</ul>
            </Guruh>
          )}
        </>
      )}

      {qoshishOchiq && <TezQoshish yop={() => setQoshishOchiq(false)} />}
    </Sahifa>
  )
}
