'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import {
  qismanBajarilganlar,
  type JurnalQatori,
  type QismanYozuv,
} from '@/lib/hisobot-filtr'
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
 *
 * Jurnal bilan birga vazifaning HOZIRGI holati ham olinadi
 * (`tasks(title, progress, status)`). Sababi: ro'yxatda faqat yarim
 * yo'lda turgan ishlar qolishi kerak, to'liq bajarilganlar esa
 * "bajarildi" kartasida sanaladi — ikki marta emas. Filtrning o'zi
 * `lib/hisobot-filtr.ts` da, chunki unga test yoziladi.
 */
export function useFoizJurnali(boshlanish: string, tugash: string) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.foizJurnali(boshlanish, tugash),
    queryFn: async (): Promise<QismanYozuv[]> => {
      const { data, error } = await supabase
        .from('task_progress_log')
        .select('task_id, oldingi, yangi, tasks(title, progress, status)')
        .gte('created_at', `${boshlanish}T00:00:00.000`)
        .lte('created_at', `${tugash}T23:59:59.999`)

      if (error) throw error

      const qatorlar: JurnalQatori[] = (data ?? []).map((q) => {
        const vazifa = q.tasks as unknown as {
          title: string
          progress: number
          status: string
        } | null
        return {
          task_id: q.task_id,
          sarlavha: vazifa?.title ?? 'Vazifa',
          oldingi: q.oldingi,
          yangi: q.yangi,
          joriyFoiz: vazifa?.progress ?? 0,
          bajarilganmi: vazifa?.status === 'done',
        }
      })

      return qismanBajarilganlar(qatorlar)
    },
  })
}
