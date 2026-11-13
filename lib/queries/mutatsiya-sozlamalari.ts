'use client'

import type { QueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { kalit } from './keys'
import type { Folder, Recurrence, Section, Task, Theme } from '@/types/vazifalar'

/**
 * Offline yozishning yuragi.
 *
 * Muammo: internet yo'q paytda qilingan o'zgarish (vazifa qo'shish,
 * bajarildi deb belgilash...) React Query'da "to'xtatilgan" holatda
 * turadi. Agar ilova o'sha paytda butunlay yopilsa, o'zgarish
 * yo'qolardi — foydalanuvchi uchun bu ishonchni yo'qotish demak.
 *
 * Yechim (TanStack'ning rasmiy offline-first naqshi): har bir
 * mutatsiyaga barqaror NOM beriladi va uning bajaruvchi funksiyasi
 * shu yerda — React'dan tashqarida — ro'yxatdan o'tkaziladi. Shunda
 * to'xtab qolgan yozuvlar IndexedDB'ga saqlanadi, ilova qayta
 * ochilganda nomi bo'yicha o'z funksiyasini topadi va aloqa
 * tiklanishi bilan serverga yuboriladi.
 *
 * MUHIM: bu yerdagi funksiyalar hook ishlatmaydi va yopilgan
 * o'zgaruvchilarga tayanmaydi — aks holda qayta tiklangandan keyin
 * ishlamay qolardi. Foydalanuvchi id'si sessiyadan olinadi.
 */

export const MUTATSIYA = {
  profilYangilash: ['mutatsiya', 'profil', 'yangilash'] as const,
  vazifaYaratish: ['mutatsiya', 'vazifa', 'yaratish'] as const,
  vazifaYangilash: ['mutatsiya', 'vazifa', 'yangilash'] as const,
  vazifaOchirish: ['mutatsiya', 'vazifa', 'ochirish'] as const,
  vazifaHolati: ['mutatsiya', 'vazifa', 'holat'] as const,
  papkaYaratish: ['mutatsiya', 'papka', 'yaratish'] as const,
  papkaYangilash: ['mutatsiya', 'papka', 'yangilash'] as const,
  papkaOchirish: ['mutatsiya', 'papka', 'ochirish'] as const,
  bolimYaratish: ['mutatsiya', 'bolim', 'yaratish'] as const,
  bolimYangilash: ['mutatsiya', 'bolim', 'yangilash'] as const,
  bolimOchirish: ['mutatsiya', 'bolim', 'ochirish'] as const,
}

/** Sessiyadagi foydalanuvchi id — tarmoqsiz, saqlangan sessiyadan */
async function foydalanuvchiId(): Promise<string> {
  const { data } = await createClient().auth.getSession()
  const id = data.session?.user?.id
  if (!id) throw new Error('Sessiya topilmadi')
  return id
}

export type YangiVazifa = {
  folder_id: string
  section_id?: string | null
  parent_id?: string | null
  title: string
  due_date?: string | null
  due_time?: string | null
  recurrence?: Recurrence | null
  priority?: 1 | 2 | 3 | 4
  /** 0, 10 ... 100. 100 berilsa baza triggeri vazifani "done" qiladi */
  progress?: number
  /**
   * Boshlang'ich holat. Berilmasa — 'planned'.
   *
   * Nega yaratishning o'zida: "Jarayonda" sahifasidan qo'shilgan vazifa
   * darhol boshlangan bo'lishi kerak. Avval buni ikki qadamda qilishga
   * urinilgandi — avval yaratish, keyin `onSuccess` ichida "boshlash"
   * RPC'si. Lekin ilova offline ishlaydi: internet yo'q paytda
   * `onSuccess` umuman chaqirilmaydi va vazifa 'planned' bo'lib qolardi.
   * Bitta amalda yuborilganda esa u navbatga butun holda tushadi.
   */
  status?: Task['status']
}

export type VazifaOzgarishi = Partial<
  Pick<
    Task,
    | 'title'
    | 'description'
    | 'priority'
    | 'progress'
    | 'due_date'
    | 'due_time'
    | 'deadline'
    | 'recurrence'
    | 'folder_id'
    | 'section_id'
    | 'sort_order'
  >
>

/**
 * Mutatsiya argumentlari — AYNAN shu yerda e'lon qilinadi.
 *
 * Nega muhim: mutationFn endi React'dan tashqarida, mutationKey
 * orqali ulanadi. setMutationDefaults esa tipni tekshirmaydi, shuning
 * uchun hook tomonida boshqa shakl kutilsa, TypeScript buni sezmay
 * qoladi va xato faqat foydalanuvchida — ishlash paytida — chiqadi.
 * Aynan shu sababli "Bo'lim qo'shilmadi" xatosi yuzaga kelgandi:
 * chaqiruvchi matn yuborardi, mutationFn esa obyekt kutardi.
 *
 * Shu tiplarni hook ham, mutationFn ham ishlatsa, nomuvofiqlik
 * kompilyatsiya paytida ushlanadi.
 */
export type YangiPapka = {
  name: string
  color: string
  icon: string | null
  sort_order?: number
}

export type PapkaOzgarishi = { id: string } & Partial<
  Pick<Folder, 'name' | 'color' | 'icon' | 'is_archived' | 'sort_order'>
>

export type YangiBolim = {
  folder_id: string
  name: string
  sort_order?: number
}

export type BolimOzgarishi = { id: string } & Partial<
  Pick<Section, 'name' | 'is_collapsed' | 'sort_order'>
>

/**
 * Profil sozlamalari o'zgarishi.
 *
 * `id` yuborilmaydi — qator doim joriy foydalanuvchiniki (RLS shuni
 * majburlaydi), shuning uchun uni chaqiruvchi tomondan olish ortiqcha
 * va xato manbai bo'lardi.
 */
export type ProfilOzgarishi = {
  full_name?: string | null
  avatar_url?: string | null
  theme?: Theme
  timezone?: string
  sidebar_order?: string[]
}

export type HolatHarakati = 'boshlash' | 'rejaga' | 'bajarish' | 'qaytarish'

const RPC_NOMI: Record<
  HolatHarakati,
  'start_task' | 'move_back' | 'complete_task' | 'uncomplete_task'
> = {
  boshlash: 'start_task',
  rejaga: 'move_back',
  bajarish: 'complete_task',
  qaytarish: 'uncomplete_task',
}

/**
 * Hamma mutatsiyalarni nomi bo'yicha ro'yxatdan o'tkazadi.
 * Ilova ishga tushganda bir marta chaqiriladi.
 */
export function mutatsiyalarniRoyxatdanOtkaz(qc: QueryClient) {
  const sb = () => createClient()

  const vazifalarniYangila = () =>
    qc.invalidateQueries({ queryKey: kalit.vazifalar })
  const papkalarniYangila = () =>
    qc.invalidateQueries({ queryKey: kalit.papkalar })
  const bolimlarniYangila = () =>
    qc.invalidateQueries({ queryKey: kalit.bolimlarPrefiks })

  // ---------------- Profil ----------------
  qc.setMutationDefaults(MUTATSIYA.profilYangilash, {
    mutationFn: async (ozgarish: ProfilOzgarishi) => {
      const { data, error } = await sb()
        .from('profiles')
        .update(ozgarish)
        .eq('id', await foydalanuvchiId())
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: () => qc.invalidateQueries({ queryKey: kalit.sozlamalar }),
  })

  // ---------------- Vazifalar ----------------
  qc.setMutationDefaults(MUTATSIYA.vazifaYaratish, {
    mutationFn: async (yangi: YangiVazifa) => {
      const holat = yangi.status ?? 'planned'
      const { data, error } = await sb()
        .from('tasks')
        .insert({
          user_id: await foydalanuvchiId(),
          folder_id: yangi.folder_id,
          section_id: yangi.section_id ?? null,
          parent_id: yangi.parent_id ?? null,
          title: yangi.title.trim(),
          due_date: yangi.due_date ?? null,
          due_time: yangi.due_time ?? null,
          recurrence: yangi.recurrence ?? null,
          priority: yangi.priority ?? 4,
          progress: yangi.progress ?? 0,
          status: holat,
          // "Jarayonda" ro'yxati `started_at` bo'yicha saralanadi —
          // `start_task` RPC'si qo'yadigan qiymatni shu yerda ham
          // qo'yamiz, aks holda vazifa ro'yxat boshida osilib qolardi
          started_at: holat === 'in_progress' ? new Date().toISOString() : null,
        })
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSettled: vazifalarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.vazifaYangilash, {
    mutationFn: async ({
      id,
      ...ozgarish
    }: VazifaOzgarishi & { id: string }) => {
      const { data, error } = await sb()
        .from('tasks')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Task
    },
    onSettled: vazifalarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.vazifaOchirish, {
    mutationFn: async (id: string) => {
      const { error } = await sb().from('tasks').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSettled: vazifalarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.vazifaHolati, {
    mutationFn: async ({
      id,
      harakat,
      subtasklarBilan = false,
    }: {
      id: string
      harakat: HolatHarakati
      subtasklarBilan?: boolean
    }) => {
      const { data, error } =
        harakat === 'bajarish'
          ? await sb().rpc('complete_task', {
              task_id: id,
              include_subtasks: subtasklarBilan,
            })
          : await sb().rpc(RPC_NOMI[harakat], { task_id: id })
      if (error) throw error
      return data as unknown as Task
    },
    onSettled: vazifalarniYangila,
  })

  // ---------------- Papkalar ----------------
  qc.setMutationDefaults(MUTATSIYA.papkaYaratish, {
    mutationFn: async (yangi: YangiPapka) => {
      const { sort_order, ...qolgan } = yangi
      const { data, error } = await sb()
        .from('folders')
        .insert({
          ...qolgan,
          user_id: await foydalanuvchiId(),
          sort_order: sort_order ?? 999,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: papkalarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.papkaYangilash, {
    mutationFn: async ({ id, ...ozgarish }: PapkaOzgarishi) => {
      const { data, error } = await sb()
        .from('folders')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: papkalarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.papkaOchirish, {
    mutationFn: async (id: string) => {
      const { error } = await sb().from('folders').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSettled: () => {
      papkalarniYangila()
      vazifalarniYangila()
    },
  })

  // ---------------- Bo'limlar ----------------
  qc.setMutationDefaults(MUTATSIYA.bolimYaratish, {
    mutationFn: async (yangi: YangiBolim) => {
      const { data, error } = await sb()
        .from('sections')
        .insert({
          user_id: await foydalanuvchiId(),
          folder_id: yangi.folder_id,
          name: yangi.name.trim(),
          sort_order: yangi.sort_order ?? 999,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: bolimlarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.bolimYangilash, {
    mutationFn: async ({ id, ...ozgarish }: BolimOzgarishi) => {
      const { data, error } = await sb()
        .from('sections')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSettled: bolimlarniYangila,
  })

  qc.setMutationDefaults(MUTATSIYA.bolimOchirish, {
    mutationFn: async (id: string) => {
      const { error } = await sb().from('sections').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSettled: () => {
      bolimlarniYangila()
      vazifalarniYangila()
    },
  })
}
