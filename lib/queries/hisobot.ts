'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { kalit } from './keys'
import type { Task } from '@/types/vazifalar'

/**
 * Hisobot uchun vazifalar: tanlangan sana oralig'ida muddati bor YOKI
 * shu oraliqda bajarilgan vazifalarning birlashmasi — bitta so'rovda.
 * Sahifa o'zi "bajarildi" (completed_at bo'yicha) va "qoldi" (due_date
 * bo'yicha) ro'yxatlarini shu natijadan ajratib oladi.
 */
export function useHisobotVazifalari(boshlanish: string, tugash: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.hisobot(boshlanish, tugash),
    queryFn: async (): Promise<Task[]> => {
      const boshlanishBoshi = `${boshlanish}T00:00:00.000`
      const tugashOxiri = `${tugash}T23:59:59.999`

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .or(
          `and(due_date.gte.${boshlanish},due_date.lte.${tugash}),and(completed_at.gte.${boshlanishBoshi},completed_at.lte.${tugashOxiri})`
        )

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

/**
 * Bitta papkadagi BARCHA vazifalar — sana filtrisiz.
 *
 * Loyihalar holati uchun kerak: loyiha bu uzluksiz ish, uning umumiy
 * tugallanganlik darajasi (boshidan oxirigacha) muhim, bir hafta yoki
 * bir oylik kesim emas.
 */
export function usePapkaningBarchaVazifalari(papkaId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.papkaVazifalari(papkaId ?? ''),
    enabled: Boolean(papkaId),
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('folder_id', papkaId!)

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}
