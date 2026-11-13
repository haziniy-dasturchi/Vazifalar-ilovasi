'use client'

import { useState } from 'react'
import { Bell, PanelsTopLeft, Settings2, Sun, UserRound } from 'lucide-react'
import { Sahifa } from '@/components/app/sahifa'
import { Yuklanmoqda } from '@/components/ui/holatlar'
import { HisobBolimi } from '@/components/app/sozlamalar/hisob-bolimi'
import { UmumiyBolimi } from '@/components/app/sozlamalar/umumiy-bolimi'
import { KorinishBolimi } from '@/components/app/sozlamalar/korinish-bolimi'
import { YonPanelBolimi } from '@/components/app/sozlamalar/yon-panel-bolimi'
import { BildirishnomaBolimi } from '@/components/app/sozlamalar/bildirishnoma-bolimi'
import { useProfil } from '@/lib/queries/profil'

const BOLIMLAR = [
  { kalit: 'hisob', nom: 'Profil', ikonka: UserRound },
  { kalit: 'umumiy', nom: 'Umumiy', ikonka: Settings2 },
  { kalit: 'korinish', nom: 'Ko‘rinish', ikonka: Sun },
  { kalit: 'yon-panel', nom: 'Yon panel', ikonka: PanelsTopLeft },
  { kalit: 'bildirishnoma', nom: 'Bildirishnoma', ikonka: Bell },
] as const

type BolimKaliti = (typeof BOLIMLAR)[number]['kalit']

export function SozlamalarKorinishi() {
  const [faol, setFaol] = useState<BolimKaliti>('hisob')
  const { isPending, isError } = useProfil()

  return (
    <Sahifa
      sarlavha="Sozlamalar"
      tavsif="Profil, ko‘rinish va bildirishnomalarni shu yerdan boshqaring."
    >
      {/*
        Bo'lim tanlash. Kompyuterda chap tomonda ustun, telefonda esa
        tepada gorizontal lenta — telefonda vertikal ro'yxat ekranning
        yarmini egallab, asosiy mazmunni pastga surib yuborardi.
      */}
      <div className="md:flex md:items-start md:gap-7">
        <nav
          aria-label="Sozlamalar bo‘limlari"
          className="-mx-4 mb-5 overflow-x-auto px-4 md:mx-0 md:mb-0 md:w-52 md:shrink-0 md:overflow-visible md:px-0"
        >
          <ul className="flex gap-1 md:flex-col">
            {BOLIMLAR.map(({ kalit, nom, ikonka: Ikonka }) => {
              const tanlangan = faol === kalit
              return (
                <li key={kalit} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setFaol(kalit)}
                    aria-current={tanlangan ? 'page' : undefined}
                    className={`flex w-full min-h-touch items-center gap-3 rounded-xl px-3 text-sm font-medium whitespace-nowrap transition ${
                      tanlangan
                        ? 'bg-brand-soft text-brand-onsoft'
                        : 'text-text-muted hover:bg-surface-muted hover:text-text-strong'
                    }`}
                  >
                    <Ikonka className="size-4 shrink-0" aria-hidden />
                    {nom}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1">
          {isPending ? (
            <Yuklanmoqda qator={2} />
          ) : isError ? (
            <p className="rounded-2xl bg-surface p-4 text-sm text-text-muted shadow-card">
              Sozlamalarni yuklab bo‘lmadi. Internetni tekshirib, sahifani
              yangilang.
            </p>
          ) : (
            <>
              {faol === 'hisob' && <HisobBolimi />}
              {faol === 'umumiy' && <UmumiyBolimi />}
              {faol === 'korinish' && <KorinishBolimi />}
              {faol === 'yon-panel' && <YonPanelBolimi />}
              {faol === 'bildirishnoma' && <BildirishnomaBolimi />}
            </>
          )}
        </div>
      </div>
    </Sahifa>
  )
}
