'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { bugunISO, isoGa } from '@/lib/sana'
import { kalit } from './keys'
import type { Recurrence, Task } from '@/types/vazifalar'

/** Barcha vazifa so'rovlari shu ustunlarni qaytaradi */
const USTUNLAR = '*'

// =============================================================
// So'rovlar
// =============================================================

/** Bitta papkadagi barcha vazifalar (subtasklar bilan) */
export function usePapkaVazifalari(papkaId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.papkaVazifalari(papkaId ?? ''),
    enabled: Boolean(papkaId),
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(USTUNLAR)
        .eq('folder_id', papkaId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

/**
 * Bugungi sahifa: kechikkanlar + bugungilar + bugun bajarilganlar.
 * Hammasi bitta ro'yxatda qaytadi, sahifa o'zi ajratadi.
 */
export function useBugungiVazifalar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.bugungi(),
    queryFn: async (): Promise<Task[]> => {
      const bugun = bugunISO()
      const kunBoshi = new Date()
      kunBoshi.setHours(0, 0, 0, 0)

      const [ochiq, bajarilgan] = await Promise.all([
        supabase
          .from('tasks')
          .select(USTUNLAR)
          .neq('status', 'done')
          .lte('due_date', bugun)
          .order('due_date', { ascending: true })
          .order('priority', { ascending: true })
          .order('sort_order', { ascending: true }),
        supabase
          .from('tasks')
          .select(USTUNLAR)
          .eq('status', 'done')
          .gte('completed_at', kunBoshi.toISOString())
          .order('completed_at', { ascending: false }),
      ])

      if (ochiq.error) throw ochiq.error
      if (bajarilgan.error) throw bajarilgan.error

      return [...(ochiq.data ?? []), ...(bajarilgan.data ?? [])] as Task[]
    },
  })
}

/** Jarayondagi vazifalar — cheklov yo'q, bir nechtasi bo'lishi mumkin */
export function useJarayondagiVazifalar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.jarayondagi(),
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select(USTUNLAR)
        .eq('status', 'in_progress')
        .order('started_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

/** Kelgusi: bugundan keyingi muddatli ochiq vazifalar */
export function useKelgusiVazifalar(kunSoni = 30) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.kelgusi(),
    queryFn: async (): Promise<Task[]> => {
      // Mahalliy sana ishlatiladi: toISOString() UTC beradi va
      // Toshkent vaqti bilan kechasi bir kun farq qilib ketadi.
      const oxiri = new Date()
      oxiri.setDate(oxiri.getDate() + kunSoni)

      const { data, error } = await supabase
        .from('tasks')
        .select(USTUNLAR)
        .neq('status', 'done')
        .gt('due_date', bugunISO())
        .lte('due_date', isoGa(oxiri))
        .order('due_date', { ascending: true })
        .order('priority', { ascending: true })

      if (error) throw error
      return (data ?? []) as Task[]
    },
  })
}

// =============================================================
// Kesh yordamchilari — optimistik yangilash uchun
// =============================================================

/** Keshdagi barcha vazifa ro'yxatlarida bitta vazifani yangilash */
function keshdaYangila(qc: QueryClient, id: string, ozgarish: Partial<Task>) {
  qc.setQueriesData<Task[]>({ queryKey: kalit.vazifalar }, (eski) =>
    eski?.map((v) => (v.id === id ? { ...v, ...ozgarish } : v))
  )
}

/** Keshdagi barcha ro'yxatlardan vazifani (va uning subtasklarini) olib tashlash */
function keshdanOlib(qc: QueryClient, id: string) {
  qc.setQueriesData<Task[]>({ queryKey: kalit.vazifalar }, (eski) =>
    eski?.filter((v) => v.id !== id && v.parent_id !== id)
  )
}

/** Keshdagi holatni saqlab qo'yish (xato bo'lsa qaytarish uchun) */
function keshNusxasi(qc: QueryClient) {
  return qc.getQueriesData<Task[]>({ queryKey: kalit.vazifalar })
}

function keshniTikla(
  qc: QueryClient,
  nusxa: ReturnType<typeof keshNusxasi> | undefined
) {
  if (!nusxa) return
  for (const [key, data] of nusxa) {
    qc.setQueryData(key, data)
  }
}

function vazifalarniYangilash(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: kalit.vazifalar })
}

// =============================================================
// O'zgartirishlar
// =============================================================

export type YangiVazifa = {
  folder_id: string
  section_id?: string | null
  parent_id?: string | null
  title: string
  due_date?: string | null
  due_time?: string | null
  recurrence?: Recurrence | null
  priority?: 1 | 2 | 3 | 4
}

