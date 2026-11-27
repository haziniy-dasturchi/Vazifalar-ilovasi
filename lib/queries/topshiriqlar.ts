'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { kalit } from './keys'
import { onlineManager } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import type { Topshiriq, TaskPriority, TopshiriqTakrori } from '@/types/vazifalar'

/**
 * Internet bormi. Topshiriq amallari (qabul, topshirish, tasdiqlash)
 * ATAYLAB faqat onlayn: ikki kishi offline'da bir topshiriqni
 * o'zgartirsa ziddiyat chiqardi (SWOT tahdidi). Shuning uchun
 * tugmalar offline'da o'chadi va sababi aytiladi.
 */
export function useOnlaynmi(): boolean {
  return useSyncExternalStore(
    (f) => onlineManager.subscribe(f),
    () => onlineManager.isOnline(),
    () => true
  )
}

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
  insert: (
    qator: Record<string, unknown> | Record<string, unknown>[]
  ) => PromiseLike<{
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
  /**
   * Bir nechta odamga — har biriga alohida nusxa (umumiy `guruh_id`
   * bilan). Berilsa, `qabul_qiluvchi_email` o'rniga shu ishlatiladi.
   */
  qabul_qiluvchilar?: string[]
  takror?: TopshiriqTakrori | null
  /** Qachondan boshlab ishlanadi (ijrochi vazifasining reja kuni) */
  boshlanish?: string | null
  /** `HH:MM` — nechada boshlanadi */
  boshlanish_vaqt?: string | null
  sarlavha: string
  izoh?: string | null
  muddat?: string | null
  /** `HH:MM` — faqat muddat sanasi bilan */
  muddat_vaqt?: string | null
  muhimlik?: TaskPriority
  /** Ijrochi tugatganda yuboruvchi tasdiqlaydimi */
  tekshirish?: boolean
}

export function useTopshiriqYuborish() {
  const supabase = useSupabase()
  const { id } = useFoydalanuvchi()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (yangi: YangiTopshiriq) => {
      const kimlarga = [
        ...new Set(
          (yangi.qabul_qiluvchilar?.length
            ? yangi.qabul_qiluvchilar
            : [yangi.qabul_qiluvchi_email]
          ).map((e) => e.trim().toLowerCase())
        ),
      ].filter(Boolean)
      const guruhId = kimlarga.length > 1 ? crypto.randomUUID() : null

      const asosiy = {
        yuboruvchi_id: id,
        sarlavha: yangi.sarlavha.trim(),
        izoh: yangi.izoh?.trim() || null,
        muddat: yangi.muddat ?? null,
        muhimlik: yangi.muhimlik ?? 4,
      }
      const toliq = {
        ...asosiy,
        ...(yangi.boshlanish ? { boshlanish: yangi.boshlanish } : {}),
        ...(yangi.boshlanish && yangi.boshlanish_vaqt
          ? { boshlanish_vaqt: yangi.boshlanish_vaqt }
          : {}),
        muddat_vaqt: yangi.muddat ? (yangi.muddat_vaqt ?? null) : null,
        tekshirish: yangi.tekshirish ?? true,
        ...(yangi.takror ? { takror: yangi.takror } : {}),
        ...(guruhId ? { guruh_id: guruhId } : {}),
      }
      // Bitta so'rovda: biror odamga yozib bo'lmasa (blok), hech
      // kimga ketmaydi — "yarmiga ketdi" degan chalkash holat bo'lmaydi
      let { error } = await jadval(supabase).insert(
        kimlarga.map((e) => ({ ...toliq, qabul_qiluvchi_email: e }))
      )
      /*
        Yangi migratsiyalar hali qo'llanmagan bo'lsa, yangi ustunlar
        yo'q va baza butun qatorni rad etadi. Interfeys bazadan oldin
        chiqsa ham yuborish ishlashi uchun — eski shaklda qayta urinamiz.
      */
      if (error && /muddat_vaqt|tekshirish|takror|guruh_id|boshlanish/.test(error.message)) {
        ;({ error } = await jadval(supabase).insert(
          kimlarga.map((e) => ({ ...asosiy, qabul_qiluvchi_email: e }))
        ))
      }
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

/** Ijrochi: "Bajardim" — izoh bilan tekshiruvga topshiradi */
export function useTopshiriqTopshirish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, izoh }: { id: string; izoh: string }) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_topshirish', {
        p_id: id,
        p_izoh: izoh,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks })
      // Ijrochining ro'yxatidagi vazifa ham bajarildi bo'ladi
      qc.invalidateQueries({ queryKey: kalit.vazifalar })
    },
  })
}

