'use client'

import { useEffect } from 'react'
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { bugunISO, isoGa } from '@/lib/sana'
import { rruleEskiga, vazifaningKeyingiSanasi } from '@/lib/takrorlanish'
import { kalit } from './keys'
import {
  MUTATSIYA,
  type HolatHarakati,
  type VazifaOzgarishi,
  type YangiVazifa,
} from './mutatsiya-sozlamalari'
import type { Database } from '@/types/database'
import type { Recurrence, Task } from '@/types/vazifalar'

/** Barcha vazifa so'rovlari shu ustunlarni qaytaradi */
const USTUNLAR = '*'

type Mijoz = SupabaseClient<Database>

// =============================================================
// So'rov funksiyalari — useQuery va oldindan yuklash (prefetch)
// ikkalasida bir xil mantiq ishlatilishi uchun alohida ajratilgan
// =============================================================

async function papkaVazifalariSorovi(
  supabase: Mijoz,
  papkaId: string
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(USTUNLAR)
    .eq('folder_id', papkaId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Task[]
}

async function bugungiSorovi(supabase: Mijoz): Promise<Task[]> {
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
}

async function jarayondagiSorovi(supabase: Mijoz): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(USTUNLAR)
    .eq('status', 'in_progress')
    .order('started_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Task[]
}

async function kelgusiSorovi(supabase: Mijoz, kunSoni: number): Promise<Task[]> {
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
}

async function ertangiSorovi(supabase: Mijoz): Promise<Task[]> {
  const ertaga = new Date()
  ertaga.setDate(ertaga.getDate() + 1)

  const { data, error } = await supabase
    .from('tasks')
    .select(USTUNLAR)
    .eq('due_date', isoGa(ertaga))
    .neq('status', 'done')
    .order('due_time', { ascending: true, nullsFirst: false })
    .order('priority', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return (data ?? []) as Task[]
}

// =============================================================
// So'rovlar
// =============================================================

/** Bitta papkadagi barcha vazifalar (subtasklar bilan) */
export function usePapkaVazifalari(papkaId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.papkaVazifalari(papkaId ?? ''),
    enabled: Boolean(papkaId),
    queryFn: () => papkaVazifalariSorovi(supabase, papkaId!),
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
    queryFn: () => bugungiSorovi(supabase),
  })
}

/** Jarayondagi vazifalar — cheklov yo'q, bir nechtasi bo'lishi mumkin */
export function useJarayondagiVazifalar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.jarayondagi(),
    queryFn: () => jarayondagiSorovi(supabase),
  })
}

/** Kelgusi: bugundan keyingi muddatli ochiq vazifalar */
export function useKelgusiVazifalar(kunSoni = 30) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.kelgusi(),
    queryFn: () => kelgusiSorovi(supabase, kunSoni),
  })
}

/** Kechki reja: ertangi kunga rejalashtirilgan, hali bajarilmagan vazifalar */
export function useErtangiVazifalar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.ertangi(),
    queryFn: () => ertangiSorovi(supabase),
  })
}

/**
 * Ilova ochilganda asosiy bo'limlarni (Bugun/Jarayonda/Kelgusi) fonda
 * oldindan yuklaydi — foydalanuvchi hali boshqa bo'limga o'tmagan bo'lsa
 * ham, keshda tayyor turadi va o'tish tarmoq kutmasdan, zudlik bilan bo'ladi.
 *
 * Joriy sahifaning so'rovi ustunlik olishi uchun ozgina kechiktirilgan.
 */
export function useAsosiyRoyxatlarniOldindanYuklash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  useEffect(() => {
    const vaqt = setTimeout(() => {
      qc.prefetchQuery({ queryKey: kalit.bugungi(), queryFn: () => bugungiSorovi(supabase) })
      qc.prefetchQuery({ queryKey: kalit.jarayondagi(), queryFn: () => jarayondagiSorovi(supabase) })
      qc.prefetchQuery({ queryKey: kalit.kelgusi(), queryFn: () => kelgusiSorovi(supabase, 30) })
    }, 150)

    return () => clearTimeout(vaqt)
  }, [supabase, qc])
}

/** Papka sahifasiga o'tishdan oldin (havola bosilganda) vazifalarini yuklab qo'yish */
export function usePapkaniOldindanYuklash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return function (papkaId: string) {
    qc.prefetchQuery({
      queryKey: kalit.papkaVazifalari(papkaId),
      queryFn: () => papkaVazifalariSorovi(supabase, papkaId),
    })
  }
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

export type { YangiVazifa }

