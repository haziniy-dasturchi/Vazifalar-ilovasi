'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { bugunISO, isoDan, isoGa } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'

const OY_KALITLARI: MatnKaliti[] = [
  'tk.oy.1', 'tk.oy.2', 'tk.oy.3', 'tk.oy.4', 'tk.oy.5', 'tk.oy.6',
  'tk.oy.7', 'tk.oy.8', 'tk.oy.9', 'tk.oy.10', 'tk.oy.11', 'tk.oy.12',
]
const KUN_KALITLARI: MatnKaliti[] = [
  'tk.kun.du', 'tk.kun.se', 'tk.kun.ch', 'tk.kun.pa', 'tk.kun.ju', 'tk.kun.sh', 'tk.kun.ya',
]

/**
 * Sana oralig'ini bitta kalendarda tanlash (LC UP'dagi kabi):
 * birinchi bosish — boshlanish, ikkinchisi — tugash. Oraliq
 * ajratib ko'rsatiladi, bugun halqa bilan belgilanadi.
 *
 * Bitta kun ham bo'lishi mumkin (boshlanish = tugash). Ikkinchi
 * bosish birinchidan oldingi kunga tushsa — tanlov o'sha kundan
 * qaytadan boshlanadi (odam adashganini tuzatishga majbur emas).
 */
export function OraliqKalendar({
  boshi,
  oxiri,
  ozgartir,
}: {
  boshi: string | null
  oxiri: string | null
  ozgartir: (boshi: string | null, oxiri: string | null) => void
}) {
  const t = useT()
  const bugun = bugunISO()
  const [korinadigan, setKorinadigan] = useState(() => {
    const d = isoDan(boshi ?? bugun)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const kunlar = useMemo(() => {
    const yil = korinadigan.getFullYear()
    const oy = korinadigan.getMonth()
    // Dushanbadan boshlanadigan hafta
    const birinchi = (new Date(yil, oy, 1).getDay() + 6) % 7
    const boshlanish = new Date(yil, oy, 1 - birinchi)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(boshlanish.getFullYear(), boshlanish.getMonth(), boshlanish.getDate() + i)
      return { iso: isoGa(d), kun: d.getDate(), buOy: d.getMonth() === oy }
    })
  }, [korinadigan])

  function bos(iso: string) {
    // Yangi tanlov: hech narsa yo'q, yoki oraliq allaqachon to'liq
    if (!boshi || (boshi && oxiri && boshi !== oxiri)) {
      ozgartir(iso, iso)
      return
    }
    if (iso < boshi) {
      ozgartir(iso, iso)
      return
    }
    ozgartir(boshi, iso)
  }

  function oyniSur(qadam: number) {
    setKorinadigan((d) => new Date(d.getFullYear(), d.getMonth() + qadam, 1))
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-border-subtle bg-surface p-3 select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => oyniSur(-1)}
          aria-label={t('tk.oldingiOy')}
          className="flex size-9 min-h-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <span className="text-base font-semibold text-text-strong">
          {t(OY_KALITLARI[korinadigan.getMonth()])} {korinadigan.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => oyniSur(1)}
          aria-label={t('tk.keyingiOy')}
          className="flex size-9 min-h-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted"
        >
          <ChevronRight className="size-5" aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-semibold text-text-faint">
        {KUN_KALITLARI.map((k) => (
          <span key={k} className="py-1">
            {t(k)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {kunlar.map(({ iso, kun, buOy }) => {
          const chet = iso === boshi || iso === oxiri
          const ichida = boshi && oxiri && iso > boshi && iso < oxiri
          const otgan = iso < bugun
          return (
            <div
              key={iso}
              className={`relative flex h-10 items-center justify-center ${
                ichida ? 'bg-brand-soft' : ''
              } ${iso === boshi && oxiri && oxiri !== boshi ? 'rounded-l-full bg-brand-soft' : ''} ${
                iso === oxiri && boshi && oxiri !== boshi ? 'rounded-r-full bg-brand-soft' : ''
              }`}
            >
              <button
                type="button"
                disabled={otgan}
                onClick={() => bos(iso)}
                aria-pressed={Boolean(chet)}
                aria-label={iso}
                className={`relative z-10 flex size-10 min-h-0 items-center justify-center rounded-full text-sm transition ${
                  chet
                    ? 'bg-brand-primary font-bold text-white'
                    : otgan
                      ? 'text-text-faint opacity-40'
                      : buOy
                        ? 'text-text-strong hover:bg-surface-muted'
                        : 'text-text-faint hover:bg-surface-muted'
                } ${iso === bugun && !chet ? 'ring-2 ring-brand-accent' : ''}`}
              >
                {kun}
              </button>
            </div>
          )
        })}
      </div>

      {(boshi || oxiri) && (
        <button
          type="button"
          onClick={() => ozgartir(null, null)}
          className="mt-2 min-h-0 rounded-lg px-2 py-1 text-sm font-medium text-danger transition hover:bg-danger-soft"
        >
          {t('tk.sanaTozalash')}
        </button>
      )}
    </div>
  )
}
