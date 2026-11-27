'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import { useTil } from '@/components/app/til-provayder'
import { useProfil, useProfilYangilash } from '@/lib/queries/profil'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { kalit } from '@/lib/queries/keys'
import { papkaYoli } from '@/lib/yollar'
import {
  DARSLAR,
  TANISHUV_VERSIYASI,
  VAZIFALI_DARSLAR,
  birlashtir,
  holatniOqi,
  kutibOlishKerak,
  lokalHolat,
  lokalSaqla,
  mashqMatnlari,
  panelFaol,
  type DarsKaliti,
  type Maqsad,
  type TanishuvHolati,
} from '@/lib/tanishuv'
import type { Json } from '@/types/database'
import type { Folder, Task } from '@/types/vazifalar'
import { KutibOlish, type KutibOlishNatijasi } from './kutib-olish'
import { DarslarPaneli } from './darslar-paneli'
import { MaslahatPufagi } from './maslahat-pufagi'

type TanishuvKonteksti = {
  holat: TanishuvHolati | null
  saqla: (ozgarish: Partial<TanishuvHolati>) => void
  /** Hammasini boshidan: kutib olish ekranlari yana chiqadi */
  qaytaBoshlash: () => void
}

const Kontekst = createContext<TanishuvKonteksti | null>(null)

/** Yo'riqnoma va boshqa sahifalar uchun. Provayderdan tashqarida `null` */
export function useTanishuv() {
  return useContext(Kontekst)
}

