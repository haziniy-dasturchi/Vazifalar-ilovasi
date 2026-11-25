'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import type {
  Jamoa,
  JamoaAzosi,
  TopshiriqHodisasi,
  ReaksiyaTuri,
  TopshiriqIzohi,
} from '@/types/vazifalar'

/**
 * Topshiriqlarning 2-3 bosqichi: jamoa, taklif, izohlar, fayllar, tarix.
 *
 * Himoya to'liq bazada (RLS va SECURITY DEFINER funksiyalar, har
 * birida huquq qo'lda tekshiriladi — `20261125090000_topshiriq_jamoa`).
 * Bu yerda faqat chaqiruvlar.
 */

export const FAYL_BUCKET = 'topshiriq-fayllar'
/** Bazadagi bucket chegarasi bilan bir xil */
export const FAYL_CHEGARASI = 10 * 1024 * 1024

const k = {
  jamoalar: ['topshiriqlar', 'jamoalar'] as const,
  azolar: ['topshiriqlar', 'jamoa-azolari'] as const,
  izohlar: (id: string) => ['topshiriqlar', 'izohlar', id] as const,
  tarix: (id: string) => ['topshiriqlar', 'tarix', id] as const,
  taklifKodi: ['topshiriqlar', 'taklif-kodi'] as const,
}

type Natija<T = unknown> = PromiseLike<{
  data: T
  error: { message: string } | null
}>

/**
 * Generatsiya qilingan tiplarda hali yo'q jadval/funksiyalar uchun
 * yagona "tipsiz" kirish nuqtasi — `as any` kod bo'ylab sochilmasin.
 */
type Sorov = {
  select: (q: string) => Sorov
  insert: (q: Record<string, unknown>) => Sorov
  upsert: (q: Record<string, unknown>, o?: { onConflict?: string }) => Sorov
  delete: () => Sorov
  eq: (u: string, q: string) => Sorov
  order: (u: string, s: { ascending: boolean }) => Sorov
  maybeSingle: () => Natija
} & Natija

function xom(supabase: ReturnType<typeof useSupabase>) {
  return supabase as unknown as {
    from: (t: string) => Sorov
    rpc: (n: string, a?: Record<string, unknown>) => Natija
  }
}

async function rpc<T = unknown>(
  supabase: ReturnType<typeof useSupabase>,
  nom: string,
  argumentlar: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await xom(supabase).rpc(nom, argumentlar)
  if (error) throw new Error(error.message)
  return data as T
}

// =============================================================
// Jamoalar
// =============================================================

export function useJamoalar() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: k.jamoalar,
    queryFn: async (): Promise<Jamoa[]> => {
      const { data, error } = await xom(supabase)
        .from('jamoalar')
        .select('*')
        .order('created_at', { ascending: true })
      // Migratsiya qo'llanmagan bo'lsa — jamoa bo'limi shunchaki bo'sh
      if (error) return []
      return (data ?? []) as Jamoa[]
    },
  })
}

export function useJamoaAzolari() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: k.azolar,
    queryFn: async (): Promise<JamoaAzosi[]> => {
      try {
        const data = await rpc<JamoaAzosi[]>(supabase, 'jamoa_azolari_royxati')
        return Array.isArray(data) ? data : []
      } catch {
        return []
      }
    },
  })
}

function useJamoaYangila() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: k.jamoalar })
    qc.invalidateQueries({ queryKey: k.azolar })
    // Jamoadoshlar kontaktlarga ham tushadi
    qc.invalidateQueries({ queryKey: ['topshiriqlar', 'kontaktlar'] })
  }
}

export function useJamoaYaratish() {
  const supabase = useSupabase()
  const yangila = useJamoaYangila()
  return useMutation({
    mutationFn: (nom: string) =>
      rpc<string>(supabase, 'jamoa_yaratish', { p_nom: nom.trim() }),
    onSettled: yangila,
  })
}

export function useJamoagaQoshilish() {
  const supabase = useSupabase()
  const yangila = useJamoaYangila()
  return useMutation({
    mutationFn: (kod: string) =>
      rpc<string>(supabase, 'jamoaga_qoshilish', { p_kod: kod }),
    onSettled: yangila,
  })
}

