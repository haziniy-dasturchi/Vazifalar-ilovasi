'use client'

import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
import { useProfil, useProfilYangilash } from '@/lib/queries/profil'
import { BOLIMLAR, tartiblanganBolimlar } from '@/lib/bolimlar'

export function YonPanelBolimi() {
  const { data: profil } = useProfil()
  const yangilash = useProfilYangilash()
  const { korsat } = useToast()

  const tartib = tartiblanganBolimlar(profil?.sidebar_order ?? [])
  const sukutdami = (profil?.sidebar_order ?? []).length === 0

  async function saqla(yangiTartib: string[]) {
    try {
      await yangilash.mutateAsync({ sidebar_order: yangiTartib })
    } catch {
      korsat({ matn: 'Saqlab bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    }
  }

  function kochir(indeks: number, yonalish: -1 | 1) {
    const yangi = indeks + yonalish
    if (yangi < 0 || yangi >= tartib.length) return
    const yollar = tartib.map((b) => b.yol)
    ;[yollar[indeks], yollar[yangi]] = [yollar[yangi], yollar[indeks]]
    saqla(yollar)
  }

  return (
    <div className="space-y-4">
      <SozlamaKartasi
        sarlavha="Bo‘limlar tartibi"
        tavsif={`Eng yuqoridagi bo‘lim ilova ochilganda birinchi ko‘rinadi. Hozir — «${tartib[0].nom}».`}
      >
        <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle">
          {tartib.map((bolim, i) => {
            const Ikonka = bolim.ikonka
            return (
              <li
                key={bolim.yol}
                className="flex items-center gap-3 bg-surface px-3 py-2"
              >
                <Ikonka
                  className="size-5 shrink-0 text-text-muted"
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate text-base text-text-strong">
                  {bolim.nom}
                </span>
                {i === 0 && (
                  <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-onsoft">
                    birinchi
                  </span>
                )}
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => kochir(i, -1)}
                    disabled={i === 0 || yangilash.isPending}
                    aria-label={`${bolim.nom} — yuqoriga`}
                    className="flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-strong disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => kochir(i, 1)}
                    disabled={i === tartib.length - 1 || yangilash.isPending}
                    aria-label={`${bolim.nom} — pastga`}
                    className="flex size-9 min-h-0 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted hover:text-text-strong disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>

        {!sukutdami && (
          <button
            type="button"
            onClick={() => saqla([])}
            disabled={yangilash.isPending}
            className="mt-3 flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
          >
            <RotateCcw className="size-4" aria-hidden />
            Sukut tartibini qaytarish
          </button>
        )}
      </SozlamaKartasi>

      <p className="px-1 text-sm leading-relaxed text-text-muted">
        Tartib hisobingizga saqlanadi — telefonda ham, kompyuterda ham bir xil
        bo‘ladi. Pastki menyu ({BOLIMLAR.length} ta bo‘lim) ham shu tartibda
        chiqadi.
      </p>
    </div>
  )
}