export function useVazifaYaratish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { id: userId } = useFoydalanuvchi()

  return useMutation({
    mutationKey: MUTATSIYA.vazifaYaratish,

    onMutate: async (yangi: YangiVazifa) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)

      const holat = yangi.status ?? 'planned'
      const hozir = new Date().toISOString()

      const vaqtinchalik: Task = {
        id: `vaqtinchalik-${Date.now()}`,
        user_id: userId,
        folder_id: yangi.folder_id,
        section_id: yangi.section_id ?? null,
        parent_id: yangi.parent_id ?? null,
        title: yangi.title.trim(),
        description: yangi.description ?? null,
        status: holat,
        progress: yangi.progress ?? 0,
        priority: yangi.priority ?? 4,
        due_date: yangi.due_date ?? null,
        due_time: yangi.due_time ?? null,
        deadline: null,
        rrule: yangi.rrule ?? null,
        rrule_start: yangi.rrule_start ?? null,
        rrule_from_completion: yangi.rrule_from_completion ?? false,
        // Eski ustun serverda `rrule` dan hisoblanadi; keshdagi
        // qator ham shunga mos bo'lsin
        recurrence: rruleEskiga(yangi.rrule ?? null) as Task['recurrence'],
        sort_order: 9999,
        started_at: holat === 'in_progress' ? hozir : null,
        completed_at: null,
        notified_at: null,
        created_at: hozir,
        updated_at: hozir,
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
      // "Jarayonda" sahifasidan qo'shilgan vazifa shu ro'yxatda darhol
      // ko'rinishi kerak — aks holda foydalanuvchi qo'shgan ishini
      // server javob bergunicha ko'rmay turadi (offline bo'lsa — umuman)
      if (holat === 'in_progress') {
        qc.setQueryData<Task[]>(kalit.jarayondagi(), (eski) =>
          eski ? [...eski, vaqtinchalik] : eski
        )
      }

      return { nusxa }
    },

    onError: (_xato, _yangi, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}


export function useVazifaYangilash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATSIYA.vazifaYangilash,

    onMutate: async ({ id, ...ozgarish }: VazifaOzgarishi & { id: string }) => {
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
    mutationKey: MUTATSIYA.vazifaOchirish,

    onMutate: async (id: string) => {
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
    mutationKey: MUTATSIYA.vazifaHolati,

    onMutate: async ({
      id,
      harakat,
      subtasklarBilan,
      keyingiSana = null,
    }: {
      id: string
      harakat: HolatHarakati
      subtasklarBilan?: boolean
      /** Takrorlanuvchi vazifaning keyingi sanasi (mijozda hisoblangan) */
      keyingiSana?: string | null
    }) => {
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
      // Foiz bazadagi trigger bilan bir xil yuritiladi, shunda doiradagi
      // "suv" darhol to'g'ri ko'rinadi va serverdan kelgach sakramaydi
      if (harakat === 'bajarish') ozgarish.progress = 100
      if (harakat === 'qaytarish') ozgarish.progress = 0

      /*
        Takrorlanuvchi vazifa bajarilganda server uni keyingi sanaga
        suradi va "planned" ga qaytaradi. Internet yo'q paytda server
        javobi umuman kelmaydi, shuning uchun o'sha natijani shu
        yerda — keshda — darhol chizamiz. Aks holda offline bajarilgan
        takrorlanuvchi vazifa "bajarildi" bo'lib qotib qolardi.

        `deadline` ataylab tegilmaydi: uni server siljitadi va
        interfeysda ko'rinmaydi.
      */
      if (harakat === 'bajarish' && keyingiSana) {
        ozgarish.status = 'planned'
        ozgarish.due_date = keyingiSana
        ozgarish.progress = 0
        ozgarish.completed_at = null
        ozgarish.started_at = null
      }

      keshdaYangila(qc, id, ozgarish)

      if (harakat === 'bajarish' && subtasklarBilan && !keyingiSana) {
        qc.setQueriesData<Task[]>({ queryKey: kalit.vazifalar }, (eski) =>
          eski?.map((v) =>
            v.parent_id === id && v.status !== 'done'
              ? { ...v, status: 'done', progress: 100, completed_at: hozir }
              : v
          )
        )
      }

      return { nusxa }
    },

    onSuccess: (vazifa: Task | undefined) => {
      // Takrorlanuvchi vazifa serverda keyingi sanaga suriladi —
      // serverdan kelgan qator bilan almashtiramiz
      if (vazifa?.id) keshdaYangila(qc, vazifa.id, vazifa)
    },

    onError: (_xato, _args, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}
