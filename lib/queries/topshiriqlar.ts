'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { kalit } from './keys'
import type { Topshiriq, TaskPriority } from '@/types/vazifalar'

/**
 * Topshiriqlar — foydalanuvchidan foydalanuvchiga.
 *
 * Himoya baza darajasida: `topshiriqlar` jadvalining RLS siyosati
 * faqat yuboruvchi va qabul qiluvchiga ko'rsatadi, holat esa faqat
 * RPC orqali o'zgaradi. Shuning uchun bu yerda qo'shimcha tekshiruv
 * yo'q — mijoz kodiga tayangan himoya himoya emas.
 */

// Supabase tiplari bu jadvalni hali bilmaydi — `from()` natijasini
// o'z tipimizga keltiramiz. Generatsiya yangilangach olib tashlanadi.
type XomJadval = {
  select: (q: string) => {
    eq: (ustun: string, qiymat: string) => {
      order: (
        ustun: string,
        sozlama: { ascending: boolean }
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
    }
    order: (
      ustun: string,
      sozlama: { ascending: boolean }
    ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
  }
  insert: (qator: Record<string, unknown>) => PromiseLike<{
    error: { message: string } | null
  }>
  delete: () => {
    eq: (ustun: string, qiymat: string) => PromiseLike<{
      error: { message: string } | null
    }>
  }
}

/**
 * Yangi RPC'lar ham generatsiya qilingan tiplarda yo'q. Alohida
 * yordamchi: `as any` sochib yurmaslik uchun bitta joyda, aniq
 * imzо bilan.
 */
function rpcChaqir(
  supabase: ReturnType<typeof useSupabase>,
  nom: string,
  argumentlar: Record<string, unknown>
) {
  return (supabase as unknown as {
    rpc: (
      n: string,
      a: Record<string, unknown>
    ) => PromiseLike<{ error: { message: string } | null }>
  }).rpc(nom, argumentlar)
}

function jadval(supabase: ReturnType<typeof useSupabase>) {
  return (supabase as unknown as {
    from: (nom: string) => XomJadval
  }).from('topshiriqlar')
}

/** Menga kelgan topshiriqlar (email bo'yicha mos keladi) */
export function useKelganTopshiriqlar() {
  const supabase = useSupabase()
  const { email } = useFoydalanuvchi()

  return useQuery({
    queryKey: kalit.kelganTopshiriqlar(),
    queryFn: async (): Promise<Topshiriq[]> => {
      const { data, error } = await jadval(supabase)
        .select('*')
        .eq('qabul_qiluvchi_email', email.toLowerCase())
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as Topshiriq[]
    },
  })
}

/** Men yuborgan topshiriqlar — holatini kuzatish uchun */
export function useYuborilganTopshiriqlar() {
  const supabase = useSupabase()
  const { id } = useFoydalanuvchi()

  return useQuery({
    queryKey: kalit.yuborilganTopshiriqlar(),
    queryFn: async (): Promise<Topshiriq[]> => {
      const { data, error } = await jadval(supabase)
        .select('*')
        .eq('yuboruvchi_id', id)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data ?? []) as Topshiriq[]
    },
  })
}

export type YangiTopshiriq = {
  qabul_qiluvchi_email: string
  sarlavha: string
  izoh?: string | null
  muddat?: string | null
  muhimlik?: TaskPriority
}

export function useTopshiriqYuborish() {
  const supabase = useSupabase()
  const { id } = useFoydalanuvchi()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (yangi: YangiTopshiriq) => {
      const { error } = await jadval(supabase).insert({
        yuboruvchi_id: id,
        qabul_qiluvchi_email: yangi.qabul_qiluvchi_email.trim().toLowerCase(),
        sarlavha: yangi.sarlavha.trim(),
        izoh: yangi.izoh?.trim() || null,
        muddat: yangi.muddat ?? null,
        muhimlik: yangi.muhimlik ?? 4,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

export function useTopshiriqQabul() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (topshiriqId: string) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_qabul_qilish', {
        p_id: topshiriqId,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks })
      // Qabul qilinganda Kiruvchi papkada yangi vazifa paydo bo'ladi
      qc.invalidateQueries({ queryKey: kalit.vazifalar })
    },
  })
}

export function useTopshiriqRad() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, sabab }: { id: string; sabab: string }) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_rad_etish', {
        p_id: id,
        p_sabab: sabab,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

/** Yuboruvchi javob kelmasdan oldin bekor qilishi mumkin */
export function useTopshiriqBekor() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (topshiriqId: string) => {
      const { error } = await jadval(supabase).delete().eq('id', topshiriqId)
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

/**
 * Avval yuborilgan manzillar — keyingi safar tavsiya qilish uchun.
 *
 * Alohida jadval kerak emas: yuborilgan topshiriqlarning o'zida
 * hamma manzil bor. Takrorlar olib tashlanadi, eng oxirgi
 * ishlatilgani birinchi turadi.
 */
export function useTavsiyaEmaillar(): string[] {
  const { data } = useYuborilganTopshiriqlar()
  if (!data) return []
  const korilgan = new Set<string>()
  const natija: string[] = []
  for (const t of data) {
    if (!korilgan.has(t.qabul_qiluvchi_email)) {
      korilgan.add(t.qabul_qiluvchi_email)
      natija.push(t.qabul_qiluvchi_email)
    }
  }
  return natija
}
