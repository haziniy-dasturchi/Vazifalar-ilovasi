'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { addDays, endOfMonth, endOfWeek, startOfMonth, startOfWeek } from 'date-fns'
import {
  ChevronDown,
  CircleCheck,
  Clock,
  Flame,
  FolderOpen,
  TriangleAlert,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import {
  useFoizJurnali,
  useHisobotVazifalari,
  usePapkaningBarchaVazifalari,
} from '@/lib/queries/hisobot'
import { usePapkalar } from '@/lib/queries/papkalar'
import { useBarchaBolimlar } from '@/lib/queries/bolimlar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { bugunISO, isoGa, toliqSana } from '@/lib/sana'
import { iyerarxiya, saralash, subtasklar as olBolalar } from '@/lib/vazifa-yordam'
import type { Task } from '@/types/vazifalar'

type Oraliq = { nom: string; boshlanish: string; tugash: string }

function oraliqlarniHisobla(): Oraliq[] {
  const bugun = new Date()
  return [
    {
      nom: 'Bugun',
      boshlanish: isoGa(bugun),
      tugash: isoGa(bugun),
    },
    {
      nom: 'Kecha',
      boshlanish: isoGa(addDays(bugun, -1)),
      tugash: isoGa(addDays(bugun, -1)),
    },
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
/** Dastlab ochilganda tanlangan bo'lib turadigan oraliq */
const BOSHLANGICH_ORALIQ =
  ORALIQLAR.find((o) => o.nom === 'Bu hafta') ?? ORALIQLAR[0]

type KartaTuri = 'bajarildi' | 'qoldi' | 'kechikkan'

/** Foiz bo'yicha rang — 80%+ yashil, 40-79% sariq, 40% dan past qizil */
function holatRangi(foiz: number): string {
  if (foiz >= 80) return '#10b981'
  if (foiz >= 40) return '#d97706'
  return '#dc2626'
}

export function HisobotKorinishi() {
  const [boshlanish, setBoshlanish] = useState(BOSHLANGICH_ORALIQ.boshlanish)
  const [tugash, setTugash] = useState(BOSHLANGICH_ORALIQ.tugash)
  const [ochiqKarta, setOchiqKarta] = useState<KartaTuri | null>(null)
  const [ochiqPapka, setOchiqPapka] = useState<string | null>(null)

  const { data, isPending, isError, refetch } = useHisobotVazifalari(
    boshlanish,
    tugash
  )
  const { data: papkalar } = usePapkalar()
  const { data: barchaBolimlar } = useBarchaBolimlar()
  const loyihalarPapka = papkalar?.find((p) => p.is_projects)
  const { data: loyihaVazifalari } = usePapkaningBarchaVazifalari(
    loyihalarPapka?.id
  )
  const papkaMap = useMemo(
    () => new Map(papkalar?.map((p) => [p.id, p])),
    [papkalar]
  )
  const bolimNomlari = useMemo(
    () => new Map((barchaBolimlar ?? []).map((b) => [b.id, b.name])),
    [barchaBolimlar]
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

  /**
   * Loyihalar papkasi ichidagi har bir loyiha (bo'lim) bo'yicha holat.
   * Bu yerda davr filtri QO'LLANMAYDI — loyiha bu uzluksiz ish, uning
   * umumiy tugallanganlik darajasi muhim (Zeygarnik effekti: tugallanmagan
   * ish yodda qolib, tugatishga undaydi).
   */
  const loyihaStatistika = useMemo(() => {
    if (!loyihalarPapka) return []

    const loyihalar = (barchaBolimlar ?? []).filter(
      (b) => b.folder_id === loyihalarPapka.id
    )
    if (loyihalar.length === 0) return []

    const hisob = new Map<string, { jami: number; bajarilgan: number }>()
    for (const v of loyihaVazifalari ?? []) {
      if (!v.section_id) continue
      const h = hisob.get(v.section_id) ?? { jami: 0, bajarilgan: 0 }
      h.jami += 1
      if (v.status === 'done') h.bajarilgan += 1
      hisob.set(v.section_id, h)
    }

    return loyihalar
      .map((b) => {
        const h = hisob.get(b.id) ?? { jami: 0, bajarilgan: 0 }
        return {
          id: b.id,
          nom: b.name,
          ...h,
          qolgan: h.jami - h.bajarilgan,
          foiz: h.jami === 0 ? 0 : Math.round((h.bajarilgan / h.jami) * 100),
        }
      })
      .sort((a, b) => a.foiz - b.foiz)
  }, [loyihalarPapka, barchaBolimlar, loyihaVazifalari])

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
              rang="#10b981"
              faol={ochiqKarta === 'bajarildi'}
              bosilganda={() => qolToggle('bajarildi')}
            />
            <StatKarta
              ikonka={Clock}
              son={qolganlar.length}
              matn="qoldi"
              rang="#0b3d2e"
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
              bolimNomlari={bolimNomlari}
              boshQatorMatni={
                ochiqKarta === 'bajarildi'
                  ? 'Bu davrda hali hech narsa bajarilmagan.'
                  : ochiqKarta === 'qoldi'
                    ? 'Bu davrda qolgan vazifa yo‘q.'
                    : 'Bu davrda kechikkan vazifa yo‘q.'
              }
            />
          )}

          {/* Loyihalar holati — davr filtridan mustaqil, umumiy progress */}
          {loyihaStatistika.length > 0 && (
            <LoyihalarHolati
              loyihalar={loyihaStatistika}
              papkaId={loyihalarPapka?.id}
            />
          )}

          <FoizTarixi boshlanish={boshlanish} tugash={tugash} />

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
  bolimNomlari,
  boshQatorMatni,
  yashirPapka = false,
}: {
  vazifalar: Task[]
  papkaMap: Map<string, { name: string; color: string }>
  bolimNomlari?: Map<string, string>
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
            bolimNomi={
              v.section_id ? bolimNomlari?.get(v.section_id) : undefined
            }
          />
        )
      })}
    </ul>
  )
}

