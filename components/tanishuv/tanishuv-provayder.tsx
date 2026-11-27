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
import { useToast } from '@/components/ui/toast'
import { useProfil, useProfilYangilash } from '@/lib/queries/profil'
import { useSupabase } from '@/lib/supabase/use-supabase'
import { kalit } from '@/lib/queries/keys'
import { papkaYoli } from '@/lib/yollar'
import { mavzugaObuna } from '@/lib/mavzu'
import { tilgaObuna } from '@/lib/til-saqlash'
import {
  DARSLAR,
  MASHQ_PAPKA_BELGISI,
  MASHQ_PAPKA_NOMLARI,
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
import type { Folder, Section, Task } from '@/types/vazifalar'
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

/** Shu kesh prefikslaridan biri yangilansa, server holati qayta so'raladi */
const KUZATILADIGAN = ['vazifalar', 'bolimlar', 'topshiriqlar']

/** Faqat ko'rib chiqish talab qiladigan darslar: yo'l → dars */
const SAHIFA_DARSLARI: Record<string, DarsKaliti> = {
  '/kechki-reja': 'kechki',
  '/hisobot': 'hisobot',
}

/** Yo'riqnoma va boshqa sahifalar uchun. Provayderdan tashqarida `null` */
export function useTanishuv() {
  return useContext(Kontekst)
}

export function TanishuvProvayder({ children }: { children: React.ReactNode }) {
  const foydalanuvchi = useFoydalanuvchi()
  const { til, t } = useTil()
  const supabase = useSupabase()
  const qc = useQueryClient()
  const router = useRouter()
  const yol = usePathname()
  const profil = useProfil()
  const profilYangila = useProfilYangilash()
  const { korsat } = useToast()

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
      tugadiSoni: 0,
      papkaId: undefined,
      vazifalar: {},
      bajarilgan: [],
      maslahatlar: [],
    })
  }, [saqla])

  /*
    v1 da "Ishni boshlang" darsi vazifani bajarishdan ham belgilanib
    qolardi. Shunday holatlarda bu dars bir marta bekor qilinadi —
    odam uni haqiqatan sinab ko'rsin. `saqla` versiyani yangilaydi,
    shuning uchun bu faqat bir marta ishlaydi.
  */
  useEffect(() => {
    if (!holat || (holat.v ?? 1) >= TANISHUV_VERSIYASI) return
    if (!holat.bajarilgan?.includes('boshlash')) return
    saqla({ bajarilgan: holat.bajarilgan.filter((d) => d !== 'boshlash') })
  }, [holat, saqla])

  // ---------------------------------------------------------------
  // Mashq papkasini yaratish
  // ---------------------------------------------------------------
  const [yaratilmoqda, setYaratilmoqda] = useState(false)
  // Bir vaqtda faqat bitta yaratish: aks holda ikki papka paydo bo'lardi
  const yaratishQulfi = useRef(false)

  const mashqPapkasiniYarat = useCallback(
    async (maqsad: Maqsad | undefined, yonaltir = true) => {
      if (yaratishQulfi.current) return
      yaratishQulfi.current = true
      // Fonda qayta urinishda ekran to'silmaydi
      if (yonaltir) setYaratilmoqda(true)
      const matnlar = mashqMatnlari(til)
      try {
        /*
          Avval bor mashq papkasini qidiramiz. U boshqa qurilmada
          (yoki qayta boshlashdan oldin) yaratilgan bo'lishi mumkin —
          holat hisobga hali yozilmagan bo'lsa ham. Topilsa, o'shani
          ishlatamiz: aks holda har qurilmada yana bitta "Tanishuv"
          papkasi paydo bo'lardi.
        */
        const { data: borPapkalar } = await supabase
          .from('folders')
          .select('id')
          .eq('icon', MASHQ_PAPKA_BELGISI)
          .in('name', MASHQ_PAPKA_NOMLARI)
          .eq('is_archived', false)
          .order('created_at', { ascending: true })
          .limit(1)

        let papkaId = borPapkalar?.[0]?.id as string | undefined
        if (!papkaId) {
          const { data: papka, error: papkaXato } = await supabase
            .from('folders')
            .insert({
              user_id: foydalanuvchi.id,
              name: matnlar.papka,
              color: '#f59e0b',
              icon: MASHQ_PAPKA_BELGISI,
              sort_order: 0,
            })
            .select('id')
            .single()
          if (papkaXato) throw papkaXato
          papkaId = papka.id
        }

        // Bor papkadagi dars vazifalari (sort_order = dars tartibi)
        const { data: borVazifalar } = await supabase
          .from('tasks')
          .select('id, sort_order')
          .eq('folder_id', papkaId)
          .is('deleted_at', null)
          .is('parent_id', null)

        const xarita: Partial<Record<DarsKaliti, string>> = {}
        for (const v of borVazifalar ?? []) {
          const dars = VAZIFALI_DARSLAR[v.sort_order ?? -1]
          if (dars && !xarita[dars]) xarita[dars] = v.id
        }

        // Yetishmaganlarini (yangi papka — hammasini) yaratamiz
        const qatorlar = VAZIFALI_DARSLAR.flatMap((dars, i) =>
          xarita[dars]
            ? []
            : [
                {
                  user_id: foydalanuvchi.id,
                  folder_id: papkaId!,
                  title: matnlar.vazifalar[dars as keyof typeof matnlar.vazifalar].nom,
                  description: matnlar.vazifalar[dars as keyof typeof matnlar.vazifalar].izoh,
                  priority: 4,
                  progress: 0,
                  status: 'planned',
                  sort_order: i,
                },
              ]
        )
        if (qatorlar.length > 0) {
          const { data: yangilar, error: vazifaXato } = await supabase
            .from('tasks')
            .insert(qatorlar)
            .select('id, sort_order')
          if (vazifaXato) throw vazifaXato
          for (const v of yangilar ?? []) {
            const dars = VAZIFALI_DARSLAR[v.sort_order ?? -1]
            if (dars) xarita[dars] = v.id
          }
        }
        const papka = { id: papkaId }

        saqla({ maqsad, papkaId: papka.id, vazifalar: xarita })
        await Promise.all([
          qc.invalidateQueries({ queryKey: kalit.papkalar }),
          qc.invalidateQueries({ queryKey: kalit.vazifalar }),
        ])
        if (yonaltir) router.push(papkaYoli(papka.id))
      } catch (xato) {
        // Internet yo'q bo'lsa jim: aloqa qaytgach o'zi qayta uriniladi.
        // Boshqa xato — odam bilsin (oldin jimgina yutilardi va darslar
        // paneli sababsiz chiqmay qolardi)
        if (navigator.onLine) {
          const sabab = (xato as { message?: string } | null)?.message
          korsat({
            matn: `${t('tanishuv.papkaXato')}${sabab ? ` (${sabab})` : ''}`,
            tone: 'xato',
          })
        }
      } finally {
        yaratishQulfi.current = false
        setYaratilmoqda(false)
      }
    },
    [foydalanuvchi.id, korsat, qc, router, saqla, supabase, t, til]
  )

  /*
    Kutib olish internetsiz tugatilgan bo'lsa, mashq papkasi yaratilmay
    qolgan (u serverda yaratiladi) — darslar paneli ham chiqmasdi.
    Aloqa paydo bo'lishi bilan papka fonda yaratiladi va panel o'zi
    ochiladi. Bir sessiyada bir marta urinadi.
  */
  const qaytaUrindi = useRef(false)
  useEffect(() => {
    const kerak =
      holat?.kutibOlindi && holat.maqsad && !holat.papkaId && !holat.yopilgan && !holat.eski
    if (!kerak) return
    const urin = () => {
      // Asosiy yaratish hozir ketayotgan bo'lsa — urinishni sarflamaymiz
      if (qaytaUrindi.current || yaratishQulfi.current || !navigator.onLine) return
      qaytaUrindi.current = true
      void mashqPapkasiniYarat(holat.maqsad, false)
    }
    urin()
    window.addEventListener('online', urin)
    return () => window.removeEventListener('online', urin)
  }, [holat, mashqPapkasiniYarat])

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
      const dan = holat?.boshlangan ?? new Date(0).toISOString()
      // Topshiriq jadvallari generatsiya qilingan tiplarda yo'q
      const xom = supabase as unknown as {
        from: (t: string) => {
          select: (u: string) => {
            eq: (u: string, q: string) => {
              gte: (u: string, q: string) => {
                limit: (n: number) => PromiseLike<{ data: unknown[] | null }>
              }
            }
          }
        }
      }
      const borMi = (r: { data: unknown[] | null }) => (r.data ?? []).length > 0
      const loyihaPapkasi = qc
        .getQueryData<Folder[]>(kalit.papkalar)
        ?.find((p) => p.is_projects)?.id

      const [mashq, ozim, boshlangan, loyiha, yuborgan, fikr] = await Promise.all([
        supabase.from('tasks').select('*').in('id', mashqIdlari).is('deleted_at', null),
        supabase
          .from('tasks')
          .select('id')
          .not('id', 'in', `(${mashqIdlari.join(',')})`)
          .gte('created_at', dan)
          .is('deleted_at', null)
          .limit(1),
        // Faqat HOZIR jarayonda turgan vazifa: server bajarilgan
        // vazifaga ham `started_at` yozadi (tg_tasks_touch_timestamps),
        // shuning uchun faqat shu ustunga qarash "bajardim"ni ham
        // "boshladim" deb hisoblardi
        supabase
          .from('tasks')
          .select('id')
          .eq('status', 'in_progress')
          .gte('started_at', dan)
          .is('deleted_at', null)
          .limit(1),
        loyihaPapkasi
          ? supabase
              .from('sections')
              .select('id')
              .eq('folder_id', loyihaPapkasi)
              .gte('created_at', dan)
              .limit(1)
          : Promise.resolve({ data: [] }),
        xom.from('topshiriqlar').select('id').eq('yuboruvchi_id', foydalanuvchi.id).gte('created_at', dan).limit(1),
        xom.from('topshiriq_izohlari').select('id').eq('muallif_id', foydalanuvchi.id).gte('created_at', dan).limit(1),
      ])
      return {
        mashq: (mashq.data ?? []) as Task[],
        ozimQoshdim: borMi(ozim),
        boshladim: borMi(boshlangan),
        loyihaOchdim: borMi(loyiha as { data: unknown[] | null }),
        // Haqiqiy topshiriq yuborgan yoki fikr yozgan — mashq shart emas
        topshiriqYozdim: borMi(yuborgan) || borMi(fikr),
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
      let boshladim = serverdan.data?.boshladim ?? false
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
          if (t.status === 'in_progress' && yangimi(t.started_at)) boshladim = true
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

      // Loyiha = "Loyihalar" papkasidagi bo'lim
      const loyihaPapkasi = papkalar.find((p) => p.is_projects)?.id
      let loyihaOchdim = serverdan.data?.loyihaOchdim ?? false
      if (loyihaPapkasi) {
        for (const [, data] of qc.getQueriesData<unknown>({ queryKey: kalit.bolimlarPrefiks })) {
          if (!Array.isArray(data)) continue
          if ((data as Section[]).some((b) => b?.folder_id === loyihaPapkasi && yangimi(b.created_at))) {
            loyihaOchdim = true
          }
        }
      }

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
      if (boshladim) tayyorlar.push('boshlash')
      if (loyihaOchdim) tayyorlar.push('loyiha')
      if (serverdan.data?.topshiriqYozdim) tayyorlar.push('topshiriq')
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
      if (KUZATILADIGAN.includes(String(k[0])) && hodisa.type === 'updated') {
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

  // Ko'rish darslari — sahifaga kirishning o'zi yetarli
  useEffect(() => {
    if (!faol) return
    const toza = yol.replace(/\/+$/, '')
    const dars = SAHIFA_DARSLARI[toza]
    if (dars) darsniBelgila([dars])
  }, [faol, yol, darsniBelgila])

  // Sozlamalar darsi: mavzu yoki til o'zgartirilsa
  useEffect(() => {
    if (!faol) return
    const belgila = () => darsniBelgila(['sozlama'])
    const a = mavzugaObuna(belgila)
    const b = tilgaObuna(belgila)
    return () => {
      a()
      b()
    }
  }, [faol, darsniBelgila])

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
          darsniBelgila={darsniBelgila}
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
