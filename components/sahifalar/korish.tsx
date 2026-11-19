'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  CircleCheck,
  Clock,
  Moon,
  Play,
  Plus,
  Send,
  Settings,
  TriangleAlert,
} from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { Yuklanmoqda } from '@/components/ui/holatlar'
import { PapkaOynasi } from '@/components/papka/papka-oynasi'
import { HisobOchirish } from '@/components/app/hisob-ochirish'
import { useT } from '@/components/app/til-provayder'
import {
  useBugungiVazifalar,
  useJarayondagiVazifalar,
} from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { useKelganTopshiriqlar } from '@/lib/queries/topshiriqlar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { bugunISO, sarlavhaSana } from '@/lib/sana'
import { iyerarxiya } from '@/lib/vazifa-yordam'

export function KorishKorinishi() {
  const t = useT()
  const { data, isPending } = useBugungiVazifalar()
  const { data: jarayondaData, isPending: jarayondaYuklanmoqda } =
    useJarayondagiVazifalar()
  const { data: papkalar } = useFaolPapkalar()
  const { data: kelganTopshiriqlar } = useKelganTopshiriqlar()
  const kutilayotganTopshiriq =
    kelganTopshiriqlar?.filter((x) => x.holat === 'kutilmoqda').length ?? 0
  const [papkaOchiq, setPapkaOchiq] = useState(false)

  const bugun = bugunISO()
  const vazifalar = data ?? []

  // Loyihalar papkasi alohida ko'rsatiladi — yon paneldagidek
  const loyihalarPapkasi = papkalar?.find((p) => p.is_projects)
  const oddiyPapkalar = papkalar?.filter((p) => !p.is_projects) ?? []

  function papkaQatori(papka: (typeof oddiyPapkalar)[number]) {
    const Ikonka = papkaIkonkasi(papka.icon, papka.is_inbox)
    return (
      <li key={papka.id} className="border-b border-border-subtle last:border-0">
        <Link
          href={`/papka/${papka.id}`}
          className="flex min-h-touch items-center gap-3 px-4 py-3 transition hover:bg-surface-muted"
        >
          <Ikonka
            className="size-5 shrink-0"
            style={{ color: papka.color }}
            aria-hidden
          />
          <span className="flex-1 truncate text-base text-text-strong">
            {papka.name}
          </span>
        </Link>
      </li>
    )
  }

  // "Jarayonda" sahifasi bilan bir xil sanaladi (iyerarxiya bo'yicha),
  // aks holda ikki joyda ikki xil son chiqib, ishonchni yo'qotardi.
  const { otalar: jarayondagilar } = iyerarxiya(jarayondaData ?? [])
  const jarayonda = jarayondagilar.length

  const bajarilgan = vazifalar.filter((v) => v.status === 'done').length
  // Boshlanganlar alohida kartada sanaladi — bu yerda faqat hali
  // boshlanmaganlar ('planned'), shunda sonlar takrorlanmaydi.
  const kechikkan = vazifalar.filter(
    (v) => v.status === 'planned' && v.due_date !== null && v.due_date < bugun
  ).length
  const qolgan = vazifalar.filter(
    (v) => v.status === 'planned' && v.due_date === bugun
  ).length

  return (
    <Sahifa sarlavha="Ko‘rish" tavsif={sarlavhaSana()}>
      {isPending || jarayondaYuklanmoqda ? (
        <Yuklanmoqda qator={2} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Karta
              ikonka={Play}
              son={jarayonda}
              matn="jarayonda"
              rang="#d97706"
              href="/jarayonda"
            />
            <Karta
              ikonka={CircleCheck}
              son={bajarilgan}
              matn="bajarildi"
              rang="#10b981"
              href="/bugun"
            />
            <Karta
              ikonka={Clock}
              son={qolgan}
              matn="qoldi"
              rang="#0b3d2e"
              href="/bugun"
            />
            <Karta
              ikonka={TriangleAlert}
              son={kechikkan}
              matn="kechikkan"
              rang="#dc2626"
              href="/bugun"
            />
          </div>

          <section className="mt-7 space-y-3">
            <KelgusiKarta
              ikonka={Moon}
              sarlavha="Kechki reja"
              matn="Ertangi kun uchun vazifalarni oldindan belgilab qo‘ying."
              href="/kechki-reja"
            />
            <KelgusiKarta
              ikonka={BarChart3}
              sarlavha="Hisobot"
              matn="Istalgan davr bo‘yicha bajarilgan va qolgan ishlar, papkalar holati."
              href="/hisobot"
            />
            <KelgusiKarta
              ikonka={BookOpen}
              sarlavha="Yo‘riqnoma"
              matn="Ilova qanday ishlashini qisqa va sodda tarzda bilib oling."
              href="/yoriqnoma"
            />
            {/* Bildirishnoma va ko'rinish endi Sozlamalar sahifasida —
                bir sozlama ikki joyda turgani chalkashlik tug'diradi */}
            {/* Telefonda yon panel yo'q — topshiriqlarga shu yerdan
                o'tiladi. Javob kutayotganlari soni ham ko'rinadi. */}
            <KelgusiKarta
              ikonka={Send}
              sarlavha={t('topshiriq.bolimi')}
              matn={
                kutilayotganTopshiriq > 0
                  ? t('topshiriq.holat.kutilmoqda') +
                    ' — ' +
                    kutilayotganTopshiriq
                  : t('topshiriq.boshKelganMatn')
              }
              href="/topshiriqlar"
            />
            <KelgusiKarta
              ikonka={Settings}
              sarlavha="Sozlamalar"
              matn="Profil rasmi, ko‘rinish, yon panel tartibi va bildirishnomalar."
              href="/sozlamalar"
            />
          </section>

          {/* Loyihalar — papkalardan YUQORIDA, alohida bo'limda.
              Yon paneldagi tartib bilan bir xil bo'lishi kerak:
              ikki joyda ikki xil joylashuv chalkashlik tug'diradi. */}
          {loyihalarPapkasi && (
            <section className="mt-7">
              <h2 className="mb-2 px-1 text-sm font-semibold text-text-muted">
                {t('loyiha.bolimi')}
              </h2>
              <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
                {papkaQatori(loyihalarPapkasi)}
              </ul>
            </section>
          )}

          <section className="mt-7">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-text-muted">
                {t('nav.papkalar')}
              </h2>
              <button
                type="button"
                onClick={() => setPapkaOchiq(true)}
                aria-label={t('nav.yangiPapka')}
                className="-mr-2 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-brand-onsoft"
              >
                <Plus className="size-5" aria-hidden />
              </button>
            </div>

            {oddiyPapkalar.length > 0 && (
              <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
                {oddiyPapkalar.map(papkaQatori)}
              </ul>
            )}
          </section>

          {/* Huquqiy havolalar va hisobni o‘chirish — ikkala do‘kon
              ham bularni talab qiladi */}
          <section className="mt-7 space-y-3">
            <h2 className="px-1 text-sm font-semibold text-text-muted">
              Hisob
            </h2>

            <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
              <HuquqiyHavola href="/maxfiylik" matn="Maxfiylik siyosati" />
              <HuquqiyHavola href="/shartlar" matn="Foydalanish shartlari" />
            </div>

            <HisobOchirish />
          </section>
        </>
      )}

      {papkaOchiq && <PapkaOynasi yop={() => setPapkaOchiq(false)} />}
    </Sahifa>
  )
}

