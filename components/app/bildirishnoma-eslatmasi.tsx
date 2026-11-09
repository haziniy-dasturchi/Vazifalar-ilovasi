'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bell, X } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import {
  bildirishnomaHolati,
  bildirishnomaniYoqish,
} from '@/lib/bildirishnoma'

/** Oxirgi marta qachon ko'rsatilgani (millisekund) */
const KALIT = 'samara-bildirishnoma-eslatmasi'

/** Ikki ko'rsatish orasidagi eng kam muddat — 3 kun */
const ORALIQ = 3 * 24 * 60 * 60 * 1000

/** Sahifa ochilgandan keyin shuncha kutib turadi */
const KECHIKISH = 8000

/** Eslatma chiqmaydigan sahifalar */
const CHETLAB = ['/kirish', '/auth']

/**
 * Bildirishnomani hali yoqmaganlarga vaqti-vaqti bilan eslatib turadi.
 *
 * Nega modal emas, pastki lenta: har kirganda yo'lni to'sadigan oyna
 * g'ashga tegadi va odam o'ylamasdan "yopish"ni bosadigan bo'lib
 * qoladi — natijada taklif umuman ishlamay qoladi. Lenta esa ishga
 * xalaqit bermaydi.
 *
 * Shuningdek, u sahifa ochilishi bilan emas, bir oz kutib chiqadi:
 * ilova endigina ochilganda odam o'z ishi bilan band bo'ladi.
 */
export function BildirishnomaEslatmasi() {
  const [korsat, setKorsat] = useState(false)
  const [band, setBand] = useState(false)
  const pathname = usePathname()
  const { korsat: toast } = useToast()

  const chetlabOtilsin = CHETLAB.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  useEffect(() => {
    if (chetlabOtilsin) return

    let bekor = false
    const taymer = setTimeout(async () => {
      // Faqat yoqish mumkin bo'lganlarga: qo'llab-quvvatlamaydigan
      // yoki brauzer sozlamasida rad etilgan holatda eslatish befoyda
      const holat = await bildirishnomaHolati()
      if (bekor || holat !== 'yoqilmagan') return

      const oxirgi = Number(localStorage.getItem(KALIT) ?? 0)
      if (Date.now() - oxirgi < ORALIQ) return

      setKorsat(true)
    }, KECHIKISH)

    return () => {
      bekor = true
      clearTimeout(taymer)
    }
  }, [chetlabOtilsin, pathname])

  function keyinroq() {
    // Vaqtni belgilaymiz — keyingi eslatma 3 kundan keyin
    localStorage.setItem(KALIT, String(Date.now()))
    setKorsat(false)
  }

  async function yoq() {
    if (band) return
    setBand(true)
    try {
      const yangi = await bildirishnomaniYoqish()
      localStorage.setItem(KALIT, String(Date.now()))
      setKorsat(false)

      if (yangi === 'yoqilgan') {
        toast({ matn: 'Bildirishnoma yoqildi', tone: 'muvaffaqiyat' })
      } else if (yangi === 'rad-etilgan') {
        toast({
          matn: 'Brauzer ruxsat bermadi. Sozlamalardan yoqing.',
          tone: 'xato',
        })
      }
    } catch {
      toast({ matn: 'Bajarib bo‘lmadi. Qayta urinib ko‘ring.', tone: 'xato' })
      keyinroq()
    } finally {
      setBand(false)
    }
  }

  if (!korsat) return null

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-border-subtle bg-surface p-4 shadow-float sm:left-auto sm:right-4 sm:mx-0"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
        <Bell className="size-5 text-brand-primary" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text-strong">Eslatmani yoqasizmi?</p>
        <p className="mt-1 text-sm leading-relaxed text-text-muted">
          Vaqti belgilangan vazifalar haqida eslatib turamiz — ilova yopiq
          bo‘lsa ham.
        </p>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={yoq}
            disabled={band}
            className="min-h-touch rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-50"
          >
            {band ? '…' : 'Yoqish'}
          </button>
          <button
            type="button"
            onClick={keyinroq}
            className="min-h-touch rounded-xl px-3 text-sm font-medium text-text-muted transition hover:bg-surface-muted"
          >
            Keyinroq
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={keyinroq}
        aria-label="Yopish"
        className="-mt-1 -mr-1 flex size-8 min-h-0 shrink-0 items-center justify-center rounded-lg text-text-faint transition hover:bg-surface-muted"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
