'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Lightbulb, X } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { MASLAHATLAR, maslahatKaliti, type TanishuvHolati } from '@/lib/tanishuv'

/**
 * Bo'limga BIRINCHI marta kirilganda bitta qisqa maslahat.
 *
 * Nega kerakli paytda: odam "Hisobot nima?" degan savolni aynan
 * Hisobotni ochganda beradi. Oldindan, kutib olish ekranida aytilsa —
 * u paytgacha unutiladi.
 *
 * Bir marta ko'rsatiladi va qaytib chiqmaydi: "Tushunarli" bosilganda
 * ham, odam boshqa sahifaga o'tib ketganda ham ko'rilgan hisoblanadi.
 */
export function MaslahatPufagi({
  holat,
  saqla,
}: {
  holat: TanishuvHolati
  saqla: (o: Partial<TanishuvHolati>) => void
}) {
  const t = useT()
  const yol = usePathname()
  const kalit = maslahatKaliti(yol)
  const korilgan = holat.maslahatlar ?? []
  const [ochiq, setOchiq] = useState<string | null>(null)

  useEffect(() => {
    if (!kalit || korilgan.includes(kalit)) {
      setOchiq(null)
      return
    }
    // Sahifa chizilib bo'lgach chiqsin — odam avval ekranni ko'rsin
    const taymer = setTimeout(() => setOchiq(kalit), 700)
    return () => clearTimeout(taymer)
    // korilgan ataylab bog'liqlikda yo'q: belgilangan zahoti yopilmasin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kalit])

  // Ochilgan zahoti ko'rilgan deb belgilaymiz — qayta chiqmasin
  useEffect(() => {
    if (ochiq && !korilgan.includes(ochiq)) {
      saqla({ maslahatlar: [...korilgan, ochiq] })
    }
  }, [ochiq, korilgan, saqla])

  if (!ochiq || ochiq !== kalit) return null
  const m = MASLAHATLAR[ochiq]

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-[45] flex justify-center px-4 md:top-6 md:left-72"
    >
      <div className="tanishuv-pop flex w-full max-w-md items-start gap-3 rounded-2xl bg-brand-ink p-4 text-white shadow-float">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-amber-950">
          <Lightbulb className="size-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{t(m.sarlavha)}</span>
          <span className="mt-0.5 block text-sm leading-relaxed text-white/80">{t(m.matn)}</span>
          <button
            type="button"
            onClick={() => setOchiq(null)}
            className="mt-2 cursor-pointer rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold transition hover:bg-white/25"
          >
            {t('tanishuv.tushunarli')}
          </button>
        </span>
        <button
          type="button"
          onClick={() => setOchiq(null)}
          aria-label={t('tanishuv.tushunarli')}
          className="-mt-1 -mr-1 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
