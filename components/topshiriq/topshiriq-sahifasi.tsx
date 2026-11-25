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
import { bugunISO, isoGa, toliqSana } from '@/lib/sana'
import { kechikkanmi } from '@/lib/topshiriq-yordam'
import { CHAT_FONI, ChatXabarlari, ChatYozuvchi, PILL } from './chat'
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
 * Topshiriqning to'liq sahifasi — Telegram'dagi kanal posti ostidagi
 * "Fikrlar" oynasi naqshida: tepada topshiriq post pufagi bo'lib
 * turadi, ostida suhbat, pastda yozish maydoni.
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
  // Ikkinchi tomon avatarining rangi sahifaning hamma joyida bir xil bo'lsin
  const qarshiKalit = meniki ? topshiriq.qabul_qiluvchi_email : topshiriq.yuboruvchi_id
  const menKalit = menId ?? ''
  const sana = sanaOraligi(topshiriq)
  const yopiq = topshiriq.holat === 'bajarildi' || topshiriq.holat === 'rad'
  const fikrSoni = xabarlar.length
  const yaratildi = new Date(topshiriq.created_at)
  const yaratildiMatni = `${toliqSana(isoGa(yaratildi))}, ${String(yaratildi.getHours()).padStart(2, '0')}:${String(yaratildi.getMinutes()).padStart(2, '0')}`

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
    /*
      Telefonda butun ekran — ilova sarlavhasi va pastki menyu ustidan
      (Telegram'dagidek suhbatga hech narsa xalaqit bermasin). Shell'ga
      tegmaslik uchun `fixed` qatlam: z-45 menyulardan (30/40) baland,
      oynalar (50) va xabarnomalardan (100) past. Kompyuterda esa yon
      panel yonida, ekran balandligida turadi.
    */
    <div
      className="fixed inset-0 z-[45] flex flex-col md:static md:z-auto md:h-dvh"
      style={CHAT_FONI}
    >
      {/* Suzib turuvchi sarlavha: ortga va "N ta fikr" */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-3 pt-3">
          <Link
            href="/topshiriqlar"
            aria-label={t('tk.ortga')}
            className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full bg-surface text-text-strong shadow-card transition hover:bg-surface-muted"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <div className="pointer-events-auto mx-auto flex min-w-0 items-center gap-2 rounded-full bg-surface py-1 pr-4 pl-1 shadow-card">
            <Avatar ism={qarshi} kalit={qarshiKalit} katta />
            <span className="truncate text-[0.9375rem] font-semibold text-text-strong">
              {fikrSoni > 0 ? t('tk.fikrSoni', { son: fikrSoni }) : t('tk.fikrMulohazalar')}
            </span>
          </div>
          {/* Sarlavha markazda tursin — chapdagi tugma bilan muvozanat */}
          <span className="size-11 shrink-0" aria-hidden />
        </div>
      </div>

      {/* Post va suhbat */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto max-w-2xl px-2.5 pt-[calc(4.25rem+env(safe-area-inset-top))] pb-3 sm:px-4">
          {/* Topshiriqning o'zi — kanal posti kabi katta pufak */}
          <article className="rounded-2xl rounded-bl-md bg-surface px-4 pt-3.5 pb-2 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MuhimlikBelgisi muhimlik={topshiriq.muhimlik} />
              <HolatBelgisi holat={holat} />
            </div>
            <h1 className="mt-2.5 text-[1.0625rem] leading-snug font-bold text-text-strong">{topshiriq.sarlavha}</h1>
            {topshiriq.izoh && (
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-text-strong">
                {topshiriq.izoh}
              </p>
            )}

            {/* Kim, kimga, qachon — ixcham */}
            <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 rounded-xl bg-surface-muted px-3 py-2.5 text-sm">
              <dt className="text-text-faint">{t('tk.kimdan')}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <Avatar ism={meniki ? menIsm : qarshi} kalit={meniki ? menKalit : qarshiKalit} />
                <span className="truncate font-medium text-text-strong">{meniki ? t('tj.siz') : qarshi}</span>
              </dd>
              <dt className="text-text-faint">{t('tk.kimga')}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                <Avatar ism={meniki ? qarshi : menIsm} kalit={meniki ? qarshiKalit : menKalit} />
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
                        className="min-h-0 rounded-lg border border-border-subtle bg-surface px-2 py-0.5 text-xs font-medium transition hover:bg-surface-sunken disabled:opacity-40"
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
              <div className="mt-3">
                <div className="flex justify-between text-sm text-text-muted">
                  <span>{t('tk.bajarilishi')}</span>
                  <span className="font-semibold text-text-strong">{tafsilot.foiz}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div className="h-full rounded-full bg-brand-accent" style={{ width: `${tafsilot.foiz}%` }} />
                </div>
              </div>
            )}

            {topshiriq.holat === 'qabul' && topshiriq.qaytarish_sababi && (
              <p className="mt-3 rounded-xl px-3 py-2 text-sm" style={{ color: '#c2410c', backgroundColor: 'rgba(234,88,12,0.1)' }}>
                <b>{t('tk.radSababi')}:</b> {topshiriq.qaytarish_sababi}
              </p>
            )}

            {/* Amallar */}
            {meniki && topshiriq.holat === 'tekshiruvda' && (
              <div className="mt-3 rounded-xl border border-border-subtle p-3">
                <p className="text-[0.9375rem] font-semibold text-text-strong">{t('tk.tekshiringSarlavha')}</p>
                <p className="mt-0.5 text-sm text-text-muted">{t('tk.qarorIzoh')}</p>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
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
            {!meniki && topshiriq.holat === 'qabul' && (
              <div className="mt-3">
                <button
                  type="button"
                  disabled={!onlayn || topshirish.isPending}
                  onClick={() =>
                    amal(() => topshirish.mutateAsync({ id: topshiriq.id, izoh: '' }), t('tk.tekshiruvgaYuborildi'))
                  }
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
                >
                  <CheckCheck className="size-5" aria-hidden />
                  {t('tk.bajarildiBelgilash')}
                </button>
                <p className="mt-1.5 text-xs text-text-faint">{t('tk.bajarildiIzoh')}</p>
              </div>
            )}
            {!meniki && topshiriq.holat === 'tekshiruvda' && (
              <p className="mt-3 text-sm text-text-muted">{t('tk.tekshirilmoqda')}</p>
            )}

            {/* Post osti: tahrirlash (chapda) va yuborilgan vaqt (o'ngda) */}
            <div className="mt-2 flex items-center justify-between gap-2">
              {meniki && !yopiq ? (
                <button
                  type="button"
                  disabled={!onlayn}
                  onClick={() => setTahrirOchiq(true)}
                  className="-ml-2 flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-brand-onsoft transition hover:bg-surface-muted disabled:opacity-40"
                >
                  <Pencil className="size-4" aria-hidden />
                  {t('tk.tahrirlash')}
                </button>
              ) : (
                <span />
              )}
              <span className="text-xs text-text-faint">{yaratildiMatni}</span>
            </div>
          </article>

          {/* Suhbat */}
          <div className="my-3 flex justify-center">
            <span className={PILL}>{t('tk.muhokamaBoshlandi')}</span>
          </div>
          <ChatXabarlari xabarlar={xabarlar} tarix={tarix} qarshiIsm={qarshi} qarshiKalit={qarshiKalit} />

          {!meniki && tafsilot?.qarshi_email && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setBlokOchiq(true)}
                className="flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-text-muted shadow-sm transition hover:text-danger"
              >
                <Ban className="size-3.5" aria-hidden />
                {t('tk.bloklash', { kim: qarshi })}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Yozish maydoni */}
      <div className="shrink-0 px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] sm:px-4 md:pb-4">
        <div className="mx-auto max-w-2xl">
          <ChatYozuvchi topshiriqId={topshiriq.id} />
        </div>
      </div>

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
