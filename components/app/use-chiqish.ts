'use client'

import { useQueryClient } from '@tanstack/react-query'
import { del } from 'idb-keyval'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { sessiyaniQurilmadaTozala } from '@/lib/supabase/client'
import { ilovaNativemi } from '@/lib/platform'

/** Kesh kaliti — providers.tsx dagi bilan bir xil bo'lishi shart */
const SAQLAGICH_KALITI = 'samara-query-cache'

/**
 * Hisobdan chiqish — yon panel va mobil menyu uchun umumiy.
 *
 * Chiqish HECH QACHON "bo'lmadi" bilan tugamasligi kerak. Avval
 * serverga xabar beramiz (boshqa qurilmalardagi sessiyalar ham
 * yopiladi). Server javob bermasa — internet yo'q, sust yoki token
 * eskirgan — sessiya qurilmaning o'zida majburan o'chiriladi.
 */
export function useChiqish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return async function chiqish() {
    let tozalandi = false
    try {
      const { error } = await supabase.auth.signOut()
      tozalandi = !error
    } catch {
      // Tarmoq xatosi — pastda qurilmada tozalaymiz
    }
    if (!tozalandi) await sessiyaniQurilmadaTozala()

    // MUHIM: offline ishlashi uchun vazifalar IndexedDB'da saqlanadi.
    // Chiqishda ularni tozalamasak, keyingi odam shu qurilmada
    // oldingi foydalanuvchining ishlarini ko'rib qolardi.
    qc.getMutationCache().clear()
    qc.clear()
    try {
      await del(SAQLAGICH_KALITI)
    } catch {
      // Kesh o'chmasa ham chiqish davom etadi — sessiya allaqachon yopilgan
    }

    /*
      To'liq qayta yuklash: Supabase mijozi xotirada sessiyani hali
      ushlab turgan bo'lishi mumkin (ayniqsa majburan tozalanganda).
      Yangi sahifa uni toza holatda yaratadi. Appda yo'l oxirida "/"
      bo'lishi shart (statik eksport, trailingSlash).
    */
    window.location.replace(ilovaNativemi() ? '/kirish/' : '/kirish')
  }
}
