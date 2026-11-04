'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Archive, LogOut } from 'lucide-react'
import { useFoydalanuvchi } from './foydalanuvchi'
import { useChiqish } from './use-chiqish'

/** Telefon uchun yuqori panel — brend va profil menyusi */
export function MobilSarlavha() {
  const foydalanuvchi = useFoydalanuvchi()
  const chiqish = useChiqish()
  const [ochiq, setOchiq] = useState(false)

  const bosh = foydalanuvchi.ism.trim().charAt(0).toUpperCase() || 'S'

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-surface/95 px-4 py-2 backdrop-blur md:hidden">
      <Link href="/jarayonda" className="flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
        <img
          src="/brand/logo-sidebar-light.svg"
          alt="Samara"
          width={96}
          height={26}
          className="h-6 w-auto"
        />
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOchiq((v) => !v)}
          aria-expanded={ochiq}
          aria-label="Profil menyusi"
          className="flex size-11 min-h-0 items-center justify-center rounded-full"
        >
          {foydalanuvchi.rasm ? (
            // Google avatari tashqi domendan keladi
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={foydalanuvchi.rasm}
              alt=""
              width={32}
              height={32}
              className="size-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-sm font-semibold text-white">
              {bosh}
            </span>
          )}
        </button>

        {ochiq && (
          <>
            <button
              type="button"
              aria-label="Menyuni yopish"
              onClick={() => setOchiq(false)}
              className="fixed inset-0 z-10 min-h-0 cursor-default"
            />
            <div className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-float">
              <div className="border-b border-border-subtle px-4 py-3">
                <p className="truncate text-sm font-medium text-text-strong">
                  {foydalanuvchi.ism}
                </p>
                <p className="truncate text-xs text-text-faint">
                  {foydalanuvchi.email}
                </p>
              </div>
              <Link
                href="/arxiv"
                onClick={() => setOchiq(false)}
                className="flex min-h-touch items-center gap-3 px-4 text-sm text-text-strong transition hover:bg-surface-muted"
              >
                <Archive className="size-4" aria-hidden />
                Arxivlangan papkalar
              </Link>
              <button
                type="button"
                onClick={chiqish}
                className="flex w-full min-h-touch items-center gap-3 px-4 text-sm text-red-600 transition hover:bg-red-50"
              >
                <LogOut className="size-4" aria-hidden />
                Chiqish
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