/** Yuboruvchi: natijani qabul qiladi */
export function useTopshiriqTasdiqlash() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, baho }: { id: string; baho?: number | null }) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_tasdiqlash', {
        p_id: id,
        ...(baho ? { p_baho: baho } : {}),
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

/** Yuboruvchi: sabab bilan qayta ishlashga qaytaradi */
export function useTopshiriqQaytarish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, sabab }: { id: string; sabab: string }) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_qaytarish', {
        p_id: id,
        p_sabab: sabab,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

export type TopshiriqKontakti = {
  email: string
  /** Maxfiylik qoidasi bo'yicha (bazada) — ochiq bo'lmasa null */
  ism: string | null
}

/**
 * Topshiriq almashilgan odamlar — email qayta yozilmasin.
 *
 * Migratsiya hali qo'llanmagan bo'lsa, avvalgidek faqat men
 * yuborgan manzillardan (ismsiz) yig'iladi.
 */
export function useTopshiriqKontaktlari(): TopshiriqKontakti[] {
  const supabase = useSupabase()
  const { data: yuborilgan } = useYuborilganTopshiriqlar()

  const { data } = useQuery({
    queryKey: kalit.topshiriqKontaktlari(),
    queryFn: async (): Promise<TopshiriqKontakti[] | null> => {
      const { data, error } = await rpcOqi(supabase, 'topshiriq_kontaktlari', {})
      if (error) return null
      return (Array.isArray(data) ? data : []) as TopshiriqKontakti[]
    },
  })

  if (data) return data

  const korilgan = new Set<string>()
  const natija: TopshiriqKontakti[] = []
  for (const t of yuborilgan ?? []) {
    if (!korilgan.has(t.qabul_qiluvchi_email)) {
      korilgan.add(t.qabul_qiluvchi_email)
      natija.push({ email: t.qabul_qiluvchi_email, ism: null })
    }
  }
  return natija
}

export type TopshiriqYangiligi = {
  topshiriq_id: string
  /** Boshqa tomon yozgan, men hali o'qimagan xabarlar */
  yangi_xabarlar: number
  /** Menga kelgan, lekin hali ochib ko'rmaganim */
  ochilmagan: boolean
}

/**
 * O'qilmagan xabarlar va ochilmagan topshiriqlar. Menyu belgisi va
 * kartadagi raqam shundan. Suhbat uchun tez-tez yangilanadi.
 */
export function useTopshiriqYangiliklari() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['topshiriqlar', 'yangiliklar'],
    refetchInterval: 30_000,
    queryFn: async (): Promise<TopshiriqYangiligi[]> => {
      const { data, error } = await rpcOqi(supabase, 'topshiriq_yangiliklari', {})
      if (error) return []
      return (Array.isArray(data) ? data : []) as TopshiriqYangiligi[]
    },
  })
}

/** Topshiriq sahifasi ochilganda — hammasi "o'qilgan" bo'ladi */
export function useTopshiriqKorildi() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await rpcChaqir(supabase, 'topshiriq_korildi', { p_id: id })
    },
    onSettled: () =>
      qc.invalidateQueries({ queryKey: ['topshiriqlar', 'yangiliklar'] }),
  })
}

export type TopshiriqTahriri = {
  id: string
  sarlavha: string
  izoh: string
  boshlanish: string | null
  boshlanish_vaqt: string | null
  muddat: string | null
  muddat_vaqt: string | null
  muhimlik: TaskPriority
  takror: TopshiriqTakrori | null
}

export function useTopshiriqTahrirlash() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (t: TopshiriqTahriri) => {
      const { error } = await rpcChaqir(supabase, 'topshiriqni_tahrirlash', {
        p_id: t.id,
        p_sarlavha: t.sarlavha.trim(),
        p_izoh: t.izoh,
        p_boshlanish: t.boshlanish,
        p_boshlanish_vaqt: t.boshlanish ? t.boshlanish_vaqt : null,
        p_muddat: t.muddat,
        p_muddat_vaqt: t.muddat ? t.muddat_vaqt : null,
        p_muhimlik: t.muhimlik,
        p_takror: t.takror,
      })
      if (error) throw new Error(error.message)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: kalit.topshiriqlarPrefiks }),
  })
}

