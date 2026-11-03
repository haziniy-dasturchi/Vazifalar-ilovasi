'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  ChevronDown,
  EllipsisVertical,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { BoshHolat, XatoHolati, Yuklanmoqda } from '@/components/ui/holatlar'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { VazifaQatori } from '@/components/vazifa/vazifa-qatori'
import { InlineQoshish } from '@/components/vazifa/inline-qoshish'
import { PapkaOynasi } from '@/components/papka/papka-oynasi'
import {
  usePapkaOchirish,
  usePapkaYangilash,
  usePapkalar,
} from '@/lib/queries/papkalar'
import {
  useBolimOchirish,
  useBolimYangilash,
  useBolimYaratish,
  useBolimlar,
} from '@/lib/queries/bolimlar'
import { usePapkaVazifalari } from '@/lib/queries/vazifalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'
import type { Section, Task } from '@/types/vazifalar'

export function PapkaKorinishi({ papkaId }: { papkaId: string }) {
  const router = useRouter()
  const { korsat } = useToast()

  const { data: papkalar, isPending: papkalarYuklanmoqda } = usePapkalar()
  const { data: bolimlar, isPending: bolimlarYuklanmoqda } = useBolimlar(papkaId)
  const {
    data: vazifalar,
    isPending: vazifalarYuklanmoqda,
    isError,
    refetch,
  } = usePapkaVazifalari(papkaId)

  const yangilash = usePapkaYangilash()
  const ochirish = usePapkaOchirish()
  const bolimYaratish = useBolimYaratish(papkaId)

  const [menyuOchiq, setMenyuOchiq] = useState(false)
  const [tahrirOchiq, setTahrirOchiq] = useState(false)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)
  const [yangiBolim, setYangiBolim] = useState(false)
  const [bolimNomi, setBolimNomi] = useState('')

  const papka = papkalar?.find((p) => p.id === papkaId)
  const yuklanmoqda =
    papkalarYuklanmoqda || bolimlarYuklanmoqda || vazifalarYuklanmoqda

  if (!yuklanmoqda && !papka) {
    return (
      <Sahifa sarlavha="Papka topilmadi">
        <BoshHolat
          ikonka={ListChecks}
          sarlavha="Bunday papka yo‘q"
          matn="U o‘chirilgan bo‘lishi mumkin."
          harakat={{ matn: 'Bugunga qaytish', bajar: () => router.push('/bugun') }}
        />
      </Sahifa>
    )
  }

  const { otalar, bolalar } = iyerarxiya(vazifalar ?? [])
  const ochiqSoni = otalar.filter((v) => v.status !== 'done').length

  const bolimsiz = saralash(otalar.filter((v) => v.section_id === null))
  const bolimBoyicha = (bolim: Section) =>
    saralash(otalar.filter((v) => v.section_id === bolim.id))

  const Ikonka = papkaIkonkasi(papka?.icon ?? null, papka?.is_inbox)

  function qator(v: Task) {
    return (
      <VazifaQatori
        key={v.id}
        vazifa={v}
        subtasklar={subtasklar(bolalar, v.id)}
      />
    )
  }

  async function arxivla() {
    if (!papka) return
    try {
      await yangilash.mutateAsync({ id: papka.id, is_archived: true })
      korsat({ matn: 'Papka arxivlandi', tone: 'muvaffaqiyat' })
      router.push('/bugun')
    } catch {
      korsat({ matn: 'Arxivlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  async function papkaniOchir() {
    if (!papka) return
    try {
      await ochirish.mutateAsync(papka.id)
      korsat({ matn: 'Papka o‘chirildi', tone: 'muvaffaqiyat' })
      router.push('/bugun')
    } catch {
      korsat({ matn: 'O‘chirib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  async function bolimQosh() {
    const nom = bolimNomi.trim()
    if (!nom) {
      setYangiBolim(false)
      return
    }
    setBolimNomi('')
    setYangiBolim(false)
    try {
      await bolimYaratish.mutateAsync(nom)
    } catch {
      korsat({ matn: 'Bo‘lim qo‘shilmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <Sahifa
      sarlavha={papka?.name ?? '…'}
      tavsif={
        ochiqSoni > 0 ? `${ochiqSoni} ta ochiq vazifa` : 'Ochiq vazifa yo‘q'
      }
      belgi={
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: (papka?.color ?? '#9ca3af') + '1a' }}
        >
          <Ikonka
            className="size-5"
            style={{ color: papka?.color }}
            aria-hidden
          />
        </span>
      }
      harakat={
        papka && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenyuOchiq((v) => !v)}
              aria-label="Papka menyusi"
              aria-expanded={menyuOchiq}
              className="flex size-11 min-h-0 items-center justify-center rounded-xl text-text-muted transition hover:bg-surface-muted"
            >
              <EllipsisVertical className="size-5" aria-hidden />
            </button>

            {menyuOchiq && (
              <>
                <button
                  type="button"
                  aria-label="Menyuni yopish"
                  onClick={() => setMenyuOchiq(false)}
                  className="fixed inset-0 z-10 min-h-0 cursor-default"
                />
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1 shadow-float">
                  <button
                    type="button"
                    onClick={() => {
                      setMenyuOchiq(false)
                      setTahrirOchiq(true)
                    }}
                    className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
                  >
                    <Pencil className="size-4" aria-hidden />
                    Tahrirlash
                  </button>

                  {/* Kiruvchi papkani arxivlash va o'chirish mumkin emas */}
                  {!papka.is_inbox && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setMenyuOchiq(false)
                          arxivla()
                        }}
                        className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
                      >
                        <Archive className="size-4" aria-hidden />
                        Arxivlash
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenyuOchiq(false)
                          setOchirishOchiq(true)
                        }}
                        className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="size-4" aria-hidden />
                        O‘chirish
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )
      }
    >
      {yuklanmoqda ? (
        <Yuklanmoqda />
      ) : isError ? (
        <XatoHolati qayta={() => refetch()} />
      ) : (
        <>
          {/* Bo'limga tegishli bo'lmagan vazifalar */}
          <section className="mb-7">
            {bolimsiz.length > 0 ? (
              <ul className="mb-2 space-y-2">{bolimsiz.map(qator)}</ul>
            ) : (
              bolimlar?.length === 0 &&
              (papka?.is_inbox ? (
                <BoshHolat
                  rasm="/illustrations/empty-inbox.svg"
                  sarlavha="Kiruvchi bo‘sh"
                  matn="Hali vazifa yo‘q — + tugmasini bosing."
                />
              ) : (
                <BoshHolat
                  ikonka={ListChecks}
                  sarlavha="Bu papka bo‘sh"
                  matn="Hali vazifa yo‘q — + tugmasini bosing."
                />
              ))
            )}
            <InlineQoshish papkaId={papkaId} />
          </section>

          {bolimlar?.map((bolim) => (
            <BolimBloki
              key={bolim.id}
              bolim={bolim}
              papkaId={papkaId}
              vazifalar={bolimBoyicha(bolim)}
              qator={qator}
            />
          ))}

          {/* Yangi bo'lim */}
          {yangiBolim ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                bolimQosh()
              }}
              className="mt-2 rounded-xl bg-surface p-2 shadow-card"
            >
              <input
                value={bolimNomi}
                onChange={(e) => setBolimNomi(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setBolimNomi('')
                    setYangiBolim(false)
                  }
                }}
                placeholder="Bo‘lim nomi"
                maxLength={120}
                autoFocus
                className="min-h-touch w-full bg-transparent px-2 text-base font-semibold text-text-strong outline-none placeholder:font-normal placeholder:text-text-faint"
              />
              <div className="flex justify-end gap-2 px-1 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setBolimNomi('')
                    setYangiBolim(false)
                  }}
                  className="min-h-0 rounded-lg px-3 py-2 text-sm text-text-muted transition hover:bg-surface-muted"
                >
                  Bekor
                </button>
                <button
                  type="submit"
                  disabled={!bolimNomi.trim()}
                  className="min-h-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
                >
                  Qo‘shish
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setYangiBolim(true)}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-faint transition hover:bg-surface-muted hover:text-brand-primary"
            >
              <Plus className="size-4" aria-hidden />
              Bo‘lim qo‘shish
            </button>
          )}
        </>
      )}

      {tahrirOchiq && papka && (
        <PapkaOynasi papka={papka} yop={() => setTahrirOchiq(false)} />
      )}

      {ochirishOchiq && papka && (
        <Tasdiq
          sarlavha="Papkani o‘chirish"
          matn={`"${papka.name}" papkasi va undagi ${otalar.length} ta vazifa butunlay o‘chadi. Buni qaytarib bo‘lmaydi.`}
          tasdiqla={papkaniOchir}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </Sahifa>
  )
}

