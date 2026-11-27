'use client'

import { useState } from 'react'
import { CalendarDays, Clock, Repeat, X } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { OraliqKalendar } from '@/components/ui/oraliq-kalendar'
import { useT } from '@/components/app/til-provayder'
import { toliqSana } from '@/lib/sana'
import type { TopshiriqTakrori } from '@/types/vazifalar'

export type Muddat = {
  boshi: string | null
  oxiri: string | null
  boshVaqt: string
  oxirVaqt: string
  takror: TopshiriqTakrori | ''
}

const TAYYOR = ['', 'kunlik', 'haftalik', 'oylik'] as const
type Birlik = 'kun' | 'hafta' | 'oy'

const vaqtMaydoni =
  'min-h-10 rounded-xl border border-border-control bg-surface px-3 text-sm text-text-strong outline-none focus:border-brand-onsoft'

/**
 * Muddat va takror — bitta blok.
 *
 * Sana tugmasi oynada oraliq kalendarini ochadi; tugash kuni bosilishi
 * bilan oyna o'zi yopiladi. Sana tanlangach — boshlanish va tugash
 * soati (kechikish tugash soatiga qarab hisoblanadi). Pastda — takror:
 * tayyor variantlar yoki "Boshqa" (har N kun/hafta/oy).
 */
export function MuddatTanlagich({
  qiymat,
  ozgartir,
}: {
  qiymat: Muddat
  ozgartir: (m: Muddat) => void
}) {
  const t = useT()
  const [kalendar, setKalendar] = useState(false)
  const boshqami = qiymat.takror.startsWith('har:')
  const [boshqaOchiq, setBoshqaOchiq] = useState(boshqami)
  const [, sonMatn, birlikMatn] = boshqami ? qiymat.takror.split(':') : ['', '2', 'kun']
  const [son, setSon] = useState(Number(sonMatn) || 2)
  const [birlik, setBirlik] = useState<Birlik>((birlikMatn as Birlik) || 'kun')

  const yangila = (q: Partial<Muddat>) => ozgartir({ ...qiymat, ...q })
  const birKun = qiymat.boshi && qiymat.boshi === qiymat.oxiri
  const sanaMatni = qiymat.oxiri
    ? birKun || !qiymat.boshi
      ? toliqSana(qiymat.oxiri)
      : `${toliqSana(qiymat.boshi)} — ${toliqSana(qiymat.oxiri)}`
    : null

  function boshqaQoy(n: number, b: Birlik) {
    const toza = Math.min(365, Math.max(1, Math.round(n) || 1))
    setSon(toza)
    setBirlik(b)
    yangila({ takror: `har:${toza}:${b}` as TopshiriqTakrori })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setKalendar(true)}
          className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 text-sm font-medium transition ${
            sanaMatni
              ? 'border-brand-accent bg-brand-soft text-brand-onsoft'
              : 'border-border-control text-text-muted hover:bg-surface-muted'
          }`}
        >
          <CalendarDays className="size-4" aria-hidden />
          {sanaMatni ?? t('tk.sanaTanlang')}
        </button>
        {qiymat.oxiri && (
          <button
            type="button"
            onClick={() => yangila({ boshi: null, oxiri: null, boshVaqt: '', oxirVaqt: '', takror: '' })}
            aria-label={t('tk.sanaTozalash')}
            title={t('tk.sanaTozalash')}
            className="flex size-9 min-h-0 items-center justify-center rounded-full text-text-faint transition hover:bg-danger-soft hover:text-danger"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {qiymat.oxiri && (
        <div className="grid grid-cols-2 gap-2 sm:max-w-sm">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs text-text-muted">
              <Clock className="size-3.5" aria-hidden />
              {t('tk.boshlanishSoati')}
            </span>
            <input
              type="time"
              value={qiymat.boshVaqt}
              onChange={(e) => yangila({ boshVaqt: e.target.value })}
              className={`w-full ${vaqtMaydoni}`}
            />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-xs text-text-muted">
              <Clock className="size-3.5" aria-hidden />
              {t('tk.tugashSoati')}
            </span>
            <input
              type="time"
              value={qiymat.oxirVaqt}
              onChange={(e) => yangila({ oxirVaqt: e.target.value })}
              className={`w-full ${vaqtMaydoni}`}
            />
          </label>
        </div>
      )}

      {/* Takror — sananing ostida */}
      <div>
        <span className="mb-1.5 flex items-center gap-1 text-xs text-text-muted">
          <Repeat className="size-3.5" aria-hidden />
          {t('tj.takrorlanadi')}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {TAYYOR.map((k) => {
            const faol = !boshqaOchiq && qiymat.takror === k
            return (
              <button
                key={k || 'yoq'}
                type="button"
                aria-pressed={faol}
                onClick={() => {
                  setBoshqaOchiq(false)
                  yangila({ takror: k })
                }}
                className={`min-h-0 rounded-full border px-3 py-1.5 text-sm transition ${
                  faol
                    ? 'border-brand-onsoft bg-brand-soft font-semibold text-brand-onsoft'
                    : 'border-border-subtle text-text-muted hover:bg-surface-muted'
                }`}
              >
                {t(k === '' ? 'tj.takror.yoq' : k === 'kunlik' ? 'tj.takror.kunlik' : k === 'haftalik' ? 'tj.takror.haftalik' : 'tj.takror.oylik')}
              </button>
            )
          })}
          <button
            type="button"
            aria-pressed={boshqaOchiq}
            onClick={() => {
              setBoshqaOchiq(true)
              boshqaQoy(son, birlik)
            }}
            className={`min-h-0 rounded-full border px-3 py-1.5 text-sm transition ${
              boshqaOchiq
                ? 'border-brand-onsoft bg-brand-soft font-semibold text-brand-onsoft'
                : 'border-border-subtle text-text-muted hover:bg-surface-muted'
            }`}
          >
            {t('tk.boshqa')}
          </button>
        </div>
        {boshqaOchiq && (
          <div className="mt-2 flex items-center gap-2 text-sm text-text-strong">
            {t('tk.har')}
            <input
              type="number"
              min={1}
              max={365}
              value={son}
              onChange={(e) => boshqaQoy(Number(e.target.value), birlik)}
              aria-label={t('tk.har')}
              className={`w-20 ${vaqtMaydoni}`}
            />
            <select
              value={birlik}
              onChange={(e) => boshqaQoy(son, e.target.value as Birlik)}
              className={vaqtMaydoni}
            >
              <option value="kun">{t('tk.birlik.kun')}</option>
              <option value="hafta">{t('tk.birlik.hafta')}</option>
              <option value="oy">{t('tk.birlik.oy')}</option>
            </select>
          </div>
        )}
      </div>

      {kalendar && (
        <Oyna sarlavha={t('tk.muddat')} yop={() => setKalendar(false)}>
          <OraliqKalendar
            boshi={qiymat.boshi}
            oxiri={qiymat.oxiri}
            ozgartir={(b, o) => yangila({ boshi: b, oxiri: o })}
            tugadi={() => setKalendar(false)}
          />
        </Oyna>
      )}
    </div>
  )
}
