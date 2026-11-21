'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from '@/lib/supabase/use-supabase'
import {
  qismanBajarilganlar,
  type JurnalQatori,
  type QismanYozuv,
} from '@/lib/hisobot-filtr'
import { kalit } from './keys'
import type { Database } from '@/types/database'
import type { Task } from '@/types/vazifalar'

type Mijoz = SupabaseClient<Database>

/**
 * Takrorlanuvchi vazifa bajarilganda server uni DARHOL keyingi sanaga
 * suradi — uning qatori shu davrda necha marta bajarilganini saqlab
 * turmaydi, faqat OXIRGI (hali tugamagan bo'lsa — hali bajarilmagan)
 * holatini ko'rsatadi. Har safar bajarilganda esa `task_events`ga
 * "completed" yozuvi tushadi (`lib/queries/vazifalar.ts`dagi bir xil
 * muammo va yechim). Shu yozuvlardan foydalanib, davr ichida necha
 * marta bajarilgani — har biri alohida qator sifatida — tiklanadi.
 */
async function takrorBajarilganlarSorovi(
  supabase: Mijoz,
  boshlanishBoshi: string,
  tugashOxiri: string
): Promise<Task[]> {
  const { data: hodisalar, error: hodisaXatosi } = await supabase
    .from('task_events')
    .select('task_id, created_at')
    .eq('event', 'completed')
    .gte('created_at', boshlanishBoshi)
    .lte('created_at', tugashOxiri)
    .not('task_id', 'is', null)

  if (hodisaXatosi) throw hodisaXatosi
  if (!hodisalar || hodisalar.length === 0) return []

  const idlar = [...new Set(hodisalar.map((h) => h.task_id as string))]

  const { data: vazifalar, error } = await supabase
    .from('tasks')
    .select('*')
    .is('deleted_at', null)
    .not('rrule', 'is', null)
    .in('id', idlar)

  if (error) throw error

  const vazifaMap = new Map((vazifalar ?? []).map((v) => [v.id, v as Task]))

  // Har hodisa — alohida "bajarilgan" qator: sarlavha/papka hozirgi
  // qatordan, sana va holati esa o'sha kungi hodisadan olinadi.
  const natija: Task[] = []
  for (const h of hodisalar) {
    const asl = vazifaMap.get(h.task_id as string)
    if (!asl) continue
    const kun = (h.created_at as string).slice(0, 10)
    natija.push({ ...asl, status: 'done', completed_at: h.created_at as string, due_date: kun })
  }
  return natija
}

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

      const [asosiy, takrorBajarilgan] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .is('deleted_at', null)
          .or(
            `and(due_date.gte.${boshlanish},due_date.lte.${tugash}),and(completed_at.gte.${boshlanishBoshi},completed_at.lte.${tugashOxiri})`
          ),
        takrorBajarilganlarSorovi(supabase, boshlanishBoshi, tugashOxiri),
      ])

      if (asosiy.error) throw asosiy.error

      // Takrorlanish TUGAB, vazifa haqiqatda "done"da qotib qolgan bo'lsa,
      // o'sha kungi yakuniy bajarilish asosiy so'rovda ham bor — dublikat
      // bo'lmasligi uchun o'sha (id, kun) jufti bu yerdan chiqarib tashlanadi.
      const asosiyBajarilganlar = new Set(
        (asosiy.data ?? [])
          .filter((v) => v.status === 'done' && v.completed_at)
          .map((v) => `${v.id}:${(v.completed_at as string).slice(0, 10)}`)
      )
      const qoshimcha = takrorBajarilgan.filter(
        (v) => !asosiyBajarilganlar.has(`${v.id}:${v.completed_at!.slice(0, 10)}`)
      )

      return [...(asosiy.data ?? []), ...qoshimcha] as Task[]
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
        .is('deleted_at', null)
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
        .select(
          'task_id, oldingi, yangi, tasks(title, progress, status, deleted_at)'
        )
        .gte('created_at', `${boshlanish}T00:00:00.000`)
        .lte('created_at', `${tugash}T23:59:59.999`)

      if (error) throw error

      const qatorlar: JurnalQatori[] = []
      for (const q of data ?? []) {
        const vazifa = q.tasks as unknown as {
          title: string
          progress: number
          status: string
          deleted_at: string | null
        } | null
        // O'chirilgan vazifa hisobotda ko'rinmaydi
        if (!vazifa || vazifa.deleted_at) continue
        qatorlar.push({
          task_id: q.task_id,
          sarlavha: vazifa.title,
          oldingi: q.oldingi,
          yangi: q.yangi,
          joriyFoiz: vazifa.progress,
          bajarilganmi: vazifa.status === 'done',
        })
      }

      return qismanBajarilganlar(qatorlar)
    },
  })
}