function HuquqiyHavola({ href, matn }: { href: string; matn: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-touch items-center justify-between border-b border-border-subtle px-4 py-3 text-base text-text-strong transition last:border-0 hover:bg-surface-muted"
    >
      {matn}
      <ChevronRight className="size-4 text-text-faint" aria-hidden />
    </Link>
  )
}

function Karta({
  ikonka: Ikonka,
  son,
  matn,
  rang,
  href,
}: {
  ikonka: typeof CircleCheck
  son: number
  matn: string
  rang: string
  /** Berilsa, karta bosiladigan bo'ladi va shu bo'limga olib boradi */
  href?: string
}) {
  const ichi = (
    <>
      <Ikonka className="mx-auto size-5" style={{ color: rang }} aria-hidden />
      <p className="mt-2 text-2xl font-bold text-text-strong">{son}</p>
      <p className="text-xs text-text-muted">{matn}</p>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-2xl bg-surface p-4 text-center shadow-card transition hover:bg-surface-muted"
      >
        {ichi}
      </Link>
    )
  }

  return (
    <div className="rounded-2xl bg-surface p-4 text-center shadow-card">
      {ichi}
    </div>
  )
}

function KelgusiKarta({
  ikonka: Ikonka,
  sarlavha,
  matn,
  href,
}: {
  ikonka: typeof Moon
  sarlavha: string
  matn: string
  href?: string
}) {
  const ichi = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
        <Ikonka className="size-5 text-brand-onsoft" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-strong">
          {sarlavha}
          {!href && (
            <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-medium text-text-muted">
              tayyorlanmoqda
            </span>
          )}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">{matn}</p>
      </div>
    </>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-card transition hover:bg-surface-muted"
      >
        {ichi}
      </Link>
    )
  }

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-card">
      {ichi}
    </div>
  )
}