// -------------------------------------------------------------
// Bo'lim bloki
// -------------------------------------------------------------
function BolimBloki({
  bolim,
  papkaId,
  vazifalar,
  qator,
}: {
  bolim: Section
  papkaId: string
  vazifalar: Task[]
  qator: (v: Task) => React.ReactNode
}) {
  const yangilash = useBolimYangilash(papkaId)
  const ochirish = useBolimOchirish(papkaId)
  const { korsat } = useToast()

  const [menyuOchiq, setMenyuOchiq] = useState(false)
  const [tahrir, setTahrir] = useState(false)
  const [nom, setNom] = useState(bolim.name)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)

  const yopiq = bolim.is_collapsed
  const ochiqSoni = vazifalar.filter((v) => v.status !== 'done').length

  async function nomniSaqla() {
    const tozalangan = nom.trim()
    setTahrir(false)
    if (!tozalangan || tozalangan === bolim.name) {
      setNom(bolim.name)
      return
    }
    try {
      await yangilash.mutateAsync({ id: bolim.id, name: tozalangan })
    } catch {
      setNom(bolim.name)
      korsat({ matn: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  return (
    <section className="mb-7">
      <div className="mb-2 flex items-center gap-1 px-1">
        <button
          type="button"
          onClick={() =>
            yangilash.mutate({ id: bolim.id, is_collapsed: !yopiq })
          }
          aria-expanded={!yopiq}
          aria-label={yopiq ? 'Ochish' : 'Yopish'}
          className="flex size-8 min-h-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted"
        >
          <ChevronDown
            className={`size-4 transition ${yopiq ? '-rotate-90' : ''}`}
            aria-hidden
          />
        </button>

        {tahrir ? (
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            onBlur={nomniSaqla}
            onKeyDown={(e) => {
              if (e.key === 'Enter') nomniSaqla()
              if (e.key === 'Escape') {
                setNom(bolim.name)
                setTahrir(false)
              }
            }}
            autoFocus
            maxLength={120}
            className="flex-1 rounded-lg bg-surface px-2 py-1 text-sm font-semibold text-text-strong outline-none"
          />
        ) : (
          <h2 className="flex-1 text-sm font-semibold text-text-strong">
            {bolim.name}
            <span className="ml-2 font-normal text-text-faint">
              {ochiqSoni}
            </span>
          </h2>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenyuOchiq((v) => !v)}
            aria-label="Bo‘lim menyusi"
            className="flex size-8 min-h-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted"
          >
            <EllipsisVertical className="size-4" aria-hidden />
          </button>

          {menyuOchiq && (
            <>
              <button
                type="button"
                aria-label="Menyuni yopish"
                onClick={() => setMenyuOchiq(false)}
                className="fixed inset-0 z-10 min-h-0 cursor-default"
              />
              <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-border-subtle bg-surface py-1 shadow-float">
                <button
                  type="button"
                  onClick={() => {
                    setMenyuOchiq(false)
                    setTahrir(true)
                  }}
                  className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
                >
                  <Pencil className="size-4" aria-hidden />
                  Nomini o‘zgartirish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenyuOchiq(false)
                    setOchirishOchiq(true)
                  }}
                  className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 className="size-4" aria-hidden />
                  O‘chirish
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {!yopiq && (
        <>
          {vazifalar.length > 0 && (
            <ul className="mb-2 space-y-2">{vazifalar.map(qator)}</ul>
          )}
          <InlineQoshish papkaId={papkaId} bolimId={bolim.id} />
        </>
      )}

      {ochirishOchiq && (
        <Tasdiq
          sarlavha="Bo‘limni o‘chirish"
          matn={`"${bolim.name}" bo‘limi va undagi ${vazifalar.length} ta vazifa o‘chadi. Buni qaytarib bo‘lmaydi.`}
          tasdiqla={async () => {
            try {
              await ochirish.mutateAsync(bolim.id)
              setOchirishOchiq(false)
            } catch {
              korsat({
                matn: 'O‘chirib bo‘lmadi. Qayta urinib ko‘ring.',
                tone: 'xato',
              })
            }
          }}
          yop={() => setOchirishOchiq(false)}
          bajarilmoqda={ochirish.isPending}
        />
      )}
    </section>
  )
}
