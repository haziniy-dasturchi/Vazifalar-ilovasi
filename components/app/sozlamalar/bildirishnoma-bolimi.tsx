'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, TriangleAlert } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import {
  bildirishnomaHolati,
  bildirishnomaniOchirish,
  bildirishnomaniYoqish,
  type BildirishnomaHolati,
} from '@/lib/bildirishnoma'

export function BildirishnomaBolimi() {
  const [holat, setHolat] = useState<BildirishnomaHolati | null>(null)
  const [band, setBand] = useState(false)
  const { korsat } = useToast()
  const t = useT()

  useEffect(() => {
    bildirishnomaHolati().then(setHolat)
  }, [])

  const yoqilgan = holat === 'yoqilgan'
  const radEtilgan = holat === 'rad-etilgan'
  const qollamaydi = holat === 'qollab-quvvatlanmaydi'

  async function almashtir() {
    if (band || radEtilgan || qollamaydi) return
    setBand(true)
    try {
      const yangi = yoqilgan
        ? await bildirishnomaniOchirish()
        : await bildirishnomaniYoqish()
      setHolat(yangi)

      if (yangi === 'yoqilgan') {
        korsat({
          matn: t('sozlamalar.bildirishnoma.yoqildi'),
          tone: 'muvaffaqiyat',
        })
      } else if (yangi === 'rad-etilgan') {
        korsat({ matn: t('sozlamalar.bildirishnoma.ruxsatYoq'), tone: 'xato' })
      } else if (yoqilgan) {
        korsat({
          matn: t('sozlamalar.bildirishnoma.ochirildi'),
          tone: 'muvaffaqiyat',
        })
      }
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    } finally {
      setBand(false)
    }
  }

  if (holat === null) {
    return <div className="h-28 animate-pulse rounded-2xl bg-surface-sunken" />
  }

  const tavsif = qollamaydi
    ? t('sozlamalar.bildirishnoma.qollamaydi')
    : radEtilgan
      ? t('sozlamalar.bildirishnoma.radEtilgan')
      : yoqilgan
        ? t('sozlamalar.bildirishnoma.yoqilgan')
        : t('sozlamalar.bildirishnoma.ochiq')

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-surface p-4 shadow-card md:p-5">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
            {yoqilgan ? (
              <Bell className="size-5 text-brand-onsoft" aria-hidden />
            ) : (
              <BellOff className="size-5 text-text-faint" aria-hidden />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-text-strong">
              {t('sozlamalar.bildirishnoma.sarlavha')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              {tavsif}
            </p>
          </div>

          {!radEtilgan && !qollamaydi && (
            <button
              type="button"
              onClick={almashtir}
              disabled={band}
              role="switch"
              aria-checked={yoqilgan}
              aria-label={t('sozlamalar.bildirishnoma.sarlavha')}
              className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
                yoqilgan ? 'bg-brand-primary' : 'bg-surface-sunken'
              }`}
              style={{ minHeight: 0 }}
            >
              <span
                className={`absolute top-1 size-5 rounded-full bg-white shadow-card transition-all ${
                  yoqilgan ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/*
        Nega "sukut bo'yicha yoniq" deb yozilmagan: brauzer push
        ruxsatini hech qachon so'ramasdan bermaydi — bu uning xavfsizlik
        qoidasi va uni ilova aylanib o'ta olmaydi. Shuning uchun halol
        yo'l: eslatmalarni tavsiya etilgan holat sifatida ko'rsatib,
        ruxsatni bir bosishda so'rash.
      */}
      {!yoqilgan && !radEtilgan && !qollamaydi && (
        <SozlamaKartasi
          sarlavha={t('sozlamalar.bildirishnoma.tavsiya')}
          tavsif={t('sozlamalar.bildirishnoma.tavsiyaMatn')}
        />
      )}

      {radEtilgan && (
        <div className="flex gap-3 rounded-2xl border border-danger/35 bg-danger-soft p-4">
          <TriangleAlert className="size-5 shrink-0 text-danger" aria-hidden />
          <p className="text-sm leading-relaxed text-danger">
            {t('sozlamalar.bildirishnoma.qaytarish')}
          </p>
        </div>
      )}
    </div>
  )
}
