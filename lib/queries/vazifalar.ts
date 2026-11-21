'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { yangiId } from '@/lib/id'
import { bugunISO, isoGa } from '@/lib/sana'
import { rruleEskiga, vazifaningKeyingiSanasi } from '@/lib/takrorlanish'
import { kalit } from './keys'
import { useOutboxMutation } from './outbox-mutatsiya'
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
    .is('deleted_at', null)
    .eq('folder_id', papkaId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Task[]
}

/**
 * Takrorlanuvchi vazifa bajarilganda server uni DARHOL keyingi sanaga
 * suradi (`status` yana "planned" bo'lib qoladi) — shuning uchun
 * `status === 'done'` bo'yicha qidirish uni hech qachon topmaydi,
 * garchi odam bugun uni bajargan bo'lsa ham.
 *
 * `task_events` jurnalida esa bajarilgan paytdagi "completed" yozuvi
 * saqlanib qoladi (hisobot shu orqali ishlaydi). Shu yozuvlardan
 * foydalanib, bugun bajarilgan-u keyingi sanaga ko'chib ketgan
 * takrorlanuvchi vazifalarni topib olamiz.
 */
async function takrorBugunBajarilganlarSorovi(
  supabase: Mijoz,
  kunBoshi: Date
): Promise<Task[]> {
  const { data: hodisalar, error: hodisaXatosi } = await supabase
    .from('task_events')
    .select('task_id')
    .eq('event', 'completed')
    .gte('created_at', kunBoshi.toISOString())
    .not('task_id', 'is', null)

  if (hodisaXatosi) throw hodisaXatosi

  const idlar = [...new Set((hodisalar ?? []).map((h) => h.task_id as string))]
  if (idlar.length === 0) return []

  const { data, error } = await supabase
    .from('tasks')
    .select(USTUNLAR)
    .is('deleted_at', null)
    .neq('status', 'done')
    .not('rrule', 'is', null)
    .in('id', idlar)

  if (error) throw error
  return (data ?? []) as Task[]
}

async function bugungiSorovi(supabase: Mijoz): Promise<Task[]> {
  const bugun = bugunISO()
  const kunBoshi = new Date()
  kunBoshi.setHours(0, 0, 0, 0)

  const [ochiq, bajarilgan, takrorBajarilgan] = await Promise.all([
    supabase
      .from('tasks')
      .select(USTUNLAR)
      .is('deleted_at', null)
      .neq('status', 'done')
      .lte('due_date', bugun)
      .order('due_date', { ascending: true })
      .order('priority', { ascending: true })
      .order('sort_order', { ascending: true }),
    supabase
      .from('tasks')
      .select(USTUNLAR)
      .is('deleted_at', null)
      .eq('status', 'done')
      .gte('completed_at', kunBoshi.toISOString())
      .order('completed_at', { ascending: false }),
    takrorBugunBajarilganlarSorovi(supabase, kunBoshi),
  ])

  if (ochiq.error) throw ochiq.error
  if (bajarilgan.error) throw bajarilgan.error

  return [
    ...(ochiq.data ?? []),
    ...(bajarilgan.data ?? []),
    ...takrorBajarilgan,
  ] as Task[]
}

async function jarayondagiSorovi(supabase: Mijoz): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(USTUNLAR)
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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
    .is('deleted_at', null)
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
// "Aqlli" ro'yxatlar (bugun/jarayonda/kelgusi/ertangi) — holat yoki
// sana o'zgarsa, vazifa ulardan BIRIDAN IKKINCHISIGA "ko'chishi"
// kerak. `keshdaYangila` buni qilolmaydi — u faqat allaqachon
// ro'yxatda turgan yozuvning MAYDONLARINI yangilaydi, uni ro'yxatga
// qo'shmaydi yoki ro'yxatdan chiqarmaydi.
//
// Internet bor paytda bu sezilmasdi: `onSettled` darhol serverdan
// haqiqiy ro'yxatni qayta yuklardi (bir necha yuz millisekundda).
// Internetsiz esa bu so'rov HECH QACHON tugamaydi (mutatsiya "pauza"da
// turadi, `onSettled` ham chaqirilmaydi), shuning uchun noto'g'ri
// ro'yxat cheksiz vaqt ko'rinib qoladi — masalan "Jarayonda"
// sahifasiga o'tkazilgan vazifa u yerda ko'rinmaydi, "rejaga
// qaytarilgan" vazifa esa o'sha sahifada osilib qolaveradi.
// =============================================================

function jarayondaMi(v: Pick<Task, 'status'>) {
  return v.status === 'in_progress'
}

function bugundaMi(v: Pick<Task, 'status' | 'due_date' | 'completed_at'>) {
  if (v.status === 'done') {
    return Boolean(v.completed_at) && v.completed_at!.slice(0, 10) === bugunISO()
  }
  return Boolean(v.due_date) && v.due_date! <= bugunISO()
}

function kelgusidaMi(v: Pick<Task, 'status' | 'due_date'>) {
  return v.status !== 'done' && Boolean(v.due_date) && v.due_date! > bugunISO()
}

function ertangaMi(v: Pick<Task, 'status' | 'due_date'>) {
  const ertaga = new Date()
  ertaga.setDate(ertaga.getDate() + 1)
  return v.status !== 'done' && v.due_date === isoGa(ertaga)
}

/** Bitta ro'yxatda vazifani qo'shadi/yangilaydi (tegishli bo'lsa) yoki olib tashlaydi (bo'lmasa) */
function royxatdaKochir(
  qc: QueryClient,
  queryKey: readonly unknown[],
  vazifa: Task,
  tegishlimi: boolean
) {
  qc.setQueryData<Task[]>(queryKey as unknown as readonly unknown[], (eski) => {
    if (!eski) return eski
    const bor = eski.some((v) => v.id === vazifa.id)
    if (tegishlimi) {
      return bor
        ? eski.map((v) => (v.id === vazifa.id ? vazifa : v))
        : [...eski, vazifa]
    }
    return bor ? eski.filter((v) => v.id !== vazifa.id) : eski
  })
}

