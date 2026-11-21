'use client'

import { useState, useSyncExternalStore } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { Oyna } from '@/components/ui/oyna'
import { useT } from './til-provayder'
import {
  offlineOynasiOchiqmi,
  offlineOynasigaObuna,
  offlineOynasiniYop,
} from '@/lib/offline-oynasi'
import { PLAY_STORE_HAVOLASI } from '@/lib/huquqiy'

/**
 * Veb'da internet yo'q paytda tahrirlashga urinilganda chiqadigan
 * do'stona oyna. `useOutboxMutation` (`lib/queries/outbox-mutatsiya.ts`)
 * so'rovni yubormasdan shuni ochadi — demak bu yerda hech qanday
 * "navbatga qo'yish" yo'q, shunchaki ma'lumot bermoqchi bo'lamiz.
 *
 * Appda (Capacitor) hech qachon ochilmaydi: u yerda offline'da ham
 * yozish ishlaydi, shuning uchun bloklovchi kod ishga tushmaydi.
 */
export function OfflineTahrirlashOynasi() {
  const ochiq = useSyncExternalStore(
    offlineOynasigaObuna,
    offlineOynasiOchiqmi,
    () => false
  )
  const t = useT()
  const [tekshirilmoqda, setTekshirilmoqda] = useState(false)
  const [hamonYoq, setHamonYoq] = useState(false)

  if (!ochiq) return null

  function qaytaTekshir() {
    setTekshirilmoqda(true)
    setHamonYoq(false)
    // `onlineManager` holati brauzerning `navigator.onLine`'iga obuna
    // bo'lgan — bu yerda shunchaki joriy qiymatni o'qiymiz
    window.setTimeout(() => {
      setTekshirilmoqda(false)
      if (onlineManager.isOnline()) {
        offlineOynasiniYop()
      } else {
        setHamonYoq(true)
      }
    }, 400)
  }

  return (
    <Oyna sarlavha={t('offlineOyna.sarlavha')} yop={offlineOynasiniYop}>
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
        <img
          src="/illustrations/offline-tahrirlash.svg"
          alt=""
          className="h-32 w-auto"
        />
        <p className="mt-4 text-base leading-relaxed text-text-muted">
          {t('offlineOyna.matn')}
        </p>
        {hamonYoq && (
          <p className="mt-2 text-sm font-medium text-danger">
            {t('offlineOyna.hamonYoq')}
          </p>
        )}

        <div className="mt-7 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={offlineOynasiniYop}
            className="rounded-xl border border-border-subtle px-5 py-3 text-base font-medium text-text-strong transition hover:bg-surface-muted"
          >
            {t('offlineOyna.tushunarli')}
          </button>
          <button
            type="button"
            onClick={qaytaTekshir}
            disabled={tekshirilmoqda}
            className="rounded-xl bg-brand-primary px-5 py-3 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {t('offlineOyna.qaytaTekshirish')}
          </button>
        </div>

        {PLAY_STORE_HAVOLASI && (
          <a
            href={PLAY_STORE_HAVOLASI}
            target="_blank"
            rel="noreferrer"
            className="mt-5 text-sm font-medium text-brand-onsoft underline"
          >
            {t('offlineOyna.ilovaniYukla')}
          </a>
        )}
      </div>
    </Oyna>
  )
}