/**
 * Loyihalar holati — Zeygarnik effekti.
 *
 * Tugallanmagan ish ongda "ochiq" bo'lib qoladi va tugatishga undaydi.
 * Shu sababli bu yerda ataylab QOLGAN ishlar soni ta'kidlanadi va
 * tugallanmagan loyihalar yuqorida turadi: "yana 3 ta qoldi" degan
 * aniq raqam "60% bajarildi" dan ko'ra kuchliroq turtki beradi.
 */
function LoyihalarHolati({
  loyihalar,
  papkaId,
}: {
  loyihalar: {
    id: string
    nom: string
    jami: number
    bajarilgan: number
    qolgan: number
    foiz: number
  }[]
  papkaId?: string
}) {
  const tugallanmagan = loyihalar.filter((l) => l.jami > 0 && l.foiz < 100)
  const engYaqin = [...tugallanmagan].sort((a, b) => b.foiz - a.foiz)[0]

  return (
    <section className="mt-7">
      <h2 className="mb-2 px-1 text-sm font-semibold text-text-muted">
        Loyihalar holati
      </h2>

      {/* Zeygarnik turtkisi — tugatishga eng yaqin loyihani ko'rsatadi */}
      {engYaqin && (
        <div className="mb-3 flex items-start gap-3 rounded-2xl bg-brand-primary px-4 py-3 text-white">
          <Flame className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">{engYaqin.nom}</span> loyihasi{' '}
            {engYaqin.foiz}% bajarildi — tugatishga{' '}
            <span className="font-semibold">
              atigi {engYaqin.qolgan} ta ish
            </span>{' '}
            qoldi. Bugun yakunlab qo‘ying!
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {loyihalar.map((l) => {
          const tugagan = l.jami > 0 && l.foiz === 100
          return (
            <li key={l.id} className="rounded-2xl bg-surface p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-text-strong">
                  {l.nom}
                </span>
                <span
                  className="shrink-0 text-sm font-semibold"
                  style={{ color: holatRangi(l.foiz) }}
                >
                  {l.foiz}%
                </span>
              </div>

              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${l.foiz}%`,
                    backgroundColor: holatRangi(l.foiz),
                  }}
                />
              </div>

              <p className="mt-1 text-xs text-text-faint">
                {l.jami === 0
                  ? 'Hali vazifa qo‘shilmagan'
                  : tugagan
                    ? `Tugallandi — ${l.jami} ta ishning hammasi bajarildi`
                    : `${l.bajarilgan}/${l.jami} ta bajarildi · yana ${l.qolgan} ta qoldi`}
              </p>
            </li>
          )
        })}
      </ul>

      {papkaId && (
        <Link
          href={`/papka/${papkaId}`}
          className="mt-3 flex min-h-touch items-center justify-center rounded-xl border border-border-subtle text-sm font-medium text-text-strong transition hover:bg-surface-muted"
        >
          Loyihalar papkasini ochish
        </Link>
      )}
    </section>
  )
}

/**
 * Davr ichida foizi oshgan vazifalar.
 *
 * Bir kunda tugamaydigan ishlar uchun muhim: vazifa keyin ertangi
 * kunga ko'chirilsa ham, bugun qilingan ish shu yerda ko'rinib turadi.
 */
function FoizTarixi({
  boshlanish,
  tugash,
}: {
  boshlanish: string
  tugash: string
}) {
  const { data, isPending } = useFoizJurnali(boshlanish, tugash)

  if (isPending || !data || data.length === 0) return null

  const jami = data.reduce((s, y) => s + y.osish, 0)

  return (
    <section className="mt-7">
      <h2 className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold text-text-muted">
        Qisman bajarilgan ishlar
        <span className="font-normal text-text-faint">+{jami}%</span>
      </h2>

      <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
        {data.map((y) => (
          <li
            key={y.task_id}
            className="flex items-center gap-3 border-b border-border-subtle px-4 py-3 last:border-0"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-text-strong">
              {y.sarlavha}
            </span>
            <div className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-brand-accent"
                style={{ width: `${Math.min(y.osish, 100)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-semibold text-brand-primary">
              +{y.osish}%
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
