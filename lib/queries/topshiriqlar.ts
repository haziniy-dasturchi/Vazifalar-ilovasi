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

/** Natijani ham qaytaradigan RPC chaqiruvi */
function rpcOqi(
  supabase: ReturnType<typeof useSupabase>,
  nom: string,
  argumentlar: Record<string, unknown>
) {
  return (
    supabase as unknown as {
      rpc: (
        n: string,
        a: Record<string, unknown>
      ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc(nom, argumentlar)
}

/**
 * Generatsiya qilingan tiplarda hali yo'q jadvallar uchun.
 * `topshiriqlar` dan farqli: bu yerda `upsert` ham kerak.
 */
type XomUmumiy = {
  select: (q: string) => {
    order: (
      ustun: string,
      sozlama: { ascending: boolean }
    ) => PromiseLike<{ data: unknown; error: { message: string } | null }>
  }
  upsert: (
    qator: Record<string, unknown>,
    sozlama: { onConflict: string }
  ) => PromiseLike<{ error: { message: string } | null }>
  delete: () => {
    eq: (ustun: string, qiymat: string) => PromiseLike<{
      error: { message: string } | null
    }>
  }
}

function xomJadval(supabase: ReturnType<typeof useSupabase>, nom: string) {
  return (supabase as unknown as { from: (n: string) => XomUmumiy }).from(nom)
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

// =============================================================
// Karta tafsilotlari: qarshi tomon ismi va ish jarayoni
// =============================================================

export type TopshiriqTafsiloti = {
  topshiriq_id: string
  /** Qarshi tomon ismi. Maxfiylik qoidasi bazada — izohga qarang. */
  qarshi_ism: string | null
  /** Qarshi tomon emaili — bloklash shu bo'yicha ishlaydi */
  qarshi_email: string | null
  /** Yuboruvchi uchun: vazifa holati (planned | in_progress | done) */
  vazifa_holati: string | null
  foiz: number | null
  ochirilganmi: boolean
}

/**
 * `topshiriq_tafsilotlari()` RPC natijasi, id bo'yicha xarita.
 *
 * Nega alohida so'rov: ism ham, jarayon ham BOSHQA odamning
 * ma'lumoti. RLS ularni to'g'ridan-to'g'ri bermaydi (va to'g'ri
 * qiladi), shuning uchun faqat kerakli uch-to'rt maydonni
 * qaytaradigan tor funksiya ishlatiladi.
 *
 * Migratsiya hali qo'llanmagan bo'lsa xato bo'ladi — bunda bo'sh
 * xarita qaytadi va kartalar avvalgidek, ismsiz ko'rinadi. Ya'ni
 * interfeys bazadan oldin chiqsa ham buzilmaydi.
 */
export function useTopshiriqTafsilotlari() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.topshiriqTafsilotlari(),
    queryFn: async (): Promise<Map<string, TopshiriqTafsiloti>> => {
      const { data, error } = await rpcOqi(
        supabase,
        'topshiriq_tafsilotlari',
        {}
      )
      if (error) return new Map()
      const qatorlar = (data ?? []) as TopshiriqTafsiloti[]
      return new Map(qatorlar.map((q) => [q.topshiriq_id, q]))
    },
  })
}

// =============================================================
// Kim menga topshiriq yoza oladi: ruxsat va bloklar
// =============================================================

export type RuxsatHolati = 'ruxsat' | 'blok'

export type TopshiriqRuxsati = {
  id: string
  yuboruvchi_email: string
  holat: RuxsatHolati
  updated_at: string
}

export function useTopshiriqRuxsatlari() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.topshiriqRuxsatlari(),
    queryFn: async (): Promise<TopshiriqRuxsati[]> => {
      const { data, error } = await xomJadval(supabase, 'topshiriq_ruxsatlari')
        .select('id, yuboruvchi_email, holat, updated_at')
        .order('updated_at', { ascending: false })
      // Migratsiya hali qo'llanmagan bo'lishi mumkin
      if (error) return []
      return (data ?? []) as TopshiriqRuxsati[]
    },
  })
}

/**
 * Ruxsat berish yoki bloklash.
 *
 * `holat = null` — qarorni butunlay olib tashlash, ya'ni odatiy
 * chegaralarga qaytish (3 ta rad / 5 ta javobsiz).
 */
export function useRuxsatOzgartirish() {
  const supabase = useSupabase()
  const { id: menId } = useFoydalanuvchi()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      email,
      holat,
    }: {
      email: string
      holat: RuxsatHolati | null
    }) => {
      const toza = email.trim().toLowerCase()
      const jadval = xomJadval(supabase, 'topshiriq_ruxsatlari')

      if (holat === null) {
        const { error } = await jadval.delete().eq('yuboruvchi_email', toza)
        if (error) throw new Error(error.message)
        return
      }

      // Bitta odam uchun bitta qator: egasi+email juftligi noyob
      const { error } = await jadval.upsert(
        { egasi_id: menId, yuboruvchi_email: toza, holat },
        { onConflict: 'egasi_id,yuboruvchi_email' }
      )
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

// =============================================================
// Ro'yxatdan o'chirish
// =============================================================

/**
 * Belgilangan topshiriqlarni O'Z ro'yxatimdan olib tashlaydi.
 *
 * Ikkinchi tomonda qoladi — bu ataylab shunday: xodim o'ziga
 * berilgan ishning izini o'chirib tashlay olmasligi, boshliq esa
 * xodim qabul qilgan ishni uning qo'lidan olib qo'ymasligi kerak.
 * Ikkalasi ham o'chirsa, qator bazadan butunlay ketadi.
 */
export function useTopshiriqlarniOchirish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (idlar: string[]) => {
      if (idlar.length === 0) return
      const { error } = await rpcChaqir(supabase, 'topshiriqlarni_ochirish', {
        p_idlar: idlar,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}
