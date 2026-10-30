'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ClipboardCheck, Play, Sun } from 'lucide-react'

export const BOLIMLAR = [
  { yol: '/bugun', nom: 'Bugun', ikonka: Sun },
  { yol: '/kelgusi', nom: 'Kelgusi', ikonka: CalendarDays },
  { yol: '/jarayonda', nom: 'Jarayonda', ikonka: Play },
  { yol: '/korish', nom: 'Ko‘rish', ikonka: ClipboardCheck },
] as const

export function PastkiMenyu() {
  const yol = usePathname()

  return (
    <nav
      aria-label="Asosiy bo‘limlar"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {BOLIMLAR.map(({ yol: manzil, nom, ikonka: Ikonka }) => {
          const faol = yol === manzil || yol.startsWith(manzil + '/')
          return (
            <li key={manzil} className="flex-1">
              <Link
                href={manzil}
                aria-current={faol ? 'page' : undefined}
                className={`flex min-h-touch flex-col items-center justify-center gap-1 px-1 py-2 text-xs font-medium transition ${
                  faol ? 'text-brand-primary' : 'text-text-faint'
                }`}
              >
                <Ikonka
                  className={`size-6 ${faol ? 'stroke-[2.4]' : ''}`}
                  aria-hidden
                />
                {nom}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
