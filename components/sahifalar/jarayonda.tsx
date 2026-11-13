'use client'

import { useState } from 'react'
import { ListChecks, Play, Plus } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { VazifaOynasi } from '@/components/vazifa/vazifa-oynasi'
import {
  useBugungiVazifalar,
  useJarayondagiVazifalar,
} from '@/lib/queries/vazifalar'
import { usePapkalar } from '@/lib/queries/papkalar'
import { useBolimNomlari } from '@/lib/queries/bolimlar'
import { bugunISO } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'
import type { Task } from '@/types/vazifalar'

/**
 * Ilovaning bosh sahifasi.
 *
 * Mantiq sodda: agar boshlangan ish bo'lsa — foydalanuvchi uni ko'radi
 * va davom ettiradi. Bo'lmasa — shu yerning o'zida bugungi ishlar
 * ro'yxati chiqadi va bittasini ▶ bilan boshlashi mumkin. Shunday
 * qilib "nima qilishim kerak?" degan savol har safar bir bosishda
 * hal bo'ladi.
 */
export function JarayondaKorinishi() {
  const { data, isPending, isError, refetch } = useJarayondagiVazifalar()
  const { data: papkalar } = usePapkalar()
  const bolimNomlari = useBolimNomlari()
  const papkaMap = new Map(papkalar?.map((p) => [p.id, p]))
  const [qoshishOchiq, setQoshishOchiq] = useState(false)

  const { otalar, bolalar } = iyerarxiya(data ?? [])

  function qator(v: Task, bolalarManbasi = bolalar) {
    const papka = papkaMap.get(v.folder_id)
    return (
      <VazifaQatori
        key={v.id}
        vazifa={v}
        subtasklar={subtasklar(bolalarManbasi, v.id)}
        papkaNomi={papka?.name}
        papkaRangi={papka?.color}
        bolimNomi={v.section_id ? bolimNomlari.get(v.section_id) : undefined}
      />
    )
  }

  return (
    <>
      <Sahifa
        sarlavha="Jarayonda"
        tavsif={
          otalar.length > 0
            ? `${otalar.length} ta vazifa ustida ishlayapsiz`
            : undefined
        }
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
          <Yuklanmoqda qator={2} />
        ) : isError ? (
          <XatoHolati qayta={() => refetch()} />
        ) : otalar.length === 0 ? (
          <BugundanTanlash qator={qator} />
        ) : (
          <ul className="space-y-2">{otalar.map((v) => qator(v))}</ul>
        )}
      </Sahifa>

      {/*
        Shu sahifadan qo'shilgan vazifa darhol boshlangan bo'ladi —
        odam "Jarayonda" bo'limida turib ish qo'shsa, uni aynan hozir
        bajarmoqchi. Holat yaratishning o'zida beriladi (ikki qadamda
        emas), shunda internet yo'q paytda ham to'g'ri ishlaydi.
      */}
      {qoshishOchiq && (
        <VazifaOynasi
          yop={() => setQoshishOchiq(false)}
          defaultDate={bugunISO()}
          defaultStatus="in_progress"
        />
      )}
    </>
  )
}

/**
 * Jarayonda ish bo'lmaganda ko'rinadi: bugungi ochiq ishlar ro'yxati,
 * har birini ▶ tugmasi bilan darhol boshlash mumkin.
 */
function BugundanTanlash({
  qator,
}: {
  qator: (v: Task, bolalarManbasi?: Map<string, Task[]>) => React.ReactNode
}) {
  const { data, isPending } = useBugungiVazifalar()

  const bugun = bugunISO()
  const { otalar, bolalar } = iyerarxiya(data ?? [])

  // Kechikkanlar oldinda — ular ko'proq e'tibor talab qiladi
  const kechikkan = saralash(
    otalar.filter(
      (v) => v.status !== 'done' && v.due_date !== null && v.due_date < bugun
    )
  )
  const bugungi = saralash(
    otalar.filter((v) => v.status !== 'done' && v.due_date === bugun)
  )
  const tanlov = [...kechikkan, ...bugungi]

  if (isPending) return <Yuklanmoqda qator={2} />

  if (tanlov.length === 0) {
    return (
      <BoshHolat
        ikonka={Play}
        sarlavha="Hozircha hech narsa boshlanmagan"
        matn="Bugunga rejalashtirilgan ish ham yo‘q. Avval vazifa qo‘shing — keyin shu yerdan boshlaysiz."
      />
    )
  }

  return (
    <>
      <div className="mb-5 flex items-start gap-4 rounded-2xl bg-brand-soft px-5 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
          <ListChecks className="size-5 text-white" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-text-strong">
            Bitta ishni tanlab boshlang
          </p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            Hozir hech narsa boshlanmagan. Quyidagi bugungi ishlardan
            bittasini ▶ tugmasi bilan boshlang — bir vaqtda bitta ishga
            jamlangan odam ko‘proq ulguradi.
          </p>
        </div>
      </div>

      <h2 className="mb-2 px-1 text-sm font-semibold text-text-muted">
        Bugungi ishlar
        <span className="ml-2 font-normal text-text-faint">
          {tanlov.length}
        </span>
      </h2>
      <ul className="space-y-2">{tanlov.map((v) => qator(v, bolalar))}</ul>
    </>
  )
}
