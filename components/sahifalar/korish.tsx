'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BarChart3, CircleCheck, Clock, Moon, Plus, TriangleAlert } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { Yuklanmoqda } from '@/components/ui/holatlar'
import { PapkaOynasi } from '@/components/papka/papka-oynasi'
import { useBugungiVazifalar } from '@/lib/queries/vazifalar'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { bugunISO, sarlavhaSana } from '@/lib/sana'

export function KorishKorinishi() {
  const { data, isPending } = useBugungiVazifalar()
  const { data: papkalar } = useFaolPapkalar()
  const [papkaOchiq, setPapkaOchiq] = useState(false)

  const bugun = bugunISO()
  const vazifalar = data ?? []
  const bajarilgan = vazifalar.filter((v) => v.status === 'done').length
  const kechikkan = vazifalar.filter(
    (v) => v.status !== 'done' && v.due_date !== null && v.due_date < bugun
  ).length
  const qolgan = vazifalar.filter(
    (v) => v.status !== 'done' && v.due_date === bugun
  ).length

  return (
    <Sahifa sarlavha="Ko‘rish" tavsif={sarlavhaSana()}>
      {isPending ? (
        <Yuklanmoqda qator={2} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Karta
              ikonka={CircleCheck}
              son={bajarilgan}
              matn="bajarildi"
              rang="#00bc55"
            />
            <Karta ikonka={Clock} son={qolgan} matn="qoldi" rang="#003933" />
            <Karta
              ikonka={TriangleAlert}
              son={kechikkan}
              matn="kechikkan"
              rang="#dc2626"
            />
          </div>

          <section className="mt-7 space-y-3">
            <KelgusiKarta
              ikonka={BarChart3}
              sarlavha="Hisobot"
              matn="Istalgan davr bo‘yicha bajarilgan va qolgan ishlar, papkalar holati."
              href="/hisobot"
            />
            <KelgusiKarta
              ikonka={Moon}
              sarlavha="Kechki reja"
              matn="Ertangi kun uchun vazifalarni oldindan belgilab qo‘ying."
              href="/kechki-reja"
            />
          </section>

          <section className="mt-7">
            <div className="mb-2 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-text-muted">Papkalar</h2>
              <button
                type="button"
                onClick={() => setPapkaOchiq(true)}
                aria-label="Yangi papka"
                className="-mr-2 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-brand-primary"
              >
                <Plus className="size-5" aria-hidden />
              </button>
            </div>

            {papkalar && papkalar.length > 0 && (
              <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
                {papkalar.map((papka) => {
                  const Ikonka = papkaIkonkasi(papka.icon, papka.is_inbox)
                  return (
                    <li
                      key={papka.id}
                      className="border-b border-border-subtle last:border-0"
                    >
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
                })}
              </ul>
            )}
          </section>
        </>
      )}

      {papkaOchiq && <PapkaOynasi yop={() => setPapkaOchiq(false)} />}
    </Sahifa>
  )
}

function Karta({
  ikonka: Ikonka,
  son,
  matn,
  rang,
}: {
  ikonka: typeof CircleCheck
  son: number
  matn: string
  rang: string
}) {
  return (
    <div className="rounded-2xl bg-surface p-4 text-center shadow-card">
      <Ikonka className="mx-auto size-5" style={{ color: rang }} aria-hidden />
      <p className="mt-2 text-2xl font-bold text-text-strong">{son}</p>
      <p className="text-xs text-text-muted">{matn}</p>
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
        <Ikonka className="size-5 text-brand-primary" aria-hidden />
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
