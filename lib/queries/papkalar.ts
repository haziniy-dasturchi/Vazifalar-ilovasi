'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { kalit } from './keys'
import type { Folder } from '@/types/vazifalar'

/** Papkalar — Kiruvchi doim birinchi, keyin tartib bo'yicha */
export function usePapkalar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.papkalar,
    queryFn: async (): Promise<Folder[]> => {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('is_inbox', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

/** Faol (arxivlanmagan) papkalar */
export function useFaolPapkalar() {
  const soz = usePapkalar()
  return {
    ...soz,
    data: soz.data?.filter((p) => !p.is_archived),
  }
}

export function useKiruvchiPapka() {
  const { data } = usePapkalar()
  return data?.find((p) => p.is_inbox) ?? null
}

type YangiPapka = {
  name: string
  color: string
  icon: string | null
}

export function usePapkaYaratish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { id: userId } = useFoydalanuvchi()

  return useMutation({
    mutationFn: async (yangi: YangiPapka): Promise<Folder> => {
      const mavjud = qc.getQueryData<Folder[]>(kalit.papkalar) ?? []
      const tartib = Math.max(0, ...mavjud.map((p) => p.sort_order)) + 1

      const { data, error } = await supabase
        .from('folders')
        .insert({ ...yangi, user_id: userId, sort_order: tartib })
        .select()
        .single()

      if (error) throw error
      return data
    },

    onMutate: async (yangi) => {
      await qc.cancelQueries({ queryKey: kalit.papkalar })
      const oldingi = qc.getQueryData<Folder[]>(kalit.papkalar)

      const vaqtinchalik: Folder = {
        id: `vaqtinchalik-${Date.now()}`,
        user_id: userId,
        name: yangi.name,
        color: yangi.color,
        icon: yangi.icon,
        sort_order: 999,
        is_inbox: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      qc.setQueryData<Folder[]>(kalit.papkalar, [...(oldingi ?? []), vaqtinchalik])
      return { oldingi }
    },

    onError: (_xato, _yangi, context) => {
      if (context?.oldingi) qc.setQueryData(kalit.papkalar, context.oldingi)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.papkalar })
    },
  })
}

type PapkaOzgarishi = Partial<Pick<Folder, 'name' | 'color' | 'icon' | 'is_archived' | 'sort_order'>>

export function usePapkaYangilash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...ozgarish }: PapkaOzgarishi & { id: string }) => {
      const { data, error } = await supabase
        .from('folders')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onMutate: async ({ id, ...ozgarish }) => {
      await qc.cancelQueries({ queryKey: kalit.papkalar })
      const oldingi = qc.getQueryData<Folder[]>(kalit.papkalar)

      qc.setQueryData<Folder[]>(kalit.papkalar, (eski) =>
        eski?.map((p) => (p.id === id ? { ...p, ...ozgarish } : p))
      )
      return { oldingi }
    },

    onError: (_xato, _ozgarish, context) => {
      if (context?.oldingi) qc.setQueryData(kalit.papkalar, context.oldingi)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.papkalar })
    },
  })
}

export function usePapkaOchirish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('folders').delete().eq('id', id)
      if (error) throw error
      return id
    },

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: kalit.papkalar })
      const oldingi = qc.getQueryData<Folder[]>(kalit.papkalar)
      qc.setQueryData<Folder[]>(kalit.papkalar, (eski) =>
        eski?.filter((p) => p.id !== id)
      )
      return { oldingi }
    },

    onError: (_xato, _id, context) => {
      if (context?.oldingi) qc.setQueryData(kalit.papkalar, context.oldingi)
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.papkalar })
      qc.invalidateQueries({ queryKey: kalit.vazifalar })
    },
  })
}
