'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { kalit } from './keys'
import type { Database } from '@/types/database'
import type { Section } from '@/types/vazifalar'

async function bolimlarSorovi(
  supabase: SupabaseClient<Database>,
  papkaId: string
): Promise<Section[]> {
  const { data, error } = await supabase
    .from('sections')
    .select('*')
    .eq('folder_id', papkaId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return data ?? []
}

export function useBolimlar(papkaId: string | undefined) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.bolimlar(papkaId ?? ''),
    enabled: Boolean(papkaId),
    queryFn: () => bolimlarSorovi(supabase, papkaId!),
  })
}

/** Papka havolasi bosilganda (navigatsiyadan oldin) bo'limlarini yuklab qo'yish */
export function useBolimlarniOldindanYuklash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return function (papkaId: string) {
    qc.prefetchQuery({
      queryKey: kalit.bolimlar(papkaId),
      queryFn: () => bolimlarSorovi(supabase, papkaId),
    })
  }
}

export function useBolimYaratish(papkaId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { id: userId } = useFoydalanuvchi()

  return useMutation({
    mutationFn: async (name: string): Promise<Section> => {
      const mavjud = qc.getQueryData<Section[]>(kalit.bolimlar(papkaId)) ?? []
      const tartib = Math.max(0, ...mavjud.map((b) => b.sort_order)) + 1

      const { data, error } = await supabase
        .from('sections')
        .insert({
          user_id: userId,
          folder_id: papkaId,
          name: name.trim(),
          sort_order: tartib,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },

    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: kalit.bolimlar(papkaId) })
      const oldingi = qc.getQueryData<Section[]>(kalit.bolimlar(papkaId))

      const vaqtinchalik: Section = {
        id: `vaqtinchalik-${Date.now()}`,
        user_id: userId,
        folder_id: papkaId,
        name: name.trim(),
        sort_order: 999,
        is_collapsed: false,
        created_at: new Date().toISOString(),
      }

      qc.setQueryData<Section[]>(kalit.bolimlar(papkaId), [
        ...(oldingi ?? []),
        vaqtinchalik,
      ])
      return { oldingi }
    },

    onError: (_xato, _name, context) => {
      if (context?.oldingi) {
        qc.setQueryData(kalit.bolimlar(papkaId), context.oldingi)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.bolimlar(papkaId) })
    },
  })
}

export function useBolimYangilash(papkaId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...ozgarish
    }: { id: string } & Partial<Pick<Section, 'name' | 'is_collapsed' | 'sort_order'>>) => {
      const { data, error } = await supabase
        .from('sections')
        .update(ozgarish)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    onMutate: async ({ id, ...ozgarish }) => {
      await qc.cancelQueries({ queryKey: kalit.bolimlar(papkaId) })
      const oldingi = qc.getQueryData<Section[]>(kalit.bolimlar(papkaId))
      qc.setQueryData<Section[]>(kalit.bolimlar(papkaId), (eski) =>
        eski?.map((b) => (b.id === id ? { ...b, ...ozgarish } : b))
      )
      return { oldingi }
    },

    onError: (_xato, _args, context) => {
      if (context?.oldingi) {
        qc.setQueryData(kalit.bolimlar(papkaId), context.oldingi)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.bolimlar(papkaId) })
    },
  })
}

export function useBolimOchirish(papkaId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('sections').delete().eq('id', id)
      if (error) throw error
      return id
    },

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: kalit.bolimlar(papkaId) })
      const oldingi = qc.getQueryData<Section[]>(kalit.bolimlar(papkaId))
      qc.setQueryData<Section[]>(kalit.bolimlar(papkaId), (eski) =>
        eski?.filter((b) => b.id !== id)
      )
      return { oldingi }
    },

    onError: (_xato, _id, context) => {
      if (context?.oldingi) {
        qc.setQueryData(kalit.bolimlar(papkaId), context.oldingi)
      }
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.bolimlar(papkaId) })
      qc.invalidateQueries({ queryKey: kalit.vazifalar })
    },
  })
}