export function useJamoaAmali() {
  const supabase = useSupabase()
  const yangila = useJamoaYangila()
  return useMutation({
    mutationFn: async (
      amal:
        | { tur: 'chiqish'; jamoa: string }
        | { tur: 'chiqarish'; jamoa: string; user: string }
        | { tur: 'ochirish'; jamoa: string }
        | { tur: 'kodYangilash'; jamoa: string }
    ) => {
      if (amal.tur === 'chiqish')
        return rpc(supabase, 'jamoadan_chiqish', { p_jamoa: amal.jamoa })
      if (amal.tur === 'chiqarish')
        return rpc(supabase, 'jamoadan_chiqarish', {
          p_jamoa: amal.jamoa,
          p_user: amal.user,
        })
      if (amal.tur === 'ochirish')
        return rpc(supabase, 'jamoani_ochirish', { p_jamoa: amal.jamoa })
      return rpc(supabase, 'jamoa_kodini_yangilash', { p_jamoa: amal.jamoa })
    },
    onSettled: yangila,
  })
}

export type JamoaTaklifi = { nom: string; azolar: number; azomi: boolean }

/** Havola ochilganda — qo'shilishdan oldin qaysi jamoa ekanini ko'rsatish */
export function useJamoaTaklifi(kod: string | null) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['topshiriqlar', 'jamoa-taklifi', kod],
    enabled: Boolean(kod),
    queryFn: async (): Promise<JamoaTaklifi | null> => {
      const data = await rpc<JamoaTaklifi[]>(supabase, 'jamoa_taklifi', {
        p_kod: kod,
      })
      return Array.isArray(data) && data[0] ? data[0] : null
    },
  })
}

// =============================================================
// Shaxsiy taklif havolasi
// =============================================================

export function useMeningTaklifKodim() {
  const supabase = useSupabase()
  const { id } = useFoydalanuvchi()
  return useQuery({
    queryKey: k.taklifKodi,
    staleTime: Infinity,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await xom(supabase)
        .from('profiles')
        .select('taklif_kodi')
        .eq('id', id)
        .maybeSingle()
      if (error) return null
      return (data as { taklif_kodi?: string } | null)?.taklif_kodi ?? null
    },
  })
}

/** Taklif havolasi orqali ulanish. Qaytadi: taklif qilgan odam ismi */
export function useTaklifOrqaliUlanish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (kod: string) =>
      rpc<string | null>(supabase, 'taklif_orqali_ulanish', { p_kod: kod }),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['topshiriqlar'] }),
  })
}

// =============================================================
// Izohlar, fayllar, tarix
// =============================================================

export function useTopshiriqIzohlari(topshiriqId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: k.izohlar(topshiriqId),
    // Suhbat — yangi izoh ikkinchi tomonda ham tez paydo bo'lsin
    refetchInterval: 5_000,
    queryFn: async (): Promise<TopshiriqIzohi[]> => {
      const sorov = (ustunlar: string) =>
        xom(supabase)
          .from('topshiriq_izohlari')
          .select(ustunlar)
          .eq('topshiriq_id', topshiriqId)
          .order('created_at', { ascending: true })
      // Reaksiyalar bilan birga. Reaksiya jadvali hali yo'q bazada
      // (eski nusxa) so'rov xato beradi — unda reaksiyasiz o'qiymiz,
      // suhbatning o'zi yo'qolib qolmasin.
      let { data, error } = await sorov('*, reaksiyalar:topshiriq_reaksiyalari(foydalanuvchi_id, reaksiya)')
      if (error) ({ data, error } = await sorov('*'))
      if (error) return []
      return (data ?? []) as TopshiriqIzohi[]
    },
  })
}

export function useTopshiriqTarixi(topshiriqId: string) {
  const supabase = useSupabase()
  return useQuery({
    queryKey: k.tarix(topshiriqId),
    queryFn: async (): Promise<TopshiriqHodisasi[]> => {
      const { data, error } = await xom(supabase)
        .from('topshiriq_tarixi')
        .select('*')
        .eq('topshiriq_id', topshiriqId)
        .order('created_at', { ascending: true })
      if (error) return []
      return (data ?? []) as TopshiriqHodisasi[]
    },
  })
}

