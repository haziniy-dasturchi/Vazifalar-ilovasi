'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { FoydalanuvchiProvider } from './foydalanuvchi'
import { YonPanel } from './yon-panel'
import { PastkiMenyu } from './pastki-menyu'
import { MobilSarlavha } from './mobil-sarlavha'
import { VazifaOynasi } from '@/components/vazifa/vazifa-oynasi'
import { useFoydalanuvchiSorovi, useProfil } from '@/lib/queries/profil'
import { useAsosiyRoyxatlarniOldindanYuklash } from '@/lib/queries/vazifalar'
import { MAVZU_KALITI, mavzuniOrnat } from '@/lib/mavzu'
import type { Theme } from '@/types/vazifalar'

export function Shell({ children }: { children: React.ReactNode }) {
  const [qoshishOchiq, setQoshishOchiq] = useState(false)
  const { data: foydalanuvchi } = useFoydalanuvchiSorovi()
  const { data: profil } = useProfil()

  /**
   * Yangi qurilmada mavzuni hisobdan tiklash.
   *
   * Faqat bu qurilmada hali tanlov qilinmagan bo'lsa ishlaydi: aks
   * holda odam shu qurilmada "yorug'" deb qo'ygan bo'lsa ham, hisobdagi
   * eski qiymat uni bosib ketardi.
   */
  useEffect(() => {
    const saqlangan = profil?.theme as Theme | undefined
    if (!saqlangan) return
    try {
      if (window.localStorage.getItem(MAVZU_KALITI)) return
    } catch {
      return
    }
    mavzuniOrnat(saqlangan)
  }, [profil?.theme])

  // Boshqa bo'limlarni fonda oldindan yuklab qo'yish — shunda ularga
  // o'tilganda ma'lumot allaqachon keshda tayyor turadi.
  useAsosiyRoyxatlarniOldindanYuklash()

  // Sessiya o'qilishi tarmoqsiz, deyarli zudlik bilan hal bo'ladi —
  // middleware kirish huquqini allaqachon tasdiqlagan.
  if (!foydalanuvchi) return null

  return (
    <FoydalanuvchiProvider qiymat={foydalanuvchi}>
      <div className="flex min-h-dvh">
        <YonPanel />

        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          <MobilSarlavha />
          {children}
        </div>
      </div>

      {/* Telefonda asosiy harakat — har doim ko'rinib turadi */}
      <button
        type="button"
        onClick={() => setQoshishOchiq(true)}
        aria-label="Yangi vazifa"
        className="fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-float transition active:scale-95 md:right-8 md:bottom-8"
      >
        <Plus className="size-7" aria-hidden />
      </button>

      <PastkiMenyu />

      {qoshishOchiq && <VazifaOynasi yop={() => setQoshishOchiq(false)} />}
    </FoydalanuvchiProvider>
  )
}
