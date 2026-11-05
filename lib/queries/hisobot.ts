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

/**
 * Tanlangan davrda vazifalar foizi qanday o'zgargani.
 *
 * Bu — o'zgarmas tarix: vazifa keyinchalik ertangi kunga ko'chirilsa
 * yoki foizi qaytarilsa ham, "o'sha kuni shuncha ish qilingan" degan
 * yozuv joyida qoladi. Hisobot aynan shundan hisoblanadi.
 */
export type FoizYozuvi = {
  task_id: string
  sarlavha: string
  /** Davr ichida to'plangan sof o'sish, foizda */
  osish: number
}

export function useFoizJurnali(boshlanish: string, tugash: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.foizJurnali(boshlanish, tugash),
    queryFn: async (): Promise<FoizYozuvi[]> => {
      const { data, error } = await supabase
        .from('task_progress_log')
        .select('task_id, oldingi, yangi, tasks(title)')
        .gte('created_at', `${boshlanish}T00:00:00.000`)
        .lte('created_at', `${tugash}T23:59:59.999`)

      if (error) throw error

      // Bitta vazifa bir kunda bir necha marta o'zgarishi mumkin —
      // ularni qo'shib, bitta qatorga jamlaymiz.
      const jami = new Map<string, FoizYozuvi>()
      for (const q of data ?? []) {
        const sarlavha =
          (q.tasks as unknown as { title: string } | null)?.title ?? 'Vazifa'
        const avvalgi = jami.get(q.task_id)
        const farq = q.yangi - q.oldingi
        if (avvalgi) avvalgi.osish += farq
        else jami.set(q.task_id, { task_id: q.task_id, sarlavha, osish: farq })
      }

      // Faqat haqiqiy oldinga siljish qiziq (qaytarishlar emas)
      return [...jami.values()]
        .filter((y) => y.osish > 0)
        .sort((a, b) => b.osish - a.osish)
    },
  })
}
