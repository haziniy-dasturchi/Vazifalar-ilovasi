'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { useToast } from '@/components/ui/toast'
import { MuhimlikTanlagich } from '@/components/vazifa/muhimlik-tanlagich'
import { useT } from '@/components/app/til-provayder'
import {
  useOnlaynmi,
  useTopshiriqKontaktlari,
  useTopshiriqTahrirlash,
  useTopshiriqYuborish,
} from '@/lib/queries/topshiriqlar'
import type { TaskPriority, Topshiriq, TopshiriqTakrori } from '@/types/vazifalar'
import { KimgaTanlagich } from './kimga-tanlagich'
import { MuddatTanlagich, type Muddat } from './muddat-tanlagich'
import { UlashishOynasi } from './ulashish'

const maydon =
  'w-full rounded-xl border border-border-control bg-surface px-3.5 text-[0.9375rem] text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft'
const yorliq = 'mb-1.5 block text-sm font-semibold text-text-strong'

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
  const onlayn = useOnlaynmi()
  const yuborish = useTopshiriqYuborish()
  const tahrirlash = useTopshiriqTahrirlash()
  const kontaktlar = useTopshiriqKontaktlari()

  const [kimlarga, setKimlarga] = useState<string[]>([])
  const [sarlavha, setSarlavha] = useState(tahrir?.sarlavha ?? '')
  const [izoh, setIzoh] = useState(tahrir?.izoh ?? '')
  const [muddat, setMuddat] = useState<Muddat>({
    boshi: tahrir?.boshlanish ?? tahrir?.muddat ?? null,
    oxiri: tahrir?.muddat ?? null,
    boshVaqt: tahrir?.boshlanish_vaqt?.slice(0, 5) ?? '',
    oxirVaqt: tahrir?.muddat_vaqt?.slice(0, 5) ?? '',
    takror: (tahrir?.takror ?? '') as TopshiriqTakrori | '',
  })
  const [muhimlik, setMuhimlik] = useState<TaskPriority>(tahrir?.muhimlik ?? 4)
  const [taklifOchiq, setTaklifOchiq] = useState(false)

  const band = yuborish.isPending || tahrirlash.isPending
  const tayyor = onlayn && sarlavha.trim().length > 0 && (tahrir ? true : kimlarga.length > 0)

  async function saqla() {
    if (!tayyor || band) return
    const sanalar = {
      boshlanish: muddat.oxiri ? muddat.boshi : null,
      boshlanish_vaqt: muddat.oxiri && muddat.boshVaqt ? muddat.boshVaqt : null,
      muddat: muddat.oxiri,
      muddat_vaqt: muddat.oxiri && muddat.oxirVaqt ? muddat.oxirVaqt : null,
    }
    try {
      if (tahrir) {
        await tahrirlash.mutateAsync({
          id: tahrir.id,
          sarlavha,
          izoh,
          ...sanalar,
          muhimlik,
          takror: muddat.takror || null,
        })
        korsat({ matn: t('tk.saqlandi'), tone: 'muvaffaqiyat' })
      } else {
        await yuborish.mutateAsync({
          qabul_qiluvchi_email: kimlarga[0],
          qabul_qiluvchilar: kimlarga,
          sarlavha,
          izoh,
          ...sanalar,
          muhimlik,
          takror: muddat.takror || null,
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
        // "Bu odamga yubora olmaysiz" faqat topshiriqlar jadvali rad
        // etganda; sessiya yo'qolgan bo'lsa boshqa sabab — odamni
        // adashtirmaslik uchun aniq aytamiz
        matn:
          xabar === 'sessiya'
            ? t('umumiy.sessiyaYoq')
            : xabar === 'ozimga'
              ? t('topshiriq.ozigaBolmaydi')
              : xabar.startsWith('taqiqlangan:')
                ? t('topshiriq.taqiqlanganKim', { kim: xabar.slice('taqiqlangan:'.length) })
                : xabar.includes('row-level security') && xabar.includes('topshiriqlar')
              ? t('topshiriq.taqiqlangan')
              : `${t('topshiriq.yuborilmadi')}${xabar ? ` (${xabar})` : ''}`,
        tone: 'xato',
      })
    }
  }

  return (
    <Oyna sarlavha={tahrir ? t('tk.tahrirlash') : t('topshiriq.yangi')} yop={yop} kenglik="keng">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saqla()
        }}
        className="space-y-4"
      >
        {!tahrir && (
          <section>
            <span className={yorliq}>{t('topshiriq.kimga')}</span>
            <KimgaTanlagich
              kontaktlar={kontaktlar}
              tanlanganlar={kimlarga}
              ozgartir={setKimlarga}
              taklifQil={() => setTaklifOchiq(true)}
            />
          </section>
        )}

        <section>
          <label htmlFor="tk-sarlavha" className={yorliq}>
            {t('topshiriq.sarlavha')}
          </label>
          <input
            id="tk-sarlavha"
            value={sarlavha}
            onChange={(e) => setSarlavha(e.target.value)}
            placeholder={t('tk.sarlavhaJoy')}
            maxLength={500}
            className={`min-h-11 ${maydon}`}
          />
        </section>

        <section>
          <label htmlFor="tk-izoh" className={yorliq}>
            {t('tk.batafsil')}
          </label>
          <textarea
            id="tk-izoh"
            value={izoh}
            onChange={(e) => setIzoh(e.target.value)}
            placeholder={t('tk.izohJoy')}
            maxLength={2000}
            rows={5}
            className={`min-h-32 resize-y py-2.5 leading-relaxed ${maydon}`}
          />
        </section>

        <section>
          <span className={yorliq}>{t('tk.muddat')}</span>
          <MuddatTanlagich qiymat={muddat} ozgartir={setMuddat} />
        </section>

        <section>
          <span className={yorliq}>{t('vazifa.muhimlik')}</span>
          <MuhimlikTanlagich qiymat={muhimlik} onChange={setMuhimlik} />
        </section>

        <button
          type="submit"
          disabled={!tayyor || band}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 text-[0.9375rem] font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden />
          {band ? t('umumiy.kuting') : tahrir ? t('tk.saqlash') : t('topshiriq.yubor')}
        </button>
        {!onlayn && <p className="text-center text-sm text-text-muted">{t('tj.offline')}</p>}
      </form>

      {taklifOchiq && <UlashishOynasi yop={() => setTaklifOchiq(false)} />}
    </Oyna>
  )
}
