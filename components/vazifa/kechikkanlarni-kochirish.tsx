'use client'

import { useState } from 'react'
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isBefore,
  isSameMonth,
  isToday,
  nextMonday,
  nextSaturday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import {
  ArrowRight,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Sun,
  Sunrise,
} from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useVazifaYangilash } from '@/lib/queries/vazifalar'
import { OYLAR, isoGa, toliqSana } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'

const HAFTA_KUNLARI: MatnKaliti[] = [
  'kun.1.qisqa', 'kun.2.qisqa', 'kun.3.qisqa', 'kun.4.qisqa',
  'kun.5.qisqa', 'kun.6.qisqa', 'kun.7.qisqa',
]

/**
 * Todoist'dagi "Reschedule" — barcha kechikkan vazifalarni bitta
 * sanaga ko'chiradi. Sana tanlanishi bilan darhol ko'chiriladi
 * (alohida "Saqlash" bosish shart emas).
 *
 * Faqat `due_date` o'zgaradi: vaqt saqlanadi, takrorlanuvchi
 * vazifaning qoidasi (`rrule`, `rrule_start`) ham tegilmaydi —
 * shunchaki joriy navbat yangi kunga suriladi.
 */
export function KechikkanlarniKochirish({ idlar }: { idlar: string[] }) {
  const t = useT()
  const [ochiq, setOchiq] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOchiq(true)}
        className="ml-auto min-h-0 cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-[#dc2626] transition hover:bg-red-50 dark:hover:bg-red-950/40"
      >
        {t('bugun.kochirish')}
      </button>
      {ochiq && (
        <KochirishOynasi idlar={idlar} yop={() => setOchiq(false)} />
      )}
    </>
  )
}

function KochirishOynasi({ idlar, yop }: { idlar: string[]; yop: () => void }) {
  const t = useT()
  const { korsat: toast } = useToast()
  const yangilash = useVazifaYangilash()
  const [korinishOy, setKorinishOy] = useState(() => new Date())

  const bugun = new Date()
  const bugunBoshi = startOfDay(bugun)

  const kunlar = eachDayOfInterval({
    start: startOfWeek(startOfMonth(korinishOy), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(korinishOy), { weekStartsOn: 1 }),
  })

  const ertaga = new Date(bugun)
  ertaga.setDate(ertaga.getDate() + 1)

  const TEZ_QATORLAR = [
    { nom: t('sana.bugun'), ikonka: Sun, rang: '#f59e0b', sana: bugun },
    { nom: t('sana.ertaga'), ikonka: Sunrise, rang: '#f97316', sana: ertaga },
    { nom: t('sana.damOlish'), ikonka: Coffee, rang: '#2563eb', sana: nextSaturday(bugun) },
    { nom: t('sana.keyingiHafta'), ikonka: ArrowRight, rang: '#8b5cf6', sana: nextMonday(bugun) },
  ]

  /**
   * Natija kutilmaydi — o'zgarishlar keshda darhol ko'rinadi va
   * navbatga tushadi (internetsiz ham ishlaydi).
   */
  function kochir(iso: string) {
    const mijozVaqti = new Date().toISOString()
    for (const id of idlar) {
      yangilash.mutate({ id, due_date: iso, mijozVaqti })
    }
    toast({
      matn: t('bugun.kochirildi', { son: idlar.length, sana: toliqSana(iso) }),
      tone: 'muvaffaqiyat',
    })
    yop()
  }

  return (
    <Oyna
      sarlavha={t('bugun.kochirishSarlavha')}
      tavsif={t('bugun.kochirishTavsif', { son: idlar.length })}
      yop={yop}
    >
      <div className="-mx-2">
        <div className="border-b border-border-subtle pb-2">
          {TEZ_QATORLAR.map((q) => {
            const iso = isoGa(q.sana)
            return (
              <button
                key={q.nom}
                type="button"
                onClick={() => kochir(iso)}
                className="flex min-h-0 w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition hover:bg-surface-muted"
              >
                <q.ikonka className="size-4 shrink-0" style={{ color: q.rang }} aria-hidden />
                <span className="flex-1 truncate font-medium text-text-strong">{q.nom}</span>
                <span className="shrink-0 text-xs text-text-faint">{toliqSana(iso)}</span>
              </button>
            )
          })}
        </div>

        {/* Oy navigatsiyasi */}
        <div className="mt-3 mb-1 flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setKorinishOy((d) => subMonths(d, 1))}
            aria-label={t('sana.oldingiOy')}
            className="flex size-8 min-h-0 cursor-pointer items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-text-strong capitalize">
            <CalendarClock className="size-4 text-text-faint" aria-hidden />
            {OYLAR[korinishOy.getMonth()]} {korinishOy.getFullYear()}
          </span>
          <button
            type="button"
            onClick={() => setKorinishOy((d) => addMonths(d, 1))}
            aria-label={t('sana.keyingiOy')}
            className="flex size-8 min-h-0 cursor-pointer items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 px-1">
          {HAFTA_KUNLARI.map((kalit) => (
            <span key={kalit} className="py-1 text-center text-xs font-medium text-text-faint">
              {t(kalit)}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 px-1">
          {kunlar.map((kun) => {
            const shuOyda = isSameMonth(kun, korinishOy)
            const bugunmi = isToday(kun)
            // O'tgan kunga ko'chirish ma'nosiz — vazifa yana kechikkan bo'lib qoladi
            const otgan = isBefore(kun, bugunBoshi)
            return (
              <button
                key={kun.toISOString()}
                type="button"
                disabled={otgan}
                onClick={() => kochir(isoGa(kun))}
                className={`mx-auto flex size-10 min-h-0 items-center justify-center rounded-full text-sm transition ${
                  otgan
                    ? 'cursor-not-allowed text-text-faint opacity-40'
                    : bugunmi
                      ? 'cursor-pointer border border-brand-onsoft font-semibold text-brand-onsoft hover:bg-brand-soft'
                      : shuOyda
                        ? 'cursor-pointer text-text-strong hover:bg-surface-muted'
                        : 'cursor-pointer text-text-faint hover:bg-surface-muted'
                }`}
              >
                {kun.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    </Oyna>
  )
}
