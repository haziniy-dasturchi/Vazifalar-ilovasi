'use client'

import { useEffect, useState } from 'react'
import { CircleCheck, Gift, Loader2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useSupabase } from '@/lib/supabase/use-supabase'
import {
  ENG_KAM_SUMMA,
  ENG_KOP_SUMMA,
  TAYYOR_SUMMALAR,
  clickHavolasi,
  paymeHavolasi,
  summaTogrimi,
  tolovSozlamasi,
  type TolovTizimi,
} from '@/lib/xayriya'

/**
 * `xayriyalar` jadvali va `xayriya_yarat` generatsiya qilingan
 * tiplarda hali yo'q — loyihadagi boshqa yangi jadvallar kabi aniq
 * imzoli "xom" kirish (`lib/queries/topshiriq-jamoa.ts` ga qarang).
 */
type XomNatija<T> = PromiseLike<{ data: T | null; error: { message: string } | null }>
function xom(supabase: ReturnType<typeof useSupabase>) {
  return supabase as unknown as {
    rpc: (n: 'xayriya_yarat', a: { p_summa_som: number; p_tizim: TolovTizimi }) => XomNatija<string>
    from: (t: 'xayriyalar') => {
      select: (q: 'holat') => {
        order: (u: 'created_at', s: { ascending: boolean }) => {
          limit: (n: number) => { maybeSingle: () => XomNatija<{ holat: string }> }
        }
      }
    }
  }
}

const sonFormat = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/** Payme/Click'dan qaytgach shu belgi bilan keladi */
const QAYTISH_BELGISI = 'rahmat'

/**
 * Bir teginishda xayriya: summa -> Payme yoki Click -> to'lov.
 *
 * Tugma bosilganda bazada "kutilmoqda" holatidagi xayriya ochiladi va
 * odam to'lov sahifasiga o'tadi. Telefonda Payme/Click ilovasi bo'lsa,
 * u o'zi ochiladi. To'lovdan keyin shu sahifaga `?rahmat=1` bilan
 * qaytadi — u yerda xayriya holati tekshiriladi.
 */