/** Keshdagi istalgan ro'yxatdan vazifaning TO'LIQ (oxirgi ma'lum) nusxasini topadi */
function joriyVazifa(qc: QueryClient, id: string): Task | undefined {
  for (const [, data] of qc.getQueriesData<Task[]>({ queryKey: kalit.vazifalar })) {
    const topilgan = data?.find((v) => v.id === id)
    if (topilgan) return topilgan
  }
  return undefined
}

/**
 * Holat yoki sana o'zgarganda "aqlli" ro'yxatlarni (va papka
 * o'zgargan bo'lsa — papka ro'yxatini ham) to'g'rilaydi.
 * `keshdaYangila`dan KEYIN chaqiriladi — u maydonlarni yangilaydi,
 * bu funksiya esa ro'yxatga qo'shish/chiqarishni bajaradi.
 */
function royxatlarniKochir(qc: QueryClient, eski: Task | undefined, yangi: Task) {
  royxatdaKochir(qc, kalit.jarayondagi(), yangi, jarayondaMi(yangi))
  royxatdaKochir(qc, kalit.bugungi(), yangi, bugundaMi(yangi))
  royxatdaKochir(qc, kalit.kelgusi(), yangi, kelgusidaMi(yangi))
  royxatdaKochir(qc, kalit.ertangi(), yangi, ertangaMi(yangi))

  if (eski && eski.folder_id !== yangi.folder_id) {
    royxatdaKochir(qc, kalit.papkaVazifalari(eski.folder_id), yangi, false)
    royxatdaKochir(qc, kalit.papkaVazifalari(yangi.folder_id), yangi, true)
  }
}

// =============================================================
// O'zgartirishlar
// =============================================================

export type { YangiVazifa }

export function useVazifaYaratish() {
  const supabase = useSupabase()
  const qc = useQueryClient()
  const { id: userId } = useFoydalanuvchi()

  return useOutboxMutation({
    mutationKey: MUTATSIYA.vazifaYaratish,

    onMutate: async (yangi: YangiVazifa) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)

      const holat = yangi.status ?? 'planned'
      const hozir = new Date().toISOString()

      const vaqtinchalik: Task = {
        // ID brauzerda yaratiladi — chaqiruvchi bermagan bo'lsa ham
        id: yangi.id ?? yangiId(),
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
        // Faqat takrorlanuvchi vazifa bajarilganda to'ladi
        prev_due_date: null,
        notified_at: null,
        deleted_at: null,
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

  return useOutboxMutation({
    mutationKey: MUTATSIYA.vazifaYangilash,

    onMutate: async ({
      id,
      // Konflikt qoidasi uchun yuboriladi, keshga yozilmaydi
      mijozVaqti: _mijozVaqti,
      ...ozgarish
    }: VazifaOzgarishi & { id: string; mijozVaqti?: string }) => {
      await qc.cancelQueries({ queryKey: kalit.vazifalar })
      const nusxa = keshNusxasi(qc)
      const eskiVazifa = joriyVazifa(qc, id)
      keshdaYangila(qc, id, ozgarish as Partial<Task>)
      if (eskiVazifa) royxatlarniKochir(qc, eskiVazifa, { ...eskiVazifa, ...ozgarish })
      return { nusxa }
    },

    onError: (_xato, _ozgarish, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}

export function useVazifaOchirish() {
  const supabase = useSupabase()
  const qc = useQueryClient()

  return useOutboxMutation({
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

  return useOutboxMutation({
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
      const eskiVazifa = joriyVazifa(qc, id)
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
        // Bekor qilinsa shu sanaga qaytariladi — serverda ham
        // shunday yoziladi. Internetsiz bajarib, keyin darhol
        // bekor qilish uchun ham shart.
        ozgarish.prev_due_date = eskiVazifa?.due_date ?? null
      }

      /*
        BEKOR QILISH ikki xil bo'ladi:

        * oddiy vazifa — holati "done", uni "planned" ga qaytarish
          kifoya (yuqoridagi `status` o'zgarishi);
        * takrorlanuvchi — bajarilgan zahoti keyingi sanaga surilgan
          va holati allaqachon "planned". Uni "qaytarish" aslida
          SANANI orqaga olish demak.

        `prev_due_date` bo'sh bo'lishi mumkin: bu imkoniyat
        qo'shilishidan oldin bajarilgan vazifalarda u yo'q. O'shanda
        server oxirgi "bajarildi" hodisasining kuniga qaytaradi —
        bu yerda esa u deyarli har doim bugun bo'ladi.
      */
      if (harakat === 'qaytarish') {
        ozgarish.prev_due_date = null
        if (eskiVazifa && eskiVazifa.status !== 'done') {
          ozgarish.due_date = eskiVazifa.prev_due_date ?? bugunISO()
          ozgarish.started_at = null
        }
      }

      keshdaYangila(qc, id, ozgarish)
      if (eskiVazifa) royxatlarniKochir(qc, eskiVazifa, { ...eskiVazifa, ...ozgarish })

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
      if (vazifa?.id) {
        const eskiVazifa = joriyVazifa(qc, vazifa.id)
        keshdaYangila(qc, vazifa.id, vazifa)
        royxatlarniKochir(qc, eskiVazifa, vazifa)
      }
    },

    onError: (_xato, _args, context) => keshniTikla(qc, context?.nusxa),
    onSettled: () => vazifalarniYangilash(qc),
  })
}