export function useVazifaYaratish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { id: userId } = useFoydalanuvchi()

  return useMutation({
    mutationFn: async (yangi: YangiVazifa): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          folder_id: yangi.folder_id,
          section_id: yangi.section_id ?? null,
          parent_id: yangi.parent_id ?? null,
          title: yangi.title.trim(),
          due_date: yangi.due_date ?? null,
          due_time: yangi.due_time ?? null,
          recurrence: yangi.recurrence ?? null,
          priority: yangi.priority ?? 4,
        })
        .select()
        .single()

      if (error) throw error
      return data as Task
    },

    onMutate: async (yangi) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)

      const vaqtinchalik: Task = {
        id: `vaqtinchalik-${Date.now()}`,
        user_id: userId,
        folder_id: yangi.folder_id,
        section_id: yangi.section_id ?? null,
        parent_id: yangi.parent_id ?? null,
        title: yangi.title.trim(),
        description: null,
        status: 'planned',
        priority: yangi.priority ?? 4,
        due_date: yangi.due_date ?? null,
        due_time: yangi.due_time ?? null,
        deadline: null,
        recurrence: yangi.recurrence ?? null,
        sort_order: 9999,
        started_at: null,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Yangi vazifa faqat mos ro'yxatlarga qo'shiladi
      qc.setQueryData<Task[]>(
        kalit.papkaVazifalari(yangi.folder_id),
        (eski) => (eski ? [...eski, vaqtinchalik] : eski)
      )
      if (vaqtinchalik.due_date && vaqtinchalik.due_date <= bugunISO()) {
        qc.setQueryData<Task[]>(kalit.bugungi(), (eski) =>
          eski ? [...eski, vaqtinchalik] : eski
        )
      }

      return { nusxa }
    },

    onError: (_xato, _yangi, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}

type VazifaOzgarishi = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'due_date'
    | 'due_time'
    | 'deadline'
    | 'recurrence'
    | 'folder_id'
    | 'section_id'
    | 'sort_order'
  >
>

export function useVazifaYangilash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...ozgarish }: VazifaOzgarishi & { id: string }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Task
    },

    onMutate: async ({ id, ...ozgarish }) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)
      keshdaYangila(qc, id, ozgarish as Partial<Task>)
      return { nusxa }
    },

    onError: (_xato, _ozgarish, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}

export function useVazifaOchirish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return id
    },

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)
      keshdanOlib(qc, id)
      return { nusxa }
    },

    onError: (_xato, _id, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}

// -------------------------------------------------------------
// Holat o'zgarishlari — barchasi RPC orqali
// -------------------------------------------------------------

type HolatHarakati = 'boshlash' | 'rejaga' | 'bajarish' | 'qaytarish'

const RPC_NOMI: Record<HolatHarakati, 'start_task' | 'move_back' | 'complete_task' | 'uncomplete_task'> = {
  boshlash: 'start_task',
  rejaga: 'move_back',
  bajarish: 'complete_task',
  qaytarish: 'uncomplete_task',
}

/** Optimistik ko'rinish uchun kutilayotgan holat */
const KUTILGAN_HOLAT: Record<HolatHarakati, Task['status']> = {
  boshlash: 'in_progress',
  rejaga: 'planned',
  bajarish: 'done',
  qaytarish: 'planned',
}

export function useVazifaHolati() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      harakat,
      subtasklarBilan = false,
    }: {
      id: string
      harakat: HolatHarakati
      subtasklarBilan?: boolean
    }): Promise<Task> => {
      const { data, error } =
        harakat === 'bajarish'
          ? await supabase.rpc('complete_task', {
              task_id: id,
              include_subtasks: subtasklarBilan,
            })
          : await supabase.rpc(RPC_NOMI[harakat], { task_id: id })

      if (error) throw error
      return data as unknown as Task
    },

    onMutate: async ({ id, harakat, subtasklarBilan }) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)
      const hozir = new Date().toISOString()
      const holat = KUTILGAN_HOLAT[harakat]

      const ozgarish: Partial<Task> = {
        status: holat,
        completed_at: holat === 'done' ? hozir : null,
      }
      // started_at faqat boshlanganda yoziladi; boshqa holatda tegilmaydi
      if (holat === 'in_progress') ozgarish.started_at = hozir
      keshdaYangila(qc, id, ozgarish)

      if (harakat === 'bajarish' && subtasklarBilan) {
        qc.setQueriesData<Task[]>({ queryKey: kalit.vazifalar }, (eski) =>
          eski?.map((v) =>
            v.parent_id === id && v.status !== 'done'
              ? { ...v, status: 'done', completed_at: hozir }
              : v
          )
        )
      }

      return { nusxa }
    },

    onSuccess: (vazifa) => {
      // Takrorlanuvchi vazifa serverda keyingi sanaga suriladi —
      // serverdan kelgan qator bilan almashtiramiz
      if (vazifa?.id) keshdaYangila(qc, vazifa.id, vazifa)
    },

    onError: (_xato, _args, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}