/** Fayl nomini xavfsiz shaklga keltirish (yo'l ichida "/" bo'lmasin) */
function tozaNom(nom: string): string {
  const toza = nom.replace(/[\\/:*?"<>|#%{}^~[\]`]+/g, '_').trim()
  return (toza || 'fayl').slice(-120)
}

export function useIzohQoshish(topshiriqId: string) {
  const supabase = useSupabase()
  const { id: menId } = useFoydalanuvchi()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ matn, fayl }: { matn: string; fayl?: File | null }) => {
      let fayliga: Record<string, unknown> = {}
      if (fayl) {
        if (fayl.size > FAYL_CHEGARASI) throw new Error('fayl-katta')
        const yol = `${topshiriqId}/${crypto.randomUUID()}-${tozaNom(fayl.name)}`
        const { error } = await supabase.storage
          .from(FAYL_BUCKET)
          .upload(yol, fayl, {
            contentType: fayl.type || 'application/octet-stream',
          })
        if (error) throw new Error(error.message)
        fayliga = {
          fayl_yoli: yol,
          fayl_nomi: fayl.name.slice(0, 200),
          fayl_hajmi: fayl.size,
          fayl_turi: fayl.type || null,
        }
      }
      const { error } = await xom(supabase)
        .from('topshiriq_izohlari')
        .insert({
          topshiriq_id: topshiriqId,
          muallif_id: menId,
          matn: matn.trim() || null,
          ...fayliga,
        })
      if (error) {
        // Izoh yozilmadi — yuklangan fayl yetim qolmasin
        if (typeof fayliga.fayl_yoli === 'string') {
          await supabase.storage.from(FAYL_BUCKET).remove([fayliga.fayl_yoli])
        }
        throw new Error(error.message)
      }
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: k.izohlar(topshiriqId) }),
  })
}

export function useIzohOchirish(topshiriqId: string) {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (izoh: TopshiriqIzohi) => {
      const { error } = await xom(supabase)
        .from('topshiriq_izohlari')
        .delete()
        .eq('id', izoh.id)
      if (error) throw new Error(error.message)
      if (izoh.fayl_yoli) {
        await supabase.storage.from(FAYL_BUCKET).remove([izoh.fayl_yoli])
      }
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: k.izohlar(topshiriqId) }),
  })
}

/** Yopiq bucket — fayl vaqtinchalik (10 daqiqalik) havola bilan ochiladi */
export async function faylHavolasi(
  supabase: ReturnType<typeof useSupabase>,
  yol: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(FAYL_BUCKET)
    .createSignedUrl(yol, 600)
  if (error || !data) throw new Error(error?.message ?? 'havola')
  return data.signedUrl
}

export function useTakrorniToxtatish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      rpc(supabase, 'takrorni_toxtatish', { p_id: id }),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['topshiriqlar'] }),
  })
}

/**
 * Reaksiya qo'yish / almashtirish / olib tashlash (Telegram kabi):
 * o'sha reaksiyani qayta bosish — olib tashlaydi. Ekranda darhol
 * o'zgaradi, server javobini kutmaydi.
 */
export function useReaksiya(topshiriqId: string) {
  const supabase = useSupabase()
  const { id: menId } = useFoydalanuvchi()
  const qc = useQueryClient()
  const kalit = k.izohlar(topshiriqId)

  return useMutation({
    mutationFn: async ({ izohId, reaksiya }: { izohId: string; reaksiya: ReaksiyaTuri | null }) => {
      const jadval = xom(supabase).from('topshiriq_reaksiyalari')
      const { error } = reaksiya
        ? await jadval.upsert(
            { izoh_id: izohId, foydalanuvchi_id: menId, reaksiya },
            { onConflict: 'izoh_id,foydalanuvchi_id' }
          )
        : await jadval.delete().eq('izoh_id', izohId).eq('foydalanuvchi_id', menId)
      if (error) throw new Error(error.message)
    },
    onMutate: async ({ izohId, reaksiya }) => {
      await qc.cancelQueries({ queryKey: kalit })
      const oldingi = qc.getQueryData<TopshiriqIzohi[]>(kalit)
      qc.setQueryData<TopshiriqIzohi[]>(kalit, (eski) =>
        eski?.map((x) => {
          if (x.id !== izohId) return x
          const boshqalar = (x.reaksiyalar ?? []).filter((r) => r.foydalanuvchi_id !== menId)
          return {
            ...x,
            reaksiyalar: reaksiya ? [...boshqalar, { foydalanuvchi_id: menId, reaksiya }] : boshqalar,
          }
        })
      )
      return { oldingi }
    },
    onError: (_x, _v, ctx) => {
      if (ctx?.oldingi) qc.setQueryData(kalit, ctx.oldingi)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: kalit }),
  })
}
