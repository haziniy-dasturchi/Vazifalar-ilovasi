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
 * Sana oralig'ini bitta kalendarda tanlash (LC UP'dagi kabi).
 *
 * 1-bosish — boshlanish. Shundan keyin sichqoncha qaysi kun ustiga
 * borsa, oraliq o'sha kungacha rangli ko'rinib turadi (oldindan
 * ko'rish). 2-bosish — tugash: tanlov tugaydi va `tugadi` chaqiriladi
 * (oyna o'zi yopiladi). Bitta kun kerak bo'lsa — o'sha kunni ikki
 * marta bosiladi. Boshlanishdan oldingi kun bosilsa — tanlov o'sha
 * kundan qaytadan boshlanadi.
 */
export function OraliqKalendar({
  boshi,
  oxiri,
  ozgartir,
  tugadi,
}: {
  boshi: string | null
  oxiri: string | null
  ozgartir: (boshi: string | null, oxiri: string | null) => void
  tugadi?: () => void
}) {
  const t = useT()
  const bugun = bugunISO()
  const [korinadigan, setKorinadigan] = useState(() => {
    const d = isoDan(boshi ?? bugun)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  // Tanlov jarayoni: birinchi kun bosilgan, ikkinchisi kutilmoqda
  const [birinchi, setBirinchi] = useState<string | null>(null)
  const [ustida, setUstida] = useState<string | null>(null)

  const kunlar = useMemo(() => {
    const yil = korinadigan.getFullYear()
    const oy = korinadigan.getMonth()
    const bosh = (new Date(yil, oy, 1).getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(yil, oy, 1 - bosh + i)
      return { iso: isoGa(d), kun: d.getDate(), buOy: d.getMonth() === oy }
    })
  }, [korinadigan])

  // Ko'rsatiladigan oraliq: tanlov paytida — oldindan ko'rish
  const [a, b] = birinchi
    ? [birinchi, ustida && ustida > birinchi ? ustida : birinchi]
    : [boshi, oxiri]

  function bos(iso: string) {
    if (!birinchi || iso < birinchi) {
      setBirinchi(iso)
      setUstida(iso)
      return
    }
    setBirinchi(null)
    setUstida(null)
    ozgartir(birinchi, iso)
    tugadi?.()
  }

  function oyniSur(qadam: number) {
    setKorinadigan((d) => new Date(d.getFullYear(), d.getMonth() + qadam, 1))
  }

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => oyniSur(-1)}
          aria-label={t('tk.oldingiOy')}
          className="flex size-9 min-h-0 items-center justify-center rounded-full text-text-muted transition hover:bg-surface-muted"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <span className="text-[0.9375rem] font-semibold text-text-strong">
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

      <div className="grid grid-cols-7 gap-y-1" onMouseLeave={() => birinchi && setUstida(birinchi)}>
        {kunlar.map(({ iso, kun, buOy }) => {
          const chet = iso === a || iso === b
          const ichida = a && b && iso > a && iso < b
          const oraliq = a && b && a !== b
          const otgan = iso < bugun
          return (
            <div
              key={iso}
              className={`relative flex h-10 items-center justify-center ${ichida ? 'bg-brand-soft' : ''} ${
                oraliq && iso === a ? 'rounded-l-full bg-brand-soft' : ''
              } ${oraliq && iso === b ? 'rounded-r-full bg-brand-soft' : ''}`}
            >
              <button
                type="button"
                disabled={otgan}
                onClick={() => bos(iso)}
                onMouseEnter={() => birinchi && setUstida(iso)}
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

      <p className="mt-3 text-center text-sm text-text-muted">
        {birinchi ? t('tk.tugashKuniniBosing') : t('tk.boshlanishKuniniBosing')}
      </p>
    </div>
  )
}