export function TanishuvProvayder({ children }: { children: React.ReactNode }) {
  const foydalanuvchi = useFoydalanuvchi()
  const { til } = useTil()
  const supabase = useSupabase()
  const qc = useQueryClient()
  const router = useRouter()
  const yol = usePathname()
  const profil = useProfil()
  const profilYangila = useProfilYangilash()

  const [lokal, setLokal] = useState<TanishuvHolati | null>(() =>
    lokalHolat(foydalanuvchi.id)
  )

  /*
    Birinchi versiya tanishuv so'rovini `vazifalar` prefiksi ostida
    saqlagan va u IndexedDB'ga yozilib qolgan. U obyekt bo'lgani uchun
    vazifa ro'yxatlarini kutayotgan kod unda yiqilardi. Bir marta
    o'chirib tashlaymiz — keyingi saqlashda keshdan butunlay ketadi.
  */
  useEffect(() => {
    qc.removeQueries({ queryKey: [...kalit.vazifalar, 'tanishuv'] })
  }, [qc])

  /*
    Ustun hali bazaga qo'shilmagan bo'lsa (migratsiya ishga
    tushirilmagan) hisobga yozmaymiz — aks holda har bir saqlash
    xato berib, offline navbatda osilib qolardi. Bu holatda tanishuv
    faqat shu qurilmada eslab qolinadi.
  */
  const ustunBor = Boolean(profil.data && 'onboarding' in profil.data)
  const serverHolat = useMemo(
    () =>
      ustunBor
        ? holatniOqi((profil.data as { onboarding?: unknown }).onboarding)
        : null,
    [ustunBor, profil.data]
  )
  const holat = useMemo(() => birlashtir(lokal, serverHolat), [lokal, serverHolat])
  const tayyor = profil.isSuccess || profil.isError

  const holatRef = useRef(holat)
  holatRef.current = holat

  const saqla = useCallback(
    (ozgarish: Partial<TanishuvHolati>) => {
      const yangi: TanishuvHolati = {
        ...(holatRef.current ?? {}),
        ...ozgarish,
        v: TANISHUV_VERSIYASI,
      }
      holatRef.current = yangi
      setLokal(yangi)
      lokalSaqla(foydalanuvchi.id, yangi)
      if (ustunBor) profilYangila.mutate({ onboarding: yangi as unknown as Json })
    },
    // profilYangila.mutate barqaror, qolganlari kam o'zgaradi
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [foydalanuvchi.id, ustunBor]
  )

  const qaytaBoshlash = useCallback(() => {
    saqla({
      eski: false,
      kutibOlindi: false,
      yopilgan: false,
      tugadi: false,
      papkaId: undefined,
      vazifalar: {},
      bajarilgan: [],
      maslahatlar: [],
    })
  }, [saqla])

  // ---------------------------------------------------------------
  // Mashq papkasini yaratish
  // ---------------------------------------------------------------
  const [yaratilmoqda, setYaratilmoqda] = useState(false)

  const mashqPapkasiniYarat = useCallback(
    async (maqsad: Maqsad | undefined) => {
      setYaratilmoqda(true)
      const matnlar = mashqMatnlari(til)
      try {
        const { data: papka, error: papkaXato } = await supabase
          .from('folders')
          .insert({
            user_id: foydalanuvchi.id,
            name: matnlar.papka,
            color: '#f59e0b',
            icon: 'goya',
            sort_order: 0,
          })
          .select()
          .single()
        if (papkaXato) throw papkaXato

        const qatorlar = VAZIFALI_DARSLAR.map((dars, i) => ({
          user_id: foydalanuvchi.id,
          folder_id: papka.id,
          title: matnlar.vazifalar[dars as keyof typeof matnlar.vazifalar].nom,
          description: matnlar.vazifalar[dars as keyof typeof matnlar.vazifalar].izoh,
          priority: 4,
          progress: 0,
          status: 'planned',
          sort_order: i,
        }))
        const { data: vazifalar, error: vazifaXato } = await supabase
          .from('tasks')
          .insert(qatorlar)
          .select('id, sort_order')
        if (vazifaXato) throw vazifaXato

        const xarita: Partial<Record<DarsKaliti, string>> = {}
        for (const v of vazifalar ?? []) {
          const dars = VAZIFALI_DARSLAR[v.sort_order ?? -1]
          if (dars) xarita[dars] = v.id
        }

        saqla({ maqsad, papkaId: papka.id, vazifalar: xarita })
        await Promise.all([
          qc.invalidateQueries({ queryKey: kalit.papkalar }),
          qc.invalidateQueries({ queryKey: kalit.vazifalar }),
        ])
        router.push(papkaYoli(papka.id))
      } catch {
        // Internet yo'q yoki server xatosi — tanishuv papkasiz qoladi.
        // Odam uni Yo'riqnoma sahifasidan qayta boshlay oladi.
      } finally {
        setYaratilmoqda(false)
      }
    },
    [foydalanuvchi.id, qc, router, saqla, supabase, til]
  )

  const kutibOlishniTugat = useCallback(
    (natija: KutibOlishNatijasi | null) => {
      if (!natija) {
        // "O'tkazib yuborish": odam ilovani biladi — darslar kerak emas
        saqla({ kutibOlindi: true, yopilgan: true })
        return
      }
      const maqsad = natija.maqsadlar[0]
      saqla({
        kutibOlindi: true,
        maqsad,
        maqsadlar: natija.maqsadlar,
        manba: natija.manba ?? undefined,
        boshlangan: new Date().toISOString(),
        bajarilgan: [],
        yopilgan: false,
        tugadi: false,
      })
      void mashqPapkasiniYarat(maqsad)
    },
    [mashqPapkasiniYarat, saqla]
  )

  // ---------------------------------------------------------------
  // Darslarni kuzatish — ilova harakatni o'zi sezadi
  // ---------------------------------------------------------------
  const faol = panelFaol(holat)
  const bajarilgan = useMemo(() => holat?.bajarilgan ?? [], [holat?.bajarilgan])
  const [yangiYutuq, setYangiYutuq] = useState<DarsKaliti | null>(null)

  const darsniBelgila = useCallback(
    (darslar: DarsKaliti[]) => {
      const joriy = holatRef.current?.bajarilgan ?? []
      const yangilari = darslar.filter((d) => !joriy.includes(d))
      if (yangilari.length === 0) return
      saqla({ bajarilgan: [...joriy, ...yangilari] })
      setYangiYutuq(yangilari[yangilari.length - 1])
    },
    [saqla]
  )

  const mashqIdlari = useMemo(
    () => Object.values(holat?.vazifalar ?? {}).filter(Boolean) as string[],
    [holat?.vazifalar]
  )

  /*
    Serverdan: mashq vazifalari va "o'zim qo'shgan birinchi vazifa".

    Kalit ATAYLAB `vazifalar` prefiksi ostida EMAS: u yerdagi har bir
    kesh vazifalar ro'yxati deb hisoblanadi va optimistik yangilashlar
    unga `.map()` qiladi. Bu yerdagi natija esa obyekt — prefiks ostida
    tursa, har bir "bajarildi" bosilishi xato berib orqaga qaytardi.
    Vazifalar o'zgarganda bu so'rov pastdagi obunada qo'lda yangilanadi.
  */
  const tanishuvKaliti = ['tanishuv', 'vazifalar', holat?.papkaId ?? '', holat?.boshlangan ?? '']
  const serverdan = useQuery({
    queryKey: tanishuvKaliti,
    enabled: faol && mashqIdlari.length > 0,
    queryFn: async () => {
      const [mashq, ozim] = await Promise.all([
        supabase.from('tasks').select('*').in('id', mashqIdlari).is('deleted_at', null),
        supabase
          .from('tasks')
          .select('id')
          .not('id', 'in', `(${mashqIdlari.join(',')})`)
          .gte('created_at', holat?.boshlangan ?? new Date(0).toISOString())
          .is('deleted_at', null)
          .limit(1),
      ])
      return {
        mashq: (mashq.data ?? []) as Task[],
        ozimQoshdim: (ozim.data ?? []).length > 0,
      }
    },
  })

  /*
    Keshdan: optimistik yangilanishlar shu yerda DARHOL ko'rinadi —
    odam doirachani bosgan zahoti maqtov chiqadi, server javobini
    kutmaydi. Internet yo'q paytda ham ishlaydi.
  */
  useEffect(() => {
    if (!faol) return
    const vazifaIdlari = holat?.vazifalar ?? {}
    const boshlangan = holat?.boshlangan ? Date.parse(holat.boshlangan) : NaN
    const yangimi = (sana: string | null | undefined) =>
      Boolean(sana) && !Number.isNaN(boshlangan) && Date.parse(sana!) >= boshlangan

    const tekshir = () => {
      const topildi = new Map<string, Task>()
      let ozimQoshdim = serverdan.data?.ozimQoshdim ?? false
      for (const t of serverdan.data?.mashq ?? []) topildi.set(t.id, t)

      for (const [, data] of qc.getQueriesData<unknown>({ queryKey: kalit.vazifalar })) {
        if (!Array.isArray(data)) continue
        for (const t of data as Task[]) {
          if (!t || typeof t !== 'object' || !('id' in t)) continue
          if (mashqIdlari.includes(t.id)) {
            topildi.set(t.id, t)
          } else if (yangimi(t.created_at)) {
            ozimQoshdim = true
          }
        }
      }

      const papkalar = qc.getQueryData<Folder[]>(kalit.papkalar) ?? []
      const ozPapkam = papkalar.some(
        (p) =>
          !p.is_inbox &&
          !p.is_projects &&
          p.id !== holat?.papkaId &&
          yangimi(p.created_at)
      )

      const v = (d: DarsKaliti) => {
        const id = vazifaIdlari[d]
        return id ? topildi.get(id) : undefined
      }
      const tayyorlar: DarsKaliti[] = []
      if (v('bajar')?.status === 'done') tayyorlar.push('bajar')
      if (v('sana')?.due_date) tayyorlar.push('sana')
      const muhim = v('muhim')
      if (muhim && muhim.priority < 4) tayyorlar.push('muhim')
      const takror = v('takror')
      if (takror && (takror.rrule || takror.recurrence)) tayyorlar.push('takror')
      if (ozimQoshdim) tayyorlar.push('yangi')
      if (ozPapkam) tayyorlar.push('papka')
      darsniBelgila(tayyorlar)
    }

    tekshir()
    let kadr = 0
    let serverTaymeri: ReturnType<typeof setTimeout> | undefined
    const obuna = qc.getQueryCache().subscribe((hodisa) => {
      cancelAnimationFrame(kadr)
      kadr = requestAnimationFrame(tekshir)
      // Vazifa ro'yxati serverdan yangilansa, mashq holatini ham
      // qayta so'raymiz (bir soniyada ko'pi bilan bir marta)
      const k = hodisa.query.queryKey
      if (k[0] === kalit.vazifalar[0] && hodisa.type === 'updated') {
        clearTimeout(serverTaymeri)
        serverTaymeri = setTimeout(
          () => qc.invalidateQueries({ queryKey: ['tanishuv', 'vazifalar'] }),
          1000
        )
      }
    })
    return () => {
      cancelAnimationFrame(kadr)
      clearTimeout(serverTaymeri)
      obuna()
    }
  }, [faol, holat?.vazifalar, holat?.boshlangan, holat?.papkaId, mashqIdlari, qc, serverdan.data, darsniBelgila])

  // "Kechki reja"ni ochish darsi — sahifaga kirishning o'zi yetarli
  useEffect(() => {
    if (faol && yol.replace(/\/+$/, '') === '/kechki-reja') darsniBelgila(['kechki'])
  }, [faol, yol, darsniBelgila])

  const hammasiTayyor = faol && DARSLAR.every((d) => bajarilgan.includes(d))

  const qiymat = useMemo(
    () => ({ holat, saqla, qaytaBoshlash }),
    [holat, saqla, qaytaBoshlash]
  )

  const kutibOlishOchiq = tayyor && kutibOlishKerak(holat)

  return (
    <Kontekst.Provider value={qiymat}>
      {children}

      {kutibOlishOchiq && <KutibOlish tugat={kutibOlishniTugat} />}

      {!kutibOlishOchiq && faol && (
        <DarslarPaneli
          holat={holat!}
          yangiYutuq={yangiYutuq}
          yutuqniYop={() => setYangiYutuq(null)}
          hammasiTayyor={hammasiTayyor}
          saqla={saqla}
        />
      )}

      {yaratilmoqda && (
        <div
          role="status"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-surface/80 backdrop-blur-sm"
        >
          <div className="size-10 animate-spin rounded-full border-4 border-brand-soft border-t-brand-primary" />
        </div>
      )}

      {!kutibOlishOchiq && !yangiYutuq && holat && !holat.eski && holat.kutibOlindi && (
        <MaslahatPufagi holat={holat} saqla={saqla} />
      )}
    </Kontekst.Provider>
  )
}
