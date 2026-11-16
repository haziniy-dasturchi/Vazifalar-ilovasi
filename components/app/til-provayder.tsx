'use client'

import { createContext, useContext, useSyncExternalStore } from 'react'
import { STANDART_TIL, tarjimon, tilmi, type Tarjimon, type Til } from '@/lib/i18n'
import { serverTili, tilgaObuna, tilniOqi } from '@/lib/til-saqlash'

/**
 * Ilova ichidagi interfeys tili.
 *
 * Qaysi qiymat ustun turadi:
 *   1. Shu qurilmada qilingan tanlov (localStorage) — eng ishonchli,
 *      darhol ishlaydi va tarmoqqa bog'liq emas;
 *   2. Hisobdagi til (`profiles.lang`) — boshqa qurilmada tanlangan
 *      bo'lsa, shu yerda ham o'sha til ochiladi;
 *   3. O'zbekcha.
 *
 * Mavzudan farqi: til sahifa chizilishidan oldin bilinishi SHART
 * emas — matn qaysi tilda bo'lsa ham joylashuv bir xil, shuning
 * uchun "chaqnash" muammosi yo'q.
 */
const TilContext = createContext<{ til: Til; t: Tarjimon }>({
  til: STANDART_TIL,
  t: tarjimon(STANDART_TIL),
})

export function TilProvayder({
  profilTili,
  children,
}: {
  /** `profiles.lang` — ustun hali qo'shilmagan bo'lsa `undefined` */
  profilTili: unknown
  children: React.ReactNode
}) {
  const qurilmaTili = useSyncExternalStore(tilgaObuna, tilniOqi, serverTili)

  const tanlangan: Til =
    qurilmaTili ?? (tilmi(profilTili) ? profilTili : STANDART_TIL)

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
