'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Archive,
  ChevronDown,
  CircleCheckBig,
  EllipsisVertical,
  FolderKanban,
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
import { useT } from '@/components/app/til-provayder'
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
import {
  LOYIHA_HOLATLARI,
  loyihalarniGuruhla,
  type LoyihaHolati,
} from '@/lib/loyiha-guruhlari'
import { iyerarxiya, saralash, subtasklar } from '@/lib/vazifa-yordam'
import type { MatnKaliti } from '@/lib/i18n'
import type { Section, Task } from '@/types/vazifalar'

export function PapkaKorinishi({ papkaId }: { papkaId: string }) {
  const router = useRouter()
  const { korsat } = useToast()
  // Hook erta `return` dan OLDIN chaqirilishi shart — papka
  // topilmaganda komponent shartli ravishda qaytadi
  const t = useT()

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
          harakat={{
            matn: 'Bosh sahifaga qaytish',
            bajar: () => router.push('/jarayonda'),
          }}
        />
      </Sahifa>
    )
  }

  const { otalar, bolalar } = iyerarxiya(vazifalar ?? [])
  const ochiqSoni = otalar.filter((v) => v.status !== 'done').length

  /*
    Bajarilgan ishlar papka va loyihalarda KO'RSATILMAYDI.

    Nega: ular to'planib borgani sari ro'yxat uzayib, hali
    qilinmagan ish ko'zdan yo'qoladi -- papkaning butun foydasi
    shunda edi. Tugagan ish esa endi harakat talab qilmaydi,
    uning o'rni Hisobot sahifasida.

    MUHIM: faqat KO'RINISH filtrlanadi. Sonlar (nechtadan nechta
    bajarildi, qancha qoldi) to'liq ro'yxatdan hisoblanadi.
  */
  const bolimsiz = saralash(
    otalar.filter((v) => v.section_id === null && v.status !== 'done')
  )
  const bolimBoyicha = (bolim: Section) =>
    saralash(otalar.filter((v) => v.section_id === bolim.id))

  const Ikonka = papkaIkonkasi(papka?.icon ?? null, papka?.is_inbox)
  /** Loyihalar papkasida "bo'lim" aslida loyiha — nomlanishi boshqa */
  const loyihalarmi = Boolean(papka?.is_projects)

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
      router.push('/jarayonda')
    } catch {
      korsat({ matn: 'Arxivlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  async function papkaniOchir() {
    if (!papka) return
    try {
      await ochirish.mutateAsync(papka.id)
      korsat({ matn: 'Papka o‘chirildi', tone: 'muvaffaqiyat' })
      router.push('/jarayonda')
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
      await bolimYaratish.mutateAsync({ folder_id: papkaId, name: nom })
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
                  {!papka.is_inbox && !papka.is_projects && (
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
                        className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-danger transition hover:bg-danger-soft"
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
          {/*
            Loyihalar papkasi nima uchun boshqacha ekanini bir marta
            tushuntiramiz. U hammada sukut bo'yicha turadi, lekin
            oddiy papkadan farqi hech qayerda aytilmagandi — odam
            uni shunchaki yana bitta papka deb o'ylardi.
          */}
          {loyihalarmi && (
            <div className="mb-5 flex items-start gap-4 rounded-2xl bg-brand-soft px-5 py-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary">
                <FolderKanban className="size-5 text-white" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-text-strong">
                  {t('loyiha.bolimi')}
                  {(bolimlar?.length ?? 0) > 0 && (
                    <span className="ml-2 font-normal text-text-muted">
                      {t('loyiha.soni', { son: bolimlar?.length ?? 0 })}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-text-muted">
                  {t('loyiha.izoh')}
                </p>
              </div>
            </div>
          )}

          {/* Bo'limga tegishli bo'lmagan vazifalar */}
          <section className="mb-7">
            {bolimsiz.length > 0 ? (
              <ul className="mb-2 space-y-2">{bolimsiz.map(qator)}</ul>
            ) : (
              bolimlar?.length === 0 &&
              /*
                Papkada vazifa bor, lekin hammasi bajarilgan --
                "bo'sh" deyish noto'g'ri bo'lardi: odam ishlarim
                qayoqqa ketdi deb o'ylaydi. Shuning uchun alohida
                xabar va ular qayerdaligi aytiladi.
              */
              (otalar.length > 0 ? (
                <BoshHolat
                  ikonka={CircleCheckBig}
                  sarlavha={t('papka.hammasiBajarildi')}
                  matn={t('papka.hammasiBajarildiMatn')}
                />
              ) : papka?.is_inbox ? (
                <BoshHolat
                  rasm="/illustrations/empty-inbox.svg"
                  sarlavha="Kiruvchi bo‘sh"
                  matn="Hali vazifa yo‘q — + tugmasini bosing."
                />
              ) : loyihalarmi ? (
                <BoshHolat
                  ikonka={ListChecks}
                  sarlavha="Hali loyiha yo‘q"
                  matn="Har bir loyihangiz shu papka ichida alohida bo‘lim bo‘ladi. Pastdagi “Loyiha qo‘shish” tugmasidan boshlang."
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

          {/*
            Loyihalar papkasida bo'limlar holati bo'yicha guruhlanadi:
            jarayondagilar tepada, tugaganlari pastda va yig'ilgan
            holda. Oddiy papkada bunday guruhlash ma'nosiz — u yerda
            bo'lim bu shunchaki mavzu, "bajarilgan bo'lim" degan tushuncha
            yo'q.
          */}
          {loyihalarmi ? (
            <LoyihalarRoyxati
              bolimlar={bolimlar ?? []}
              papkaId={papkaId}
              bolimVazifalari={bolimBoyicha}
              qator={qator}
            />
          ) : (
            bolimlar?.map((bolim) => (
              <BolimBloki
                key={bolim.id}
                bolim={bolim}
                papkaId={papkaId}
                vazifalar={bolimBoyicha(bolim)}
                qator={qator}
              />
            ))
          )}

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
                placeholder={loyihalarmi ? 'Loyiha nomi' : 'Bo‘lim nomi'}
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
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-text-faint transition hover:bg-surface-muted hover:text-brand-onsoft"
            >
              <Plus className="size-4" aria-hidden />
              {loyihalarmi ? 'Loyiha qo‘shish' : 'Bo‘lim qo‘shish'}
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
// Loyihalar ro'yxati — holat bo'yicha uchta guruh
// -------------------------------------------------------------

const GURUH_KALITI: Record<LoyihaHolati, MatnKaliti> = {
  jarayonda: 'loyiha.guruh.jarayonda',
  rejada: 'loyiha.guruh.rejada',
  bajarilgan: 'loyiha.guruh.bajarilgan',
}

/**
 * Loyihalar uch guruhda: jarayondagilar → rejadagilar → bajarilganlar.
 *
 * Guruhlash har chizilishda qaytadan hisoblanadi (keshdagi vazifalar
 * bo'yicha), shuning uchun vazifa bajarilishi bilan loyiha o'zi
 * kerakli guruhga ko'chadi — sahifani yangilash shart emas.
 *
 * `useMemo` ataylab ishlatilmagan: loyihalar soni o'nlab, hisob
 * arzon, bog'liqliklar ro'yxati esa xato manbai bo'lardi.
 */
function LoyihalarRoyxati({
  bolimlar,
  papkaId,
  bolimVazifalari,
  qator,
}: {
  bolimlar: Section[]
  papkaId: string
  bolimVazifalari: (bolim: Section) => Task[]
  qator: (v: Task) => React.ReactNode
}) {
  const t = useT()
  // Tugagan loyihalar sukut bo'yicha yig'ilgan — ular faqat tarix
  const [bajarilganOchiq, setBajarilganOchiq] = useState(false)

  const guruhlar = loyihalarniGuruhla(bolimlar, (bolim) => {
    const vazifalar = bolimVazifalari(bolim)
    return {
      jami: vazifalar.length,
      bajarilgan: vazifalar.filter((v) => v.status === 'done').length,
    }
  })

  return (
    <>
      {LOYIHA_HOLATLARI.map((holat) => {
        const royxat = guruhlar[holat]
        if (royxat.length === 0) return null

        const yigiladigan = holat === 'bajarilgan'
        const ochiq = !yigiladigan || bajarilganOchiq

        const sarlavha = (
          <>
            <span className="flex-1 text-sm font-semibold text-text-muted">
              {t(GURUH_KALITI[holat])}
            </span>
            <span className="shrink-0 text-sm font-normal text-text-faint">
              {royxat.length}
            </span>
          </>
        )

        return (
          <section key={holat} className="mb-5">
            {yigiladigan ? (
              <button
                type="button"
                onClick={() => setBajarilganOchiq((v) => !v)}
                aria-expanded={ochiq}
                aria-label={t('loyiha.soni', { son: royxat.length })}
                className="mb-2 flex w-full min-h-0 items-center gap-2 rounded-lg px-1 py-2 text-left transition hover:bg-surface-muted"
              >
                <ChevronDown
                  className={`size-4 shrink-0 text-text-faint transition ${
                    ochiq ? '' : '-rotate-90'
                  }`}
                  aria-hidden
                />
                {sarlavha}
              </button>
            ) : (
              <div className="mb-2 flex items-center gap-2 px-1 py-2">
                {sarlavha}
              </div>
            )}

            {ochiq &&
              royxat.map((bolim) => (
                <BolimBloki
                  key={bolim.id}
                  bolim={bolim}
                  papkaId={papkaId}
                  vazifalar={bolimVazifalari(bolim)}
                  qator={qator}
                  loyihami
                />
              ))}
          </section>
        )
      })}
    </>
  )
}

// -------------------------------------------------------------
// Bo'lim bloki
// -------------------------------------------------------------

/** Foiz bo'yicha rang — Hisobot sahifasidagi bilan bir xil shkala */
function foizRangi(foiz: number): string {
  if (foiz >= 80) return '#10b981'
  if (foiz >= 40) return '#d97706'
  return '#dc2626'
}

function BolimBloki({
  bolim,
  papkaId,
  vazifalar,
  qator,
  loyihami = false,
}: {
  bolim: Section
  papkaId: string
  vazifalar: Task[]
  qator: (v: Task) => React.ReactNode
  /** Loyihalar papkasida bo'lim = loyiha; progress ko'rsatiladi */
  loyihami?: boolean
}) {
  const yangilash = useBolimYangilash(papkaId)
  const ochirish = useBolimOchirish(papkaId)
  const { korsat } = useToast()

  const [menyuOchiq, setMenyuOchiq] = useState(false)
  const [tahrir, setTahrir] = useState(false)
  const [nom, setNom] = useState(bolim.name)
  const [ochirishOchiq, setOchirishOchiq] = useState(false)

  const yopiq = bolim.is_collapsed
  // Sonlar BARCHA vazifalardan hisoblanadi...
  const ochiqSoni = vazifalar.filter((v) => v.status !== 'done').length
  const jami = vazifalar.length
  const bajarilgan = jami - ochiqSoni
  // ...ro'yxatda esa faqat hali qilinmaganlari ko'rinadi
  const korinadigan = vazifalar.filter((v) => v.status !== 'done')
  const foiz = jami === 0 ? 0 : Math.round((bajarilgan / jami) * 100)

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
    /*
      Loyiha alohida kartada — chegara, fon va soya bilan.

      Nega: loyihalar bir ro'yxatda ketma-ket turganda qaysi vazifa
      qaysi loyihaga tegishli ekani ko'rinmasdi; progress chizig'i ham
      yuqoridagi loyihanikimi yoki pastdagisinikimi — ajratib
      bo'lmasdi. Oddiy bo'limlar esa kartaga o'ralmaydi: ular bitta
      papka ichidagi guruhlar, ularni bir-biridan ajratish shart emas
      va karta ortiqcha "shovqin" qo'shardi.
    */
    <section
      className={
        loyihami
          ? // `shadow-raised` ataylab kuchliroq: o'lchab ko'rilganda
            // yorug' mavzuda chegara fondan atigi 1.16 farq qiladi —
            // bu odatiy karta uchun yetarli, lekin loyihalar
            // bir-biridan aniq ajralib turishi kerak, shuning uchun
            // asosiy ajratuvchi vazifani soya bajaradi.
            'mb-5 rounded-2xl border border-border-subtle bg-surface p-3 shadow-raised md:p-4'
          : 'mb-7'
      }
    >
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

        {/* Loyiha bajarilish darajasi — sarlavha yonida */}
        {loyihami && jami > 0 && (
          <span
            className="shrink-0 text-xs font-semibold"
            style={{ color: foizRangi(foiz) }}
          >
            {foiz}%
          </span>
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
                  className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-danger transition hover:bg-danger-soft"
                >
                  <Trash2 className="size-4" aria-hidden />
                  O‘chirish
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Loyiha progressi — Zeygarnik: qolgan ishlar soni ta'kidlanadi */}
      {loyihami && jami > 0 && (
        <div className="mb-3 px-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${foiz}%`, backgroundColor: foizRangi(foiz) }}
            />
          </div>
          <p className="mt-1 text-xs text-text-faint">
            {ochiqSoni === 0
              ? `Tugallandi — ${jami} ta ishning hammasi bajarildi`
              : `${bajarilgan}/${jami} ta bajarildi · yana ${ochiqSoni} ta qoldi`}
          </p>
        </div>
      )}

      {!yopiq && (
        <>
          {korinadigan.length > 0 && (
            <ul className="mb-2 space-y-2">{korinadigan.map(qator)}</ul>
          )}
          <InlineQoshish papkaId={papkaId} bolimId={bolim.id} />
        </>
      )}

      {ochirishOchiq && (
        <Tasdiq
          sarlavha={loyihami ? 'Loyihani o‘chirish' : 'Bo‘limni o‘chirish'}
          matn={`"${bolim.name}" ${loyihami ? 'loyihasi' : 'bo‘limi'} va undagi ${vazifalar.length} ta vazifa o‘chadi. Buni qaytarib bo‘lmaydi.`}
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
