'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Ban,
  CalendarDays,
  Check,
  CheckCheck,
  Pencil,
  Repeat,
  X,
} from 'lucide-react'
import { Yuklanmoqda } from '@/components/ui/holatlar'
import { Tasdiq } from '@/components/ui/tasdiq'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useFoydalanuvchi } from '@/components/app/foydalanuvchi'
import {
  useKelganTopshiriqlar,
  useOnlaynmi,
  useRuxsatOzgartirish,
  useTopshiriqKorildi,
  useTopshiriqTafsilotlari,
  useTopshiriqTopshirish,
  useYuborilganTopshiriqlar,
} from '@/lib/queries/topshiriqlar'
import {
  useTakrorniToxtatish,
  useTopshiriqIzohlari,
  useTopshiriqTarixi,
} from '@/lib/queries/topshiriq-jamoa'
import { bugunISO } from '@/lib/sana'
import { kechikkanmi } from '@/lib/topshiriq-yordam'
import { ChatXabarlari, ChatYozuvchi } from './chat'
import {
  Avatar,
  HolatBelgisi,
  MuhimlikBelgisi,
  sanaOraligi,
} from './karta'
import { korinishHolati, takrorMatni } from './holat'
import { TopshiriqFormasi } from './topshiriq-formasi'
import { Yulduzlar } from './yulduzlar'
import { QarorOynasi, type Qaror } from './qaror-oynasi'

/**
 * Topshiriqning to'liq sahifasi: tepada hamma ma'lumot va amallar,
 * pastda fikr-mulohazalar chati. Modal emas — alohida sahifa: chat
 * uzun bo'lishi mumkin, telefonda butun ekran kerak.
 */
