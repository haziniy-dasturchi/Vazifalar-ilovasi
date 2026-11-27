'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Plus } from 'lucide-react'
import { FoydalanuvchiProvider } from './foydalanuvchi'
import { YonPanel } from './yon-panel'
import { PastkiMenyu } from './pastki-menyu'
import { MobilSarlavha } from './mobil-sarlavha'
import { TilProvayder, useT } from './til-provayder'
import { PwaOrnatish } from './pwa-ornatish'
import { BildirishnomaEslatmasi } from './bildirishnoma-eslatmasi'
import { VazifaOynasi } from '@/components/vazifa/vazifa-oynasi'
import { useFoydalanuvchiSorovi, useProfil } from '@/lib/queries/profil'
import { useAsosiyRoyxatlarniOldindanYuklash } from '@/lib/queries/vazifalar'
import { MAVZU_KALITI, mavzuniOrnat } from '@/lib/mavzu'
import type { Theme } from '@/types/vazifalar'
import { ilovaNativemi } from '@/lib/platform'

export function Shell({ children }: { children: React.ReactNode }) {
  const [qoshishOchiq, setQoshishOchiq] = useState(false)
  const { data: foydalanuvchi, isError: sessiyaYoq } = useFoydalanuvchiSorovi()
  const { data: profil } = useProfil()
  const router = useRouter()

  // Appda middleware yo'q: sessiya haqiqatan yo'q bo'lsa (chiqilgan
  // yoki refresh token bekor qilingan) bo'sh ekran o'rniga kirishga
  useEffect(() => {
    if (sessiyaYoq && ilovaNativemi()) router.replace('/kirish')
  }, [sessiyaYoq, router])

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
      <TilProvayder profilTili={profil?.lang}>
        <div className="flex min-h-dvh">
          {/* YonPanel `useSearchParams` ishlatadi (appdagi papka manzili) */}
          <Suspense fallback={null}>
            <YonPanel />
          </Suspense>

          <div className="min-w-0 flex-1 pb-24 md:pb-0">
            <MobilSarlavha />
            {children}
          </div>
        </div>

        {/* Telefonda asosiy harakat — har doim ko'rinib turadi */}
        <QoshishTugmasi onClick={() => setQoshishOchiq(true)} />

        <PastkiMenyu />

        {/* Ikkalasi ham kirishni talab qiladi — izoh `providers.tsx` da */}
        <PwaOrnatish />
        <BildirishnomaEslatmasi />

        {qoshishOchiq && <VazifaOynasi yop={() => setQoshishOchiq(false)} />}
      </TilProvayder>
    </FoydalanuvchiProvider>
  )
}

/**
 * Alohida komponent, chunki `useT()` faqat `TilProvayder` ichida
 * ishlaydi — `Shell` ning o'zi provayderdan tashqarida turadi.
 */
function QoshishTugmasi({ onClick }: { onClick: () => void }) {
  const t = useT()
  const yol = usePathname()
  // Topshiriqlarda bu tugma keraksiz va xalaqit beradi: u yerda o'z
  // "Yuborish" tugmasi bor, chatda esa yuborish tugmasi ustiga tushardi
  if (yol.startsWith('/topshiriq')) return null
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('vazifa.yangi')}
      className="fixed right-5 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex size-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-float transition active:scale-95 md:right-8 md:bottom-8"
    >
      <Plus className="size-7" aria-hidden />
    </button>
  )
}