/**
 * Menyudagi raqam: o'qilmagan xabarlar + hali ochilmagan yangi
 * topshiriqlar + mendan tekshiruv kutayotgan natijalar.
 */
export function useTopshiriqBelgisi(): number {
  const { data: yangiliklar } = useTopshiriqYangiliklari()
  const { data: yuborilgan } = useYuborilganTopshiriqlar()
  const xabarlar = (yangiliklar ?? []).reduce(
    (s, y) => s + y.yangi_xabarlar + (y.ochilmagan ? 1 : 0),
    0
  )
  return xabarlar + (yuborilgan?.filter((x) => x.holat === 'tekshiruvda').length ?? 0)
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
 * `topshiriq_tafsilotlari()` RPC natijasi.
 *
 * Nega alohida so'rov: ism ham, jarayon ham BOSHQA odamning
 * ma'lumoti. RLS ularni to'g'ridan-to'g'ri bermaydi (va to'g'ri
 * qiladi), shuning uchun faqat kerakli uch-to'rt maydonni
 * qaytaradigan tor funksiya ishlatiladi.
 *
 * Migratsiya hali qo'llanmagan bo'lsa xato bo'ladi — bunda bo'sh
 * ro'yxat qaytadi va kartalar avvalgidek, ismsiz ko'rinadi. Ya'ni
 * interfeys bazadan oldin chiqsa ham buzilmaydi.
 *
 * MUHIM: bu yerda ODDIY MASSIV qaytadi, `Map` emas.
 * Kesh IndexedDB'ga JSON sifatida yoziladi (`JSON.stringify`),
 * JSON esa `Map` ni bilmaydi — u bo'sh `{}` bo'lib saqlanardi va
 * ilova qayta ochilganda `.get()` yo'q obyekt qaytib, sahifa
 * butunlay qulardi. Xaritaga aylantirish komponentda bo'ladi.
 */
export function useTopshiriqTafsilotlari() {
  const supabase = useSupabase()

  return useQuery({
    queryKey: kalit.topshiriqTafsilotlari(),
    /*
      Boshliq xodimning ishini kuzatadi, shuning uchun jarayon
      o'zidan yangilanib turishi kerak: xodim foizni o'zgartirsa,
      boshliq sahifani qayta ochmasdan ham ko'radi.
    */
    refetchInterval: 60_000,
    queryFn: async (): Promise<TopshiriqTafsiloti[]> => {
      const { data, error } = await rpcOqi(
        supabase,
        'topshiriq_tafsilotlari',
        {}
      )
      if (error) return []
      return (data ?? []) as TopshiriqTafsiloti[]
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

/**
 * "Men shu odamga topshiriq yoza olamanmi?"
 *
 * Nega oldindan so'raladi: taqiq RLS da, ya'ni yuborish tugmasi
 * bosilgandan keyin baza rad etadi va mijoz faqat quruq
 * "saqlanmadi" xatosini ko'radi. Odam esa nima uchun ishlamayotganini
 * bilmaydi va qayta-qayta urinadi. Shuning uchun email yozilishi
 * bilan tekshirib, sababini oldindan aytamiz.
 *
 * Funksiya faqat ha/yo'q qaytaradi — qabul qiluvchi haqida hech
 * qanday ma'lumot oshkor bo'lmaydi.
 */
export function useYozsaBoladimi(email: string) {
  const supabase = useSupabase()
  const { id } = useFoydalanuvchi()
  const toza = email.trim().toLowerCase()

  return useQuery({
    queryKey: ['topshiriqlar', 'yozsa-boladimi', toza],
    // Ma'noli email bo'lmaguncha so'ramaymiz
    enabled: toza.includes('@') && toza.includes('.'),
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await rpcOqi(
        supabase,
        'topshiriq_yozsa_boladimi',
        { p_yuboruvchi_id: id, p_email: toza }
      )
      // Migratsiya hali qo'llanmagan bo'lsa to'sib qo'ymaymiz
      if (error) return true
      return data !== false
    },
  })
}