export function TopshiriqSahifasi({ id }: { id: string | null }) {
  const t = useT()
  const { id: menId, ism: menIsm } = useFoydalanuvchi()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const kelgan = useKelganTopshiriqlar()
  const yuborilgan = useYuborilganTopshiriqlar()
  const { data: tafsilotlar } = useTopshiriqTafsilotlari()
  const { data: xabarlar = [] } = useTopshiriqIzohlari(id ?? '')
  const { data: tarix = [] } = useTopshiriqTarixi(id ?? '')
  const korildi = useTopshiriqKorildi()
  const topshirish = useTopshiriqTopshirish()
  const takrorToxtat = useTakrorniToxtatish()
  const ruxsat = useRuxsatOzgartirish()

  const [tahrirOchiq, setTahrirOchiq] = useState(false)
  const [qaror, setQaror] = useState<Qaror | null>(null)
  const [blokOchiq, setBlokOchiq] = useState(false)

  const topshiriq = [...(yuborilgan.data ?? []), ...(kelgan.data ?? [])].find((x) => x.id === id)
  const tafsilot = (Array.isArray(tafsilotlar) ? tafsilotlar : []).find((x) => x.topshiriq_id === id)

  // Ochilganda va har yangi xabarda — o'qildi (menyudagi raqam kamayadi)
  const korildiMutate = korildi.mutate
  useEffect(() => {
    if (id && topshiriq) korildiMutate(id)
  }, [id, Boolean(topshiriq), xabarlar.length, korildiMutate]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!id || ((kelgan.isPending || yuborilgan.isPending) && !topshiriq)) {
    return <div className="mx-auto max-w-3xl px-4 pt-8"><Yuklanmoqda qator={3} /></div>
  }
  if (!topshiriq) {
    return (
      <div className="mx-auto max-w-3xl px-4 pt-10 text-center">
        <p className="text-lg text-text-muted">{t('tk.topilmadi')}</p>
        <Link href="/topshiriqlar" className="mt-4 inline-block text-base font-semibold text-brand-onsoft underline">
          {t('tk.ortga')}
        </Link>
      </div>
    )
  }

  const meniki = topshiriq.yuboruvchi_id === menId
  const kech = kechikkanmi(topshiriq, bugunISO())
  const holat = korinishHolati(topshiriq, tafsilot?.vazifa_holati, kech)
  const qarshi = tafsilot?.qarshi_ism ?? (meniki ? topshiriq.qabul_qiluvchi_email : '…')
  const sana = sanaOraligi(topshiriq)
  const yopiq = topshiriq.holat === 'bajarildi' || topshiriq.holat === 'rad'

  async function amal(f: () => Promise<unknown>, xabar: string) {
    try {
      await f()
      korsat({ matn: xabar, tone: 'muvaffaqiyat' })
      return true
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
      return false
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col px-4 pt-4 md:px-8 md:pt-8">
      <Link
        href="/topshiriqlar"
        className="mb-2 flex w-fit items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-text-muted transition hover:bg-surface-muted hover:text-text-strong"
      >
        <ArrowLeft className="size-5" aria-hidden />
        {t('topshiriq.bolimi')}
      </Link>

      {/* Ma'lumotlar */}
      <section className="rounded-2xl bg-surface p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <MuhimlikBelgisi muhimlik={topshiriq.muhimlik} />
          <HolatBelgisi holat={holat} />
        </div>
        <h1 className="mt-2.5 text-lg leading-snug font-bold text-text-strong sm:text-xl">{topshiriq.sarlavha}</h1>
        {topshiriq.izoh && (
          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap text-text-muted sm:text-[0.9375rem]">
            {topshiriq.izoh}
          </p>
        )}

        {/* Kim, kimga, qachon — ixcham jadval (telefonda ham bir qarashda) */}
        <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2.5 border-t border-border-subtle pt-4 text-sm">
          <dt className="text-text-faint">{t('tk.kimdan')}</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <Avatar ism={meniki ? menIsm : qarshi} kalit={topshiriq.yuboruvchi_id} />
            <span className="truncate font-medium text-text-strong">{meniki ? t('tj.siz') : qarshi}</span>
          </dd>
          <dt className="text-text-faint">{t('tk.kimga')}</dt>
          <dd className="flex min-w-0 items-center gap-2">
            <Avatar ism={meniki ? qarshi : menIsm} kalit={topshiriq.qabul_qiluvchi_email} />
            <span className="truncate font-medium text-text-strong">{meniki ? qarshi : t('tj.siz')}</span>
          </dd>
          {sana && (
            <>
              <dt className="text-text-faint">{t('tk.muddatQisqa')}</dt>
              <dd className={`flex items-center gap-1.5 ${kech ? 'font-semibold text-danger' : 'text-text-strong'}`}>
                <CalendarDays className="size-4 shrink-0" aria-hidden />
                {sana}
              </dd>
            </>
          )}
          {topshiriq.takror && (
            <>
              <dt className="text-text-faint">{t('tk.takrorlanadi')}</dt>
              <dd className="flex flex-wrap items-center gap-2 text-text-strong">
                <Repeat className="size-4 shrink-0" aria-hidden />
                {takrorMatni(topshiriq.takror, t)}
                {meniki && !yopiq && (
                  <button
                    type="button"
                    disabled={!onlayn}
                    onClick={() => amal(() => takrorToxtat.mutateAsync(topshiriq.id), t('tj.takrorToxtadi'))}
                    className="min-h-0 rounded-lg border border-border-subtle px-2 py-0.5 text-xs font-medium transition hover:bg-surface-muted disabled:opacity-40"
                  >
                    {t('tj.takrorniToxtatish')}
                  </button>
                )}
              </dd>
            </>
          )}
          {topshiriq.baho != null && (
            <>
              <dt className="text-text-faint">{t('tj.baho')}</dt>
              <dd><Yulduzlar qiymat={topshiriq.baho} /></dd>
            </>
          )}
        </dl>

        {meniki && tafsilot?.foiz != null && !yopiq && topshiriq.holat !== 'tekshiruvda' && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-text-muted">
              <span>{t('tk.bajarilishi')}</span>
              <span className="font-semibold text-text-strong">{tafsilot.foiz}%</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-brand-accent" style={{ width: `${tafsilot.foiz}%` }} />
            </div>
          </div>
        )}

        {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
          <p className="mt-4 rounded-xl px-3 py-2 text-sm" style={{ color: '#c2410c', backgroundColor: 'rgba(234,88,12,0.1)' }}>
            <b>{t('tk.radSababi')}:</b> {topshiriq.qaytarish_sababi}
          </p>
        )}

        {/* Amallar */}
        <div className="mt-5 flex flex-wrap gap-2">
          {meniki && topshiriq.holat === 'tekshiruvda' && (
            <div className="w-full rounded-2xl bg-surface-muted p-3.5">
              <p className="text-[0.9375rem] font-semibold text-text-strong">{t('tk.tekshiringSarlavha')}</p>
              <p className="mt-1 text-sm text-text-muted">{t('tk.qarorIzoh')}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!onlayn}
                  onClick={() => setQaror('qabul')}
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-brand-accent px-2 text-sm font-semibold whitespace-nowrap text-white transition hover:bg-brand-accent-hover disabled:opacity-50"
                >
                  <Check className="size-5" aria-hidden />
                  {t('tk.qabulQilish')}
                </button>
                <button
                  type="button"
                  disabled={!onlayn}
                  onClick={() => setQaror('rad')}
                  className="flex min-h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-danger px-2 text-sm font-semibold whitespace-nowrap text-danger transition hover:bg-danger-soft disabled:opacity-50"
                >
                  <X className="size-5" aria-hidden />
                  {t('tk.radEtish')}
                </button>
              </div>
            </div>
          )}
          {meniki && !yopiq && (
            <button
              type="button"
              disabled={!onlayn}
              onClick={() => setTahrirOchiq(true)}
              className="flex min-h-10 items-center gap-2 rounded-xl border border-border-control px-4 text-sm font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-40"
            >
              <Pencil className="size-4" aria-hidden />
              {t('tk.tahrirlash')}
            </button>
          )}
          {!meniki && topshiriq.holat === 'qabul' && (
            <div className="w-full">
              <button
                type="button"
                disabled={!onlayn || topshirish.isPending}
                onClick={() =>
                  amal(() => topshirish.mutateAsync({ id: topshiriq.id, izoh: '' }), t('tk.tekshiruvgaYuborildi'))
                }
                className="flex min-h-10 items-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
              >
                <CheckCheck className="size-5" aria-hidden />
                {t('tk.bajarildiBelgilash')}
              </button>
              <p className="mt-2 text-sm text-text-faint">{t('tk.bajarildiIzoh')}</p>
            </div>
          )}
          {!meniki && topshiriq.holat === 'tekshiruvda' && (
            <p className="text-sm text-text-muted">{t('tk.tekshirilmoqda')}</p>
          )}
        </div>
      </section>

      {/* Chat */}
      <h2 className="mt-6 mb-2.5 px-1 text-base font-semibold text-text-strong">{t('tk.fikrMulohazalar')}</h2>
      <div className="flex-1 rounded-2xl bg-surface-sunken/60 p-3">
        <ChatXabarlari xabarlar={xabarlar} tarix={tarix} qarshiIsm={qarshi} />
      </div>
      <div className="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 mt-3 md:bottom-4">
        <ChatYozuvchi topshiriqId={topshiriq.id} />
      </div>

      {!meniki && tafsilot?.qarshi_email && (
        <button
          type="button"
          onClick={() => setBlokOchiq(true)}
          className="mt-6 mb-4 flex w-fit items-center gap-1.5 self-center rounded-lg px-2 py-1 text-sm text-text-faint transition hover:text-danger"
        >
          <Ban className="size-4" aria-hidden />
          {t('tk.bloklash', { kim: qarshi })}
        </button>
      )}

      {tahrirOchiq && <TopshiriqFormasi tahrir={topshiriq} yop={() => setTahrirOchiq(false)} />}
      {qaror && (
        <QarorOynasi topshiriqId={topshiriq.id} qaror={qaror} yop={() => setQaror(null)} />
      )}
      {blokOchiq && (
        <Tasdiq
          sarlavha={t('topshiriq.bloklash')}
          matn={t('topshiriq.blokTasdiq', { kim: qarshi })}
          tugmaMatni={t('topshiriq.bloklash')}
          tasdiqla={async () => {
            const ok = await amal(
              () => ruxsat.mutateAsync({ email: tafsilot?.qarshi_email ?? '', holat: 'blok' }),
              t('topshiriq.bloklandi')
            )
            if (ok) setBlokOchiq(false)
          }}
          yop={() => setBlokOchiq(false)}
          bajarilmoqda={ruxsat.isPending}
        />
      )}
    </div>
  )
}
