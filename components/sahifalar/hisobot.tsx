'use client'

import { useMemo, useState } from 'react'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import {
  ChevronDown,
  CircleCheck,
  Clock,
  FolderOpen,
  TriangleAlert,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { useHisobotVazifalari } from '@/lib/queries/hisobot'
import { usePapkalar } from '@/lib/queries/papkalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { bugunISO, isoGa, toliqSana } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar as olBolalar } from '@/lib/vazifa-yordam'
import type { Task } from '@/types/vazifalar'

type Oraliq = { nom: string; boshlanish: string; tugash: string }

function oraliqlarniHisobla(): Oraliq[] {
  const bugun = new Date()
  return [
    {
      nom: 'Bu hafta',
      boshlanish: isoGa(startOfWeek(bugun, { weekStartsOn: 1 })),
      tugash: isoGa(endOfWeek(bugun, { weekStartsOn: 1 })),
    },
    {
      nom: 'Oxirgi 7 kun',
      boshlanish: isoGa(addDays(bugun, -6)),
      tugash: isoGa(bugun),
    },
    {
      nom: 'Bu oy',
      boshlanish: isoGa(startOfMonth(bugun)),
      tugash: isoGa(endOfMonth(bugun)),
    },
    {
      nom: 'Oxirgi 30 kun',
      boshlanish: isoGa(addDays(bugun, -29)),
      tugash: isoGa(bugun),
    },
  ]
}

const ORALIQLAR = oraliqlarniHisobla()

type KartaTuri = 'bajarildi' | 'qoldi' | 'kechikkan'

/** Foiz bo'yicha rang — 80%+ yashil, 40-79% sariq, 40% dan past qizil */
function holatRangi(foiz: number): string {
  if (foiz >= 80) return '#00bc55'
  if (foiz >= 40) return '#d97706'
  return '#dc2626'
}

export function HisobotKorinishi() {
  const [boshlanish, setBoshlanish] = useState(ORALIQLAR[0].boshlanish)
  const [tugash, setTugash] = useState(ORALIQLAR[0].tugash)
  const [ochiqKarta, setOchiqKarta] = useState<KartaTuri | null>(null)
  const [ochiqPapka, setOchiqPapka] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useHisobotVazifalari(
    boshlanish,
    tugash
  )
  const { data: papkalar } = usePapkalar()
  const papkaMap = useMemo(
    () => new Map(papkalar?.map((p) => [p.id, p])),
    [papkalar]
  )

  const bugun = bugunISO()
  const vazifalar = data ?? []

  const bajarilganlar = useMemo(
    () =>
      vazifalar.filter(
        (v) =>
          v.status === 'done' &&
          v.completed_at &&
          v.completed_at.slice(0, 10) >= boshlanish &&
          v.completed_at.slice(0, 10) <= tugash
      ),
    [vazifalar, boshlanish, tugash]
  )

  const rejaDoirasida = useMemo(
    () =>
      vazifalar.filter(
        (v) => v.due_date !== null && v.due_date >= boshlanish && v.due_date <= tugash
      ),
    [vazifalar, boshlanish, tugash]
  )

  const qolganlar = useMemo(
    () => rejaDoirasida.filter((v) => v.status !== 'done'),
    [rejaDoirasida]
  )

  const kechikkanlar = useMemo(
    () => qolganlar.filter((v) => v.due_date! < bugun),
    [qolganlar, bugun]
  )

  const papkaStatistika = useMemo(() => {
    const hisob = new Map<string, { jami: number; bajarilgan: number }>()
    for (const v of rejaDoirasida) {
      const h = hisob.get(v.folder_id) ?? { jami: 0, bajarilgan: 0 }
      h.jami += 1
      if (v.status === 'done') h.bajarilgan += 1
      hisob.set(v.folder_id, h)
    }
    return [...hisob.entries()]
      .map(([folderId, h]) => ({
        folder: papkaMap.get(folderId),
        folderId,
        ...h,
        foiz: Math.round((h.bajarilgan / h.jami) * 100),
      }))
      .filter((p) => p.folder)
      .sort((a, b) => a.foiz - b.foiz)
  }, [rejaDoirasida, papkaMap])

  function oraliqniTanla(o: Oraliq) {
    setBoshlanish(o.boshlanish)
    setTugash(o.tugash)
    setOchiqKarta(null)
    setOchiqPapka(null)
  }

  function qolToggle(karta: KartaTuri) {
    setOchiqKarta((eski) => (eski === karta ? null : karta))
  }

  const faolOraliq = ORALIQLAR.find(
    (o) => o.boshlanish === boshlanish && o.tugash === tugash
  )

  const KARTA_RUYXATI: Record<KartaTuri, Task[]> = {
    bajarildi: bajarilganlar,
    qoldi: qolganlar,
    kechikkan: kechikkanlar,
  }

  return (
    <Sahifa sarlavha="Hisobot" tavsif="Istalgan davr bo‘yicha natijalar">
      {/* Tezkor oraliqlar */}
      <div className="flex flex-wrap gap-2">
        {ORALIQLAR.map((o) => {
          const faol = faolOraliq?.nom === o.nom
          return (
            <button
              key={o.nom}
              type="button"
              onClick={() => oraliqniTanla(o)}
              aria-pressed={faol}
              className={`min-h-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
                faol
                  ? 'border-brand-primary bg-brand-soft text-brand-primary'
                  : 'border-border-subtle text-text-strong hover:bg-surface-muted'
              }`}
            >
              {o.nom}
            </button>
          )
        })}
      </div>

      {/* Erkin sana oralig'i */}
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-border-subtle bg-surface p-2">
        <input
          type="date"
          value={boshlanish}
          max={tugash}
          onChange={(e) => {
            setBoshlanish(e.target.value)
            setOchiqKarta(null)
            setOchiqPapka(null)
          }}
          aria-label="Boshlanish sanasi"
          className="min-h-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-sm text-text-strong outline-none"
        />
        <span className="text-text-faint">—</span>
        <input
          type="date"
          value={tugash}
          min={boshlanish}
          onChange={(e) => {
            setTugash(e.target.value)
            setOchiqKarta(null)
            setOchiqPapka(null)
          }}
          aria-label="Tugash sanasi"
          className="min-h-0 flex-1 rounded-lg bg-transparent px-2 py-2 text-sm text-text-strong outline-none"
        />
      </div>

      {isPending ? (
        <div className="mt-5">
          <Yuklanmoqda qator={3} />
        </div>
      ) : isError ? (
        <div className="mt-5">
          <XatoHolati qayta={() => refetch()} />
        </div>
      ) : (
        <>
          {/* Statistika kartalari — bosilsa shu davrdagi ro'yxat ochiladi */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatKarta
              ikonka={CircleCheck}
              son={bajarilganlar.length}
              matn="bajarildi"
              rang="#00bc55"
              faol={ochiqKarta === 'bajarildi'}
              bosilganda={() => qolToggle('bajarildi')}
            />
            <StatKarta
              ikonka={Clock}
              son={qolganlar.length}
              matn="qoldi"
              rang="#003933"
              faol={ochiqKarta === 'qoldi'}
              bosilganda={() => qolToggle('qoldi')}
            />
            <StatKarta
              ikonka={TriangleAlert}
              son={kechikkanlar.length}
              matn="kechikkan"
              rang="#dc2626"
              faol={ochiqKarta === 'kechikkan'}
              bosilganda={() => qolToggle('kechikkan')}
            />
          </div>

          {ochiqKarta && (
            <VazifaRoyxati
              vazifalar={KARTA_RUYXATI[ochiqKarta]}
              papkaMap={papkaMap}
              boshQatorMatni={
                ochiqKarta === 'bajarildi'
                  ? 'Bu davrda hali hech narsa bajarilmagan.'
                  : ochiqKarta === 'qoldi'
                    ? 'Bu davrda qolgan vazifa yo‘q.'
                    : 'Bu davrda kechikkan vazifa yo‘q.'
              }
            />
          )}

          {/* Papkalar bo'yicha holat — eng past foizlar birinchi */}
          <section className="mt-7">
            <h2 className="mb-2 px-1 text-sm font-semibold text-text-muted">
              Papkalar holati
            </h2>

            {papkaStatistika.length === 0 ? (
              <p className="rounded-2xl bg-surface p-4 text-center text-sm text-text-muted shadow-card">
                Bu davrda muddati belgilangan vazifa yo‘q.
              </p>
            ) : (
              <ul className="space-y-2">
                {papkaStatistika.map((p) => {
                  const Ikonka = papkaIkonkasi(
                    p.folder?.icon ?? null,
                    p.folder?.is_inbox
                  )
                  const ochiq = ochiqPapka === p.folderId
                  return (
                    <li
                      key={p.folderId}
                      className="overflow-hidden rounded-2xl bg-surface shadow-card"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOchiqPapka((eski) =>
                            eski === p.folderId ? null : p.folderId
                          )
                        }
                        aria-expanded={ochiq}
                        className="flex min-h-touch w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-muted"
                      >
                        <Ikonka
                          className="size-5 shrink-0"
                          style={{ color: p.folder?.color }}
                          aria-hidden
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-medium text-text-strong">
                              {p.folder?.name}
                            </span>
                            <span
                              className="shrink-0 text-sm font-semibold"
                              style={{ color: holatRangi(p.foiz) }}
                            >
                              {p.foiz}%
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${p.foiz}%`,
                                backgroundColor: holatRangi(p.foiz),
                              }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-text-faint">
                            {p.bajarilgan}/{p.jami} ta bajarildi
                          </p>
                        </div>
                        <ChevronDown
                          className={`size-4 shrink-0 text-text-faint transition ${
                            ochiq ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>

                      {ochiq && (
                        <div className="border-t border-border-subtle px-3 py-3">
                          <VazifaRoyxati
                            vazifalar={rejaDoirasida.filter(
                              (v) => v.folder_id === p.folderId
                            )}
                            papkaMap={papkaMap}
                            yashirPapka
                          />
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </Sahifa>
  )
}

function StatKarta({
  ikonka: Ikonka,
  son,
  matn,
  rang,
  faol,
  bosilganda,
}: {
  ikonka: typeof CircleCheck
  son: number
  matn: string
  rang: string
  faol: boolean
  bosilganda: () => void
}) {
  return (
    <button
      type="button"
      onClick={bosilganda}
      aria-pressed={faol}
      className={`min-h-0 rounded-2xl p-4 text-center shadow-card transition ${
        faol ? 'bg-brand-soft' : 'bg-surface hover:bg-surface-muted'
      }`}
    >
      <Ikonka className="mx-auto size-5" style={{ color: rang }} aria-hidden />
      <p className="mt-2 text-2xl font-bold text-text-strong">{son}</p>
      <p className="text-xs text-text-muted">{matn}</p>
    </button>
  )
}

function VazifaRoyxati({
  vazifalar,
  papkaMap,
  boshQatorMatni,
  yashirPapka = false,
}: {
  vazifalar: Task[]
  papkaMap: Map<string, { name: string; color: string }>
  boshQatorMatni?: string
  yashirPapka?: boolean
}) {
  const { otalar, bolalar } = iyerarxiya(vazifalar)
  const tartiblangan = saralash(otalar)

  if (tartiblangan.length === 0) {
    return (
      <BoshHolat
        ikonka={FolderOpen}
        sarlavha="Bo‘sh"
        matn={boshQatorMatni ?? 'Bu yerda vazifa yo‘q.'}
      />
    )
  }

  return (
    <ul className="mt-3 space-y-2">
      {tartiblangan.map((v) => {
        const papka = papkaMap.get(v.folder_id)
        return (
          <VazifaQatori
            key={v.id}
            vazifa={v}
            subtasklar={olBolalar(bolalar, v.id)}
            papkaNomi={yashirPapka ? undefined : papka?.name}
            papkaRangi={yashirPapka ? undefined : papka?.color}
          />
        )
      })}
    </ul>
  )
}
