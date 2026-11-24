'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'
import { OsuvchiMaydon } from '@/components/ui/osuvchi-maydon'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useIzohQoshish } from '@/lib/queries/topshiriq-jamoa'
import {
  useOnlaynmi,
  useTopshiriqQaytarish,
  useTopshiriqTasdiqlash,
} from '@/lib/queries/topshiriqlar'
import { Yulduzlar } from './yulduzlar'

export type Qaror = 'qabul' | 'rad'

/**
 * Tekshiruvdagi natija bo'yicha qaror — doim izoh bilan.
 *
 * Nega izoh majburiy: ijrochi qabul qilinganda ham, rad etilganda ham
 * nima uchunligini bilishi kerak ("yaxshi, lekin keyingi safar..." yoki
 * "jadvalda mart yo'q"). Qabul izohi chatga xabar bo'lib tushadi,
 * rad sababi esa kartada va chatda ko'rinadi — ijrochiga ikkalasi
 * ham bildirishnoma bo'lib boradi.
 */
export function QarorOynasi({
  topshiriqId,
  qaror,
  yop,
}: {
  topshiriqId: string
  qaror: Qaror
  yop: () => void
}) {
  const t = useT()
  const { korsat } = useToast()
  const onlayn = useOnlaynmi()
  const tasdiqlash = useTopshiriqTasdiqlash()
  const qaytarish = useTopshiriqQaytarish()
  const izohQoshish = useIzohQoshish(topshiriqId)
  const [izoh, setIzoh] = useState('')
  const [baho, setBaho] = useState(0)

  const qabul = qaror === 'qabul'
  const band = tasdiqlash.isPending || qaytarish.isPending || izohQoshish.isPending
  const tayyor = onlayn && izoh.trim().length > 0 && !band

  async function yubor() {
    if (!tayyor) return
    try {
      if (qabul) {
        // Avval izoh: holat o'zgargach ham chatda tursin
        await izohQoshish.mutateAsync({ matn: izoh })
        await tasdiqlash.mutateAsync({ id: topshiriqId, baho: baho || null })
        korsat({ matn: t('tk.qabulQilindi'), tone: 'muvaffaqiyat' })
      } else {
        await qaytarish.mutateAsync({ id: topshiriqId, sabab: izoh })
        korsat({ matn: t('tk.radEtildi'), tone: 'muvaffaqiyat' })
      }
      yop()
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <Oyna sarlavha={t(qabul ? 'tk.qabulSarlavha' : 'tk.radSarlavha')} yop={yop}>
      <p className="mb-3 text-base text-text-muted">
        {t(qabul ? 'tk.qabulIzoh' : 'tk.radIzoh')}
      </p>
      <OsuvchiMaydon
        qiymat={izoh}
        onChange={setIzoh}
        placeholder={t(qabul ? 'tk.qabulJoy' : 'tk.radJoy')}
        ariaLabel={t(qabul ? 'tk.qabulSarlavha' : 'tk.radSarlavha')}
        maxLength={1000}
        autoFocus
        engKattaBalandlik={220}
        className="min-h-28 rounded-xl border border-border-control bg-surface px-4 py-3 text-base leading-relaxed text-text-strong outline-none placeholder:text-text-faint focus:border-brand-onsoft"
      />

      {qabul && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-base text-text-muted">{t('tk.bahoIxtiyoriy')}</span>
          <Yulduzlar qiymat={baho} ozgartir={setBaho} />
        </div>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={yop}
          className="min-h-touch rounded-xl px-4 text-base font-medium text-text-muted transition hover:bg-surface-muted"
        >
          {t('umumiy.bekor')}
        </button>
        <button
          type="button"
          onClick={yubor}
          disabled={!tayyor}
          className={`flex min-h-touch items-center gap-2 rounded-xl px-5 text-base font-semibold whitespace-nowrap text-white transition disabled:opacity-50 ${
            qabul ? 'bg-brand-accent hover:bg-brand-accent-hover' : 'bg-danger hover:opacity-90'
          }`}
        >
          {qabul ? <Check className="size-5" aria-hidden /> : <X className="size-5" aria-hidden />}
          {t(qabul ? 'tk.qabulQilish' : 'tk.radEtish')}
        </button>
      </div>
      {!onlayn && <p className="mt-3 text-sm text-text-muted">{t('tj.offline')}</p>}
    </Oyna>
  )
}