export function XayriyaBolimi() {
  const supabase = useSupabase()
  const { korsat } = useToast()
  const sozlama = tolovSozlamasi()

  const [summa, setSumma] = useState<number>(TAYYOR_SUMMALAR[1])
  const [boshqa, setBoshqa] = useState('')
  const [yuborilmoqda, setYuborilmoqda] = useState<TolovTizimi | null>(null)
  const [natija, setNatija] = useState<'tekshirilmoqda' | 'tolandi' | 'kutilmoqda' | null>(null)

  const tanlangan = boshqa ? Number(boshqa.replace(/\D/g, '')) : summa
  const togri = summaTogrimi(tanlangan)

  // To'lovdan qaytdikmi? Payme/Click tasdig'i serverga biroz kechikib
  // kelishi mumkin — bir necha marta qayta so'raymiz
  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    if (!q.has(QAYTISH_BELGISI)) return
    window.history.replaceState(null, '', window.location.pathname)
    setNatija('tekshirilmoqda')

    let toxtat = false
    void (async () => {
      for (let urinish = 0; urinish < 6 && !toxtat; urinish++) {
        const { data } = await xom(supabase)
          .from('xayriyalar')
          .select('holat')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (data?.holat === 'tolandi') {
          if (!toxtat) setNatija('tolandi')
          return
        }
        await new Promise((r) => setTimeout(r, 2000))
      }
      if (!toxtat) setNatija('kutilmoqda')
    })()
    return () => {
      toxtat = true
    }
  }, [supabase])

  async function tola(tizim: TolovTizimi) {
    if (!togri || yuborilmoqda) return
    setYuborilmoqda(tizim)
    try {
      const { data: id, error } = await xom(supabase).rpc('xayriya_yarat', {
        p_summa_som: tanlangan,
        p_tizim: tizim,
      })
      if (error || typeof id !== 'string') throw error ?? new Error('ID qaytmadi')

      const qaytish = `${window.location.origin}${window.location.pathname}?${QAYTISH_BELGISI}=1`
      const manzil =
        tizim === 'payme'
          ? paymeHavolasi(sozlama.payme!, id, tanlangan, qaytish)
          : clickHavolasi(sozlama.click!, id, tanlangan, qaytish)
      window.location.href = manzil
    } catch {
      korsat({ matn: 'To‘lovni boshlab bo‘lmadi. Internetni tekshirib, qayta urining.', tone: 'xato' })
      setYuborilmoqda(null)
    }
  }

  if (!sozlama.payme && !sozlama.click) return null

  return (
    <section className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
      <h2 className="flex items-center gap-2 font-semibold text-text-strong">
        <Gift className="size-4 text-brand-onsoft" aria-hidden />
        Qo‘llab-quvvatlash
      </h2>

      {natija === 'tolandi' ? (
        <div className="mt-3 flex items-start gap-3 rounded-xl bg-brand-soft p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-brand-onsoft" aria-hidden />
          <p className="text-sm text-text-strong">
            <span className="font-semibold">Katta rahmat!</span> To‘lovingiz
            qabul qilindi. Siz loyihaning davom etishiga hissa qo‘shdingiz.
          </p>
        </div>
      ) : natija === 'tekshirilmoqda' ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          To‘lov tekshirilmoqda…
        </p>
      ) : natija === 'kutilmoqda' ? (
        <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm text-text-muted">
          To‘lov hali tasdiqlanmadi. Agar pul yechilgan bo‘lsa, bir necha
          daqiqada tasdiqlanadi.
        </p>
      ) : null}

      <p className="mt-3 text-sm text-text-muted">
        Summani tanlang — to‘lov bir teginishda.
      </p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TAYYOR_SUMMALAR.map((s) => {
          const faol = !boshqa && summa === s
          return (
            <button
              key={s}
              type="button"
              onClick={() => {
                setSumma(s)
                setBoshqa('')
              }}
              aria-pressed={faol}
              className={`min-h-touch rounded-xl border px-3 text-sm font-semibold tabular-nums transition ${
                faol
                  ? 'border-brand-primary bg-brand-soft text-brand-onsoft'
                  : 'border-border-subtle text-text-strong hover:bg-surface-muted'
              }`}
            >
              {sonFormat(s)}
            </button>
          )
        })}
      </div>

      <label className="mt-2 flex min-h-touch items-center gap-2 rounded-xl border border-border-subtle px-3 focus-within:border-brand-primary">
        <span className="shrink-0 text-sm text-text-muted">Boshqa summa</span>
        <input
          inputMode="numeric"
          value={boshqa ? sonFormat(Number(boshqa)) : ''}
          onChange={(e) => setBoshqa(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="masalan, 15 000"
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-semibold text-text-strong tabular-nums outline-none placeholder:font-normal placeholder:text-text-faint"
        />
        <span className="shrink-0 text-sm text-text-muted">so‘m</span>
      </label>
      {boshqa && !togri && (
        <p className="mt-1 text-xs text-danger">
          {sonFormat(ENG_KAM_SUMMA)} dan {sonFormat(ENG_KOP_SUMMA)} so‘mgacha
        </p>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {sozlama.payme && (
          <button
            type="button"
            onClick={() => tola('payme')}
            disabled={!togri || yuborilmoqda !== null}
            className="flex min-h-touch items-center justify-center gap-2 rounded-xl bg-[#00b2b2] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {yuborilmoqda === 'payme' && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Payme orqali to‘lash
          </button>
        )}
        {sozlama.click && (
          <button
            type="button"
            onClick={() => tola('click')}
            disabled={!togri || yuborilmoqda !== null}
            className="flex min-h-touch items-center justify-center gap-2 rounded-xl bg-[#0073ff] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {yuborilmoqda === 'click' && <Loader2 className="size-4 animate-spin" aria-hidden />}
            Click orqali to‘lash
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-text-faint">
        Ixtiyoriy. To‘lov qilmaganlar uchun ham ilovada hech narsa
        cheklanmaydi.
      </p>
    </section>
  )
}
