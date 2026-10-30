'use client'

import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useToast } from '@/components/ui/toast'

/** Hisobdan chiqish — yon panel va mobil menyu uchun umumiy */
export function useChiqish() {
  const supabase = useSupabase()
  const router = useRouter()
  const { korsat } = useToast()

  return async function chiqish() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      korsat({ matn: 'Chiqib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
      return
    }
    router.replace('/kirish')
    router.refresh()
  }
}
