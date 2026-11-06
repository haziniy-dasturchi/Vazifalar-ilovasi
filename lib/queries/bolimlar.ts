'use client'

import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { kalit } from './keys'
import { MUTATSIYA } from './mutatsiya-sozlamalari'
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

/**
 * Foydalanuvchining BARCHA bo'limlari (RLS o'zinikini filtrlaydi).
 * Vazifa qatorida "qaysi loyihaga tegishli" degan belgini har qanday
 * sahifada ko'rsatish uchun kerak — aks holda har bir papka uchun
 * alohida so'rov yuborishga to'g'ri kelardi.
 */
export function useBarchaBolimlar() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.barchaBolimlar,
    queryFn: async (): Promise<Section[]> => {
      const { data, error } = await supabase
        .from('sections')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data ?? []
    },
  })
}

/**
 * Bo'lim id -> nomi xaritasi. Vazifa ro'yxatlarida har bir vazifa
 * qaysi loyihaga (bo'limga) tegishli ekanini ko'rsatish uchun.
 */
export function useBolimNomlari(): Map<string, string> {
  const { data } = useBarchaBolimlar()
  return useMemo(
    () => new Map((data ?? []).map((b) => [b.id, b.name])),
    [data]
  )
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
    mutationKey: MUTATSIYA.bolimYaratish,

    onMutate: async (name: string) => {
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
      qc.invalidateQueries({ queryKey: kalit.bolimlarPrefiks })
    },
  })
}

export function useBolimYangilash(papkaId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATSIYA.bolimYangilash,

    onMutate: async ({
      id,
      ...ozgarish
    }: { id: string } & Partial<Pick<Section, 'name' | 'is_collapsed' | 'sort_order'>>) => {
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
      qc.invalidateQueries({ queryKey: kalit.bolimlarPrefiks })
    },
  })
}

export function useBolimOchirish(papkaId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationKey: MUTATSIYA.bolimOchirish,

    onMutate: async (id: string) => {
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
      qc.invalidateQueries({ queryKey: kalit.bolimlarPrefiks })
      qc.invalidateQueries({ queryKey: kalit.vazifalar })
    },
  })
}
