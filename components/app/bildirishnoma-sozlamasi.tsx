'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  bildirishnomaHolati,
  bildirishnomaniOchirish,
  bildirishnomaniYoqish,
  type BildirishnomaHolati,
} from '@/lib/bildirishnoma'

/**
 * Vaqtli vazifalar uchun bildirishnomani yoqish/o'chirish.
 *
 * Ruxsat faqat foydalanuvchi o'zi bosganda so'raladi — sahifa
 * ochilishi bilan so'rash brauzerlarda ham, odamlarda ham yomon
 * taassurot qoldiradi va ko'pincha butunlay rad etiladi.
 */
export function BildirishnomaSozlamasi() {
  const [holat, setHolat] = useState<BildirishnomaHolati | null>(null)
  const [band, setBand] = useState(false)
  const { korsat } = useToast()

  useEffect(() => {
    bildirishnomaHolati().then(setHolat)
  }, [])

  // Holat aniqlanmaguncha joy egallab turmasin
  if (holat === null || holat === 'qollab-quvvatlanmaydi') return null

  const yoqilgan = holat === 'yoqilgan'
  const radEtilgan = holat === 'rad-etilgan'

  async function almashtir() {
    if (band || radEtilgan) return
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

  return (
    <div className="flex items-start gap-4 rounded-2xl bg-surface p-4 shadow-card">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
        {yoqilgan ? (
          <Bell className="size-5 text-brand-onsoft" aria-hidden />
        ) : (
          <BellOff className="size-5 text-text-faint" aria-hidden />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-strong">Bildirishnoma</p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          {radEtilgan
            ? 'Brauzer sozlamalarida ruxsat berilmagan. Ilova sozlamalaridan ruxsat bering.'
            : yoqilgan
              ? 'Vaqti belgilangan vazifalar haqida eslatib turamiz — ilova yopiq bo‘lsa ham.'
              : 'Vaqti belgilangan vazifalar haqida eslatma olish uchun yoqing.'}
        </p>
      </div>

      {!radEtilgan && (
        <button
          type="button"
          onClick={almashtir}
          disabled={band}
          aria-pressed={yoqilgan}
          className={`min-h-touch shrink-0 rounded-xl px-4 text-sm font-semibold transition disabled:opacity-50 ${
            yoqilgan
              ? 'border border-border-subtle text-text-strong hover:bg-surface-muted'
              : 'bg-brand-primary text-white hover:bg-brand-primary-hover'
          }`}
        >
          {band ? '…' : yoqilgan ? 'O‘chirish' : 'Yoqish'}
        </button>
      )}
    </div>
  )
}
