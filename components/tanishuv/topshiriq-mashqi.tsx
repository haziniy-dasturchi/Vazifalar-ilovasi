'use client'

import { useEffect, useRef, useState } from 'react'
import { CalendarClock, CircleCheck, Lightbulb, Send, Sparkles } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'
import { Oyna } from '@/components/ui/oyna'
import type { MatnKaliti } from '@/lib/i18n'
import { Konfetti } from './konfetti'

/**
 * Topshiriqlar va "Fikrlar" uchun mashq maydoni.
 *
 * Nega haqiqiy topshiriq emas: baza o'zingizga topshiriq yuborishni
 * taqiqlaydi, yangi foydalanuvchida esa hali hamkasb yo'q. Bu yerda
 * butun yo'l — kelgan topshiriqni qabul qilish, fikr yozish, reaksiya,
 * natijani topshirish va tasdiq — o'yin sifatida ko'rsatiladi.
 * HECH NARSA bazaga yozilmaydi va hech kimga yuborilmaydi.
 */

type Qadam = 'kelgan' | 'suhbat' | 'topshirish' | 'tekshiruvda' | 'tasdiqlandi'

type Xabar = { kim: 'bot' | 'men'; matn: string; reaksiya?: string }

const REAKSIYALAR = ['👍', '❤️', '🔥', '😂']

