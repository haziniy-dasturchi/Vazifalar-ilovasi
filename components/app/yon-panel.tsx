'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ProfilMenyu } from './profil-menyu'
import { useBolimTartibi } from '@/lib/queries/bolim-tartibi'
import { useFaolPapkalar } from '@/lib/queries/papkalar'
import { papkaIkonkasi } from '@/lib/papka-stillari'
import { PapkaOynasi } from '@/components/papka/papka-oynasi'
import { usePapkaniOldindanYuklash } from '@/lib/queries/vazifalar'
import { useBolimlarniOldindanYuklash } from '@/lib/queries/bolimlar'

export function YonPanel() {
  const yol = usePathname()
  const BOLIMLAR = useBolimTartibi()
  const { data: papkalar, isPending } = useFaolPapkalar()
  const [oynaOchiq, setOynaOchiq] = useState(false)
  const papkaniOldindanYukla = usePapkaniOldindanYuklash()
  const bolimlarniOldindanYukla = useBolimlarniOldindanYuklash()

  function papkaUstigaTegish(papkaId: string) {
    papkaniOldindanYukla(papkaId)
    bolimlarniOldindanYukla(papkaId)
  }

  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border-subtle bg-surface md:flex">
      <div className="px-5 py-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
        <img
          src="/brand/logo-sidebar-light.svg"
          alt="Samara"
          width={133}
          height={36}
          className="h-9 w-auto"
        />
      </div>

      <nav aria-label="Asosiy bo‘limlar" className="px-3">
        <ul className="space-y-1">
          {BOLIMLAR.map(({ yol: manzil, nom, ikonka: Ikonka }) => {
            const faol = yol === manzil
            return (
              <li key={manzil}>
                <Link
                  href={manzil}
                  aria-current={faol ? 'page' : undefined}
                  className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-base font-medium transition ${
                    faol
                      ? 'bg-brand-soft text-brand-onsoft'
                      : 'text-text-strong hover:bg-surface-muted'
                  }`}
                >
                  <Ikonka className="size-5 shrink-0" aria-hidden />
                  {nom}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-7 flex items-center justify-between px-6 pb-1">
        <h2 className="text-xs font-semibold tracking-wide text-text-faint uppercase">
          Papkalar
        </h2>
        <button
          type="button"
          onClick={() => setOynaOchiq(true)}
          aria-label="Yangi papka"
          className="-mr-2 flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-brand-onsoft"
        >
          <Plus className="size-5" aria-hidden />
        </button>
      </div>

      <nav aria-label="Papkalar" className="flex-1 overflow-y-auto px-3 pb-4">
        {isPending ? (
          <ul className="space-y-1 px-3 py-2">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="h-9 animate-pulse rounded-lg bg-surface-sunken"
              />
            ))}
          </ul>
        ) : (
          <ul className="space-y-1">
            {papkalar?.map((papka) => {
              const Ikonka = papkaIkonkasi(papka.icon, papka.is_inbox)
              const faol = yol === `/papka/${papka.id}`
              return (
                <li key={papka.id}>
                  <Link
                    href={`/papka/${papka.id}`}
                    aria-current={faol ? 'page' : undefined}
                    onPointerEnter={() => papkaUstigaTegish(papka.id)}
                    onPointerDown={() => papkaUstigaTegish(papka.id)}
                    className={`flex min-h-touch items-center gap-3 rounded-xl px-3 text-base transition ${
                      faol
                        ? 'bg-brand-soft font-semibold text-brand-onsoft'
                        : 'text-text-strong hover:bg-surface-muted'
                    }`}
                  >
                    <Ikonka
                      className="size-5 shrink-0"
                      style={{ color: papka.color }}
                      aria-hidden
                    />
                    <span className="truncate">{papka.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </nav>

      <ProfilMenyu />

      {oynaOchiq && <PapkaOynasi yop={() => setOynaOchiq(false)} />}
    </aside>
  )
}
