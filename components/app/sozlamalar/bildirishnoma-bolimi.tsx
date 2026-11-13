'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, TriangleAlert } from 'lucide-react'
import { SozlamaKartasi } from './karta'
import { useToast } from '@/components/ui/toast'
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
        korsat({ matn: 'Bildirishnoma yoqildi', tone: 'muvaffaqiyat' })
      } else if (yangi === 'rad-etilgan') {
        korsat({
          matn: 'Brauzer ruxsat bermadi. Sozlamalardan yoqing.',
          tone: 'xato',
        })
      } else if (yoqilgan) {
        korsat({ matn: 'Bildirishnoma o‘chirildi', tone: 'muvaffaqiyat' })
      }
    } catch {
      korsat({ matn: 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
    } finally {
      setBand(false)
    }
  }

  if (holat === null) {
    return (
      <div className="h-28 animate-pulse rounded-2xl bg-surface-sunken" />
    )
  }

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
              Vazifa eslatmalari
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              {qollamaydi
                ? 'Bu brauzer bildirishnomani qo‘llab-quvvatlamaydi.'
                : radEtilgan
                  ? 'Brauzer sozlamalarida ruxsat berilmagan.'
                  : yoqilgan
                    ? 'Vaqti belgilangan vazifalar haqida eslatib turamiz — ilova yopiq bo‘lsa ham.'
                    : 'Vaqti belgilangan vazifalar haqida eslatma olish uchun yoqing.'}
            </p>
          </div>

          {!radEtilgan && !qollamaydi && (
            <button
              type="button"
              onClick={almashtir}
              disabled={band}
              role="switch"
              aria-checked={yoqilgan}
              aria-label="Vazifa eslatmalari"
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
          sarlavha="Tavsiya etiladi"
          tavsif="Eslatmalarsiz vaqti belgilangan vazifalar e'tibordan chetda qolishi mumkin. Yoqish uchun brauzer bir marta ruxsat so‘raydi."
        />
      )}

      {radEtilgan && (
        <div className="flex gap-3 rounded-2xl border border-danger/35 bg-danger-soft p-4">
          <TriangleAlert className="size-5 shrink-0 text-danger" aria-hidden />
          <p className="text-sm leading-relaxed text-danger">
            Ruxsatni qaytarish uchun brauzer manzil qatoridagi qulf belgisini
            bosing va «Bildirishnomalar» ni ruxsat etilgan holatga o‘tkazing.
          </p>
        </div>
      )}
    </div>
  )
}