export function TopshiriqMashqi({ yop, tugadi }: { yop: () => void; tugadi: () => void }) {
  const t = useT()
  const [qadam, setQadam] = useState<Qadam>('kelgan')
  const [radMaslahat, setRadMaslahat] = useState(false)
  const [xabarlar, setXabarlar] = useState<Xabar[]>([])
  const [matn, setMatn] = useState('')
  const [natija, setNatija] = useState('')
  const [yozmoqda, setYozmoqda] = useState(false)
  const taymerlar = useRef<ReturnType<typeof setTimeout>[]>([])
  const pastki = useRef<HTMLDivElement>(null)

  // Bot javobi biroz kutib keladi — haqiqiy suhbatdek
  const keyin = (ms: number, fn: () => void) => {
    taymerlar.current.push(setTimeout(fn, ms))
  }
  useEffect(() => () => taymerlar.current.forEach(clearTimeout), [])
  useEffect(() => {
    pastki.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [xabarlar, yozmoqda])

  const botYozadi = (matnKaliti: MatnKaliti, ms = 900, keyingisi?: () => void) => {
    setYozmoqda(true)
    keyin(ms, () => {
      setYozmoqda(false)
      setXabarlar((x) => [...x, { kim: 'bot', matn: t(matnKaliti) }])
      keyingisi?.()
    })
  }

  const qabulQil = () => {
    setQadam('suhbat')
    botYozadi('tmashq.bot1', 700)
  }

  const yubor = () => {
    const toza = matn.trim()
    if (!toza) return
    setMatn('')
    setXabarlar((x) => [...x, { kim: 'men', matn: toza }])
    // Bot odamning xabariga reaksiya bosadi va javob yozadi
    keyin(600, () =>
      setXabarlar((x) => x.map((m, i) => (i === x.length - 1 && m.kim === 'men' ? { ...m, reaksiya: '👍' } : m)))
    )
    botYozadi('tmashq.bot2', 1300)
  }

  const reaksiyaBos = (i: number, r: string) =>
    setXabarlar((x) => x.map((m, j) => (j === i ? { ...m, reaksiya: m.reaksiya === r ? undefined : r } : m)))

  const topshir = () => {
    setQadam('tekshiruvda')
    keyin(1600, () => {
      setQadam('tasdiqlandi')
      tugadi()
    })
  }

  const menYozdimmi = xabarlar.some((m) => m.kim === 'men')

  return (
    <Oyna sarlavha={t('tmashq.sarlavha')} tavsif={t('tmashq.tavsif')} yop={yop}>
      {/* Topshiriq kartasi — haqiqiy kartaga o'xshash */}
      <div className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-card">
        <div className="flex items-center gap-2 text-xs text-text-faint">
          <span className="flex size-6 items-center justify-center rounded-full bg-amber-400 text-amber-950">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <span className="font-semibold text-text-muted">{t('tmashq.kimdan')}</span>
          <span className="ml-auto rounded-full bg-surface-muted px-2 py-0.5 font-semibold">
            {t(`tmashq.holat.${qadam}` as MatnKaliti)}
          </span>
        </div>
        <p className="mt-2 font-semibold text-text-strong">{t('tmashq.nom')}</p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
          <CalendarClock className="size-4" aria-hidden />
          {t('tmashq.muddat')}
        </p>

        {qadam === 'kelgan' && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={qabulQil}
              className="tanishuv-puls flex-1 cursor-pointer rounded-xl bg-brand-primary py-2.5 text-sm font-semibold text-white transition hover:bg-brand-primary-hover active:scale-95"
            >
              {t('tmashq.qabul')}
            </button>
            <button
              type="button"
              onClick={() => setRadMaslahat(true)}
              className="cursor-pointer rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-text-muted transition hover:bg-surface-sunken"
            >
              {t('tmashq.rad')}
            </button>
          </div>
        )}
      </div>

      <Maslahat matn={t(`tmashq.tip.${qadam}` as MatnKaliti)} />
      {qadam === 'kelgan' && radMaslahat && (
        <p className="mt-2 text-center text-sm text-text-muted">{t('tmashq.radIzoh')}</p>
      )}

      {/* "Fikrlar" — topshiriq ichidagi suhbat */}
      {qadam !== 'kelgan' && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-bold tracking-wide text-text-faint uppercase">
            {t('tmashq.fikrlar')}
          </p>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-surface-muted p-3">
            {xabarlar.map((m, i) => (
              <div key={i} className={`flex ${m.kim === 'men' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[85%]">
                  <div
                    className={`tanishuv-pop rounded-2xl px-3 py-2 text-sm ${
                      m.kim === 'men'
                        ? 'rounded-br-md bg-brand-primary text-white'
                        : 'rounded-bl-md bg-surface text-text-strong shadow-card'
                    }`}
                  >
                    {m.matn}
                  </div>
                  {m.reaksiya && (
                    <span className="tanishuv-pop -mt-1 inline-block rounded-full bg-surface px-1.5 text-sm shadow-card">
                      {m.reaksiya}
                    </span>
                  )}
                  {m.kim === 'bot' && qadam === 'suhbat' && (
                    <div className="mt-1 flex gap-1" aria-label={t('tmashq.reaksiyaTip')}>
                      {REAKSIYALAR.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => reaksiyaBos(i, r)}
                          aria-pressed={m.reaksiya === r}
                          className={`cursor-pointer rounded-full px-1.5 py-0.5 text-sm transition hover:bg-surface active:scale-90 ${
                            m.reaksiya === r ? 'bg-surface ring-1 ring-brand-primary' : ''
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {yozmoqda && (
              <div className="flex gap-1 px-2 py-1" aria-label={t('tmashq.yozmoqda')}>
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="size-2 animate-bounce rounded-full bg-text-faint"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={pastki} />
          </div>

          {qadam === 'suhbat' && (
            <form
              className="mt-2 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                yubor()
              }}
            >
              <input
                value={matn}
                onChange={(e) => setMatn(e.target.value)}
                placeholder={t('tmashq.joy')}
                className="min-w-0 flex-1 rounded-xl border border-border-control bg-surface px-3 py-2.5 text-sm text-text-strong outline-none focus:border-brand-primary"
              />
              <button
                type="submit"
                disabled={!matn.trim()}
                aria-label={t('tmashq.yuborish')}
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-brand-primary text-white transition active:scale-95 disabled:opacity-40"
              >
                <Send className="size-5" aria-hidden />
              </button>
            </form>
          )}

          {qadam === 'suhbat' && menYozdimmi && !yozmoqda && (
            <button
              type="button"
              onClick={() => setQadam('topshirish')}
              className="tanishuv-pop mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 font-semibold text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
            >
              <CircleCheck className="size-5" aria-hidden />
              {t('tmashq.bajardim')}
            </button>
          )}
        </div>
      )}

      {qadam === 'topshirish' && (
        <div className="tanishuv-pop mt-4">
          <label className="text-sm font-semibold text-text-strong" htmlFor="tmashq-natija">
            {t('tmashq.natija')}
          </label>
          <textarea
            id="tmashq-natija"
            value={natija}
            onChange={(e) => setNatija(e.target.value)}
            placeholder={t('tmashq.natijaJoy')}
            rows={2}
            className="mt-1 w-full rounded-xl border border-border-control bg-surface px-3 py-2 text-sm text-text-strong outline-none focus:border-brand-primary"
          />
          <button
            type="button"
            onClick={topshir}
            className="mt-2 w-full cursor-pointer rounded-xl bg-brand-primary py-3 font-semibold text-white transition hover:bg-brand-primary-hover active:scale-[0.98]"
          >
            {t('tmashq.topshirish')}
          </button>
        </div>
      )}

      {qadam === 'tekshiruvda' && (
        <div className="mt-4 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-text-muted">
          <span className="size-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand-primary" />
          {t('tmashq.tekshiruvda')}
        </div>
      )}

      {qadam === 'tasdiqlandi' && (
        <div className="tanishuv-pop relative mt-4 rounded-2xl bg-brand-soft p-4 text-center">
          <Konfetti kop />
          <p className="text-3xl" aria-hidden>
            ✅
          </p>
          <p className="mt-1 font-bold text-text-strong">{t('tmashq.bot3')}</p>
          <p className="mt-1 text-sm text-text-muted">{t('tmashq.yakun')}</p>
          <button
            type="button"
            onClick={yop}
            className="mt-3 w-full cursor-pointer rounded-xl bg-brand-primary py-2.5 font-semibold text-white transition hover:bg-brand-primary-hover"
          >
            {t('tanishuv.tushunarli')}
          </button>
        </div>
      )}
    </Oyna>
  )
}

function Maslahat({ matn }: { matn: string }) {
  return (
    <p className="mt-3 flex items-start gap-2 rounded-xl bg-amber-400/10 px-3 py-2.5 text-sm leading-relaxed text-text-strong">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
      {matn}
    </p>
  )
}
