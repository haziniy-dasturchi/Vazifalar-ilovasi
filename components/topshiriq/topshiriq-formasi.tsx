'use client'

import { useState } from 'react'
import { CalendarDays, Send, UserPlus, X } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { OraliqKalendar } from '@/components/ui/oraliq-kalendar'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import {
  useOnlaynmi,
  useTopshiriqKontaktlari,
  useTopshiriqTahrirlash,
  useTopshiriqYuborish,
  useYozsaBoladimi,
} from '@/lib/queries/topshiriqlar'
import { toliqSana } from '@/lib/sana'
import type { MatnKaliti } from '@/lib/i18n'
import type { TaskPriority, Topshiriq, TopshiriqTakrori } from '@/types/vazifalar'
import { Avatar } from './karta'
import { UlashishOynasi } from './ulashish'

const EMAIL_SHAKLI = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const TAKROR: Record<TopshiriqTakrori | '', MatnKaliti> = {
  '': 'tj.takror.yoq',
  kunlik: 'tj.takror.kunlik',
  haftalik: 'tj.takror.haftalik',
  oylik: 'tj.takror.oylik',
}

const maydon =
  'w-full rounded-xl border border-border-control bg-surface px-4 text-base text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft'

/**
 * Topshiriq yuborish va tahrirlash — bitta forma.
 * Tahrirlashda "kimga" o'zgarmaydi (u allaqachon ijrochida).
 */
