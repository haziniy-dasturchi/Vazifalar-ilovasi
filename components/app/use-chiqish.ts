'use client'

import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { del } from 'idb-keyval'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useToast } from '@/components/ui/toast'

/** Kesh kaliti — providers.tsx dagi bilan bir xil bo'lishi shart */
const SAQLAGICH_KALITI = 'samara-query-cache'

/** Hisobdan chiqish — yon panel va mobil menyu uchun umumiy */
export function useChiqish() {
  const supabase = useSupabase()
  const router = useRouter()
  const qc = useQueryClient()
  const { korsat } = useToast()

  return async function chiqish() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      korsat({ matn: 'Chiqib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
      return
    }

    // MUHIM: offline ishlashi uchun vazifalar IndexedDB'da saqlanadi.
    // Chiqishda ularni tozalamasak, keyingi odam shu qurilmada
    // oldingi foydalanuvchining ishlarini ko'rib qolardi.
    qc.clear()
    try {
      await del(SAQLAGICH_KALITI)
    } catch {
      // Kesh o'chmasa ham chiqish davom etadi — sessiya allaqachon yopilgan
    }

    router.replace('/kirish')
    router.refresh()
  }
}
