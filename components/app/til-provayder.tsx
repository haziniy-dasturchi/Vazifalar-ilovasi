'use client'

import { createContext, useContext } from 'react'
import { STANDART_TIL, tarjimon, tilmi, type Tarjimon, type Til } from '@/lib/i18n'

/**
 * Ilova ichidagi interfeys tili.
 *
 * Mavzudan farqi: til sahifa chizilishidan oldin bilinishi SHART
 * emas — matn qaysi tilda bo'lsa ham, joylashuv bir xil, shuning
 * uchun "chaqnash" muammosi yo'q. Shu sababli bu yerda oddiy
 * kontekst yetarli va `localStorage` dan erta o'qish kerak emas.
 */
const TilContext = createContext<{ til: Til; t: Tarjimon }>({
  til: STANDART_TIL,
  t: tarjimon(STANDART_TIL),
})

export function TilProvayder({
  til,
  children,
}: {
  til: unknown
  children: React.ReactNode
}) {
  // Bazadan noma'lum qiymat kelsa ham ilova buzilmasin
  const tanlangan: Til = tilmi(til) ? til : STANDART_TIL
  return (
    <TilContext.Provider value={{ til: tanlangan, t: tarjimon(tanlangan) }}>
      {children}
    </TilContext.Provider>
  )
}

/** Komponentlarda: `const { t } = useTil()` */
export function useTil() {
  return useContext(TilContext)
}

/** Faqat tarjima funksiyasi kerak bo'lganda qisqaroq yo'l */
export function useT(): Tarjimon {
  return useContext(TilContext).t
}