export function TopshiriqFormasi({
  yop,
  tahrir,
}: {
  yop: () => void
  tahrir?: Topshiriq
}) {
  const t = useT()
  const { korsat } = useToast()
  const { email: ozEmail } = useFoydalanuvchi()
  const onlayn = useOnlaynmi()
  const yuborish = useTopshiriqYuborish()
  const tahrirlash = useTopshiriqTahrirlash()
  const kontaktlar = useTopshiriqKontaktlari()

  const [tanlanganlar, setTanlanganlar] = useState<Set<string>>(new Set())
  const [email, setEmail] = useState('')
  const [yangiOdam, setYangiOdam] = useState(false)
  const [sarlavha, setSarlavha] = useState(tahrir?.sarlavha ?? '')
  const [izoh, setIzoh] = useState(tahrir?.izoh ?? '')
  const [boshi, setBoshi] = useState<string | null>(tahrir?.boshlanish ?? tahrir?.muddat ?? null)
  const [oxiri, setOxiri] = useState<string | null>(tahrir?.muddat ?? null)
  const [vaqt, setVaqt] = useState(tahrir?.muddat_vaqt?.slice(0, 5) ?? '')
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(tahrir?.muhimlik ?? 4)
  const [takror, setTakror] = useState<TopshiriqTakrori | ''>('')
  const [kalendarOchiq, setKalendarOchiq] = useState(false)
  const [taklifOchiq, setTaklifOchiq] = useState(false)

  const toza = email.trim().toLowerCase()
  const emailTogri = EMAIL_SHAKLI.test(toza)
  const ozigami = toza !== '' && toza === ozEmail.toLowerCase()
  const { data: yozsaBoladi } = useYozsaBoladimi(emailTogri ? toza : '')
  const taqiqlangan = emailTogri && !ozigami && yozsaBoladi === false

  const kimlarga = [...new Set([...tanlanganlar, ...(emailTogri && !ozigami ? [toza] : [])])]
  const emailMaydoni = yangiOdam || kontaktlar.length === 0
  const band = yuborish.isPending || tahrirlash.isPending
  const tayyor =
    onlayn &&
    sarlavha.trim().length > 0 &&
    (tahrir
      ? true
      : kimlarga.length > 0 && !taqiqlangan && !(toza !== '' && (!emailTogri || ozigami)))

  function kontakt(e: string) {
    setTanlanganlar((eski) => {
      const yangi = new Set(eski)
      if (yangi.has(e)) yangi.delete(e)
      else yangi.add(e)
      return yangi
    })
  }

  async function saqla() {
    if (!tayyor || band) return
    const muddat = oxiri
    const boshlanish = boshi && oxiri && boshi !== oxiri ? boshi : null
    try {
      if (tahrir) {
        await tahrirlash.mutateAsync({
          id: tahrir.id,
          sarlavha,
          izoh,
          boshlanish,
          muddat,
          muddat_vaqt: muddat && vaqt ? vaqt : null,
          muhimlik,
        })
        korsat({ matn: t('tk.saqlandi'), tone: 'muvaffaqiyat' })
      } else {
        await yuborish.mutateAsync({
          qabul_qiluvchi_email: kimlarga[0],
          qabul_qiluvchilar: kimlarga,
          sarlavha,
          izoh,
          boshlanish,
          muddat,
          muddat_vaqt: muddat && vaqt ? vaqt : null,
          muhimlik,
          takror: takror || null,
        })
        korsat({
          matn:
            kimlarga.length > 1
              ? t('tj.yuborildiKopga', { son: kimlarga.length })
              : t('topshiriq.yuborildi'),
          tone: 'muvaffaqiyat',
        })
      }
      yop()
    } catch (xato) {
      const xabar = xato instanceof Error ? xato.message : ''
      korsat({
        matn: xabar.includes('row-level security')
          ? t('topshiriq.taqiqlangan')
          : t('topshiriq.yuborilmadi'),
        tone: 'xato',
      })
    }
  }

  const sanaMatni = oxiri
    ? boshi && boshi !== oxiri
      ? `${toliqSana(boshi)} — ${toliqSana(oxiri)}`
      : toliqSana(oxiri)
    : null

  return (
    <Oyna sarlavha={tahrir ? t('tk.tahrirlash') : t('topshiriq.yangi')} yop={yop} kenglik="keng">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saqla()
        }}
        className="space-y-5"
      >
        {/* Kimga */}
        {!tahrir && (
          <section>
            <p className="mb-2 text-base font-semibold text-text-strong">{t('topshiriq.kimga')}</p>
            {kontaktlar.length > 0 && (
              <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
                {kontaktlar.map((k) => {
                  const faol = tanlanganlar.has(k.email)
                  return (
                    <button
                      key={k.email}
                      type="button"
                      aria-pressed={faol}
                      onClick={() => kontakt(k.email)}
                      className={`flex min-h-0 max-w-full items-center gap-2 rounded-full border-2 py-1 pr-4 pl-1 text-base transition ${
                        faol
                          ? 'border-brand-accent bg-brand-soft font-semibold text-brand-onsoft'
                          : 'border-border-subtle text-text-strong hover:bg-surface-muted'
                      }`}
                    >
                      <Avatar ism={k.ism ?? k.email} kalit={k.email} />
                      <span className="truncate">{k.ism ?? k.email}</span>
                    </button>
                  )
                })}
                {!emailMaydoni && (
                  <button
                    type="button"
                    onClick={() => setYangiOdam(true)}
                    className="flex min-h-0 items-center gap-1.5 rounded-full border-2 border-dashed border-border-control px-4 py-1.5 text-base font-medium text-brand-onsoft transition hover:bg-brand-soft"
                  >
                    <UserPlus className="size-4" aria-hidden />
                    {t('topshiriq.yangiOdam')}
                  </button>
                )}
              </div>
            )}

            {emailMaydoni && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('tk.emailJoy')}
                aria-label={t('topshiriq.kimga')}
                maxLength={200}
                className={`min-h-touch ${maydon} ${kontaktlar.length > 0 ? 'mt-2' : ''}`}
              />
            )}
            {toza !== '' && !emailTogri && (
              <p className="mt-1.5 text-sm text-danger">{t('topshiriq.emailNotogri')}</p>
            )}
            {ozigami && <p className="mt-1.5 text-sm text-danger">{t('topshiriq.ozigaBolmaydi')}</p>}
            {taqiqlangan && <p className="mt-1.5 text-sm text-danger">{t('topshiriq.taqiqlangan')}</p>}
            {kimlarga.length > 1 && (
              <p className="mt-2 text-sm text-text-muted">
                {t('tj.nechtaTanlandi', { son: kimlarga.length })}
              </p>
            )}

            <button
              type="button"
              onClick={() => setTaklifOchiq(true)}
              className="mt-2 min-h-0 rounded-lg px-1 py-1 text-sm font-semibold text-brand-onsoft underline-offset-2 hover:underline"
            >
              {t('tk.ilovadaYoqmi')}
            </button>
          </section>
        )}

        {/* Nima qilish kerak */}
        <section>
          <label htmlFor="tk-sarlavha" className="mb-2 block text-base font-semibold text-text-strong">
            {t('topshiriq.sarlavha')}
          </label>
          <input
            id="tk-sarlavha"
            value={sarlavha}
            onChange={(e) => setSarlavha(e.target.value)}
            placeholder={t('tk.sarlavhaJoy')}
            maxLength={500}
            className={`min-h-touch ${maydon}`}
          />
        </section>

        <section>
          <label htmlFor="tk-izoh" className="mb-2 block text-base font-semibold text-text-strong">
            {t('tk.batafsil')}
          </label>
          <textarea
            id="tk-izoh"
            value={izoh}
            onChange={(e) => setIzoh(e.target.value)}
            placeholder={t('tk.izohJoy')}
            maxLength={2000}
            rows={5}
            className={`min-h-36 resize-y py-3 leading-relaxed ${maydon}`}
          />
        </section>

        {/* Muddat: kalendarda oraliq + tugash soati */}
        <section>
          <p className="mb-2 text-base font-semibold text-text-strong">{t('tk.muddat')}</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setKalendarOchiq((v) => !v)}
              aria-expanded={kalendarOchiq}
              className={`flex min-h-touch items-center gap-2 rounded-xl border-2 px-4 text-base font-medium transition ${
                sanaMatni
                  ? 'border-brand-accent bg-brand-soft text-brand-onsoft'
                  : 'border-border-control text-text-muted hover:bg-surface-muted'
              }`}
            >
              <CalendarDays className="size-5" aria-hidden />
              {sanaMatni ?? t('tk.sanaTanlang')}
            </button>
            {oxiri && (
              <label className="flex items-center gap-2 text-base text-text-muted">
                {t('tk.soatgacha')}
                <input
                  type="time"
                  value={vaqt}
                  onChange={(e) => setVaqt(e.target.value)}
                  className="min-h-touch rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
                />
              </label>
            )}
            {oxiri && (
              <button
                type="button"
                onClick={() => {
                  setBoshi(null)
                  setOxiri(null)
                  setVaqt('')
                }}
                aria-label={t('tk.sanaTozalash')}
                className="flex size-10 min-h-0 items-center justify-center rounded-full text-text-faint transition hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-5" aria-hidden />
              </button>
            )}
          </div>
          {kalendarOchiq && (
            <div className="mt-3">
              <p className="mb-2 text-sm text-text-muted">{t('tk.oraliqIzoh')}</p>
              <OraliqKalendar
                boshi={boshi}
                oxiri={oxiri}
                ozgartir={(b, o) => {
                  setBoshi(b)
                  setOxiri(o)
                  if (!o) setVaqt('')
                }}
              />
            </div>
          )}
        </section>

        <section className="flex flex-wrap items-end gap-6">
          <div>
            <p className="mb-2 text-base font-semibold text-text-strong">{t('vazifa.muhimlik')}</p>
            <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} />
          </div>
          {!tahrir && (
            <label className="block">
              <span className="mb-2 block text-base font-semibold text-text-strong">
                {t('tj.takrorlanadi')}
              </span>
              <select
                value={takror}
                onChange={(e) => setTakror(e.target.value as TopshiriqTakrori | '')}
                className="min-h-touch rounded-xl border border-border-control bg-surface px-3 text-base text-text-strong outline-none focus:border-brand-onsoft"
              >
                {(Object.keys(TAKROR) as (TopshiriqTakrori | '')[]).map((k) => (
                  <option key={k || 'yoq'} value={k}>
                    {t(TAKROR[k])}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <button
          type="submit"
          disabled={!tayyor || band}
          className="flex min-h-touch w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Send className="size-5" aria-hidden />
          {band ? t('umumiy.kuting') : tahrir ? t('tk.saqlash') : t('topshiriq.yubor')}
        </button>
        {!onlayn && <p className="text-center text-sm text-text-muted">{t('tj.offline')}</p>}
      </form>

      {taklifOchiq && <UlashishOynasi yop={() => setTaklifOchiq(false)} />}
    </Oyna>
  )
}
