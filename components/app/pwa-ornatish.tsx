'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'

/** Standart DOM tiplarida hali yo'q (yangi, tajribaviy brauzer hodisasi) */
interface OrnatishTaklifi extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/** Faqat shu sessiya (vkladka) davomida yashirish — keyingi tashrifda qayta chiqadi */
const YOPILDI_KALITI = 'vazifalar-ornatish-yopildi'

function ornatilganmi(): boolean {
  const standalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    typeof navigator !== 'undefined' &&
    (navigator as unknown as { standalone?: boolean }).standalone === true
  return standalone || iosStandalone
}

function iosMi(): boolean {
  return typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * Ilovani o'rnatishga doimiy taklif qiluvchi banner.
 *
 * Har safar ilova ochilganda (o'rnatilmagan bo'lsa) qayta chiqadi —
 * faqat shu sessiya uchun yopib qo'yish mumkin, butunlay o'chirib
 * bo'lmaydi. iOS'da "beforeinstallprompt" hodisasi umuman yo'qligi
 * sababli, o'rniga qo'lda qo'shish yo'riqnomasi ko'rsatiladi.
 */
export function PwaOrnatish() {
  const [korsat, setKorsat] = useState(false)
  const [iosKorinish, setIosKorinish] = useState(false)
  const [taklif, setTaklif] = useState<OrnatishTaklifi | null>(null)
  const [ornatilmoqda, setOrnatilmoqda] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ro'yxatdan o'tmasa ham ilova ishlayveradi — faqat o'rnatish
        // taklifi chiqmasligi mumkin
      })
    }

    if (ornatilganmi()) return
    if (sessionStorage.getItem(YOPILDI_KALITI)) return

    if (iosMi()) {
      setIosKorinish(true)
      setKorsat(true)
      return
    }

    function tayyor(e: Event) {
      e.preventDefault()
      setTaklif(e as OrnatishTaklifi)
      setKorsat(true)
    }
    function ornatildi() {
      setKorsat(false)
      setTaklif(null)
    }

    window.addEventListener('beforeinstallprompt', tayyor)
    window.addEventListener('appinstalled', ornatildi)

    return () => {
      window.removeEventListener('beforeinstallprompt', tayyor)
      window.removeEventListener('appinstalled', ornatildi)
    }
  }, [])

  function yopish() {
    sessionStorage.setItem(YOPILDI_KALITI, '1')
    setKorsat(false)
  }

  async function ornat() {
    if (!taklif) return
    setOrnatilmoqda(true)
    try {
      await taklif.prompt()
      await taklif.userChoice
    } finally {
      setOrnatilmoqda(false)
      setTaklif(null)
      setKorsat(false)
    }
  }

  if (!korsat) return null

  return (
    <div className="sticky top-0 z-50 flex items-center gap-3 bg-brand-primary px-4 py-2 text-white">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
        {iosKorinish ? (
          <Share className="size-5" aria-hidden />
        ) : (
          <Download className="size-5" aria-hidden />
        )}
      </span>

      <div className="min-w-0 flex-1 py-1">
        <p className="text-sm leading-tight font-semibold">Ilovani o‘rnating</p>
        <p className="truncate text-xs text-white/80">
          {iosKorinish
            ? 'Ulashish tugmasidan foydalanib, Bosh ekranga qo‘shing'
            : 'Tezroq ishlaydi, asosiy ekrandan bitta bosish bilan ochiladi'}
        </p>
      </div>

      {!iosKorinish && (
        <button
          type="button"
          onClick={ornat}
          disabled={ornatilmoqda}
          className="flex min-h-touch shrink-0 items-center rounded-xl bg-white px-4 text-sm font-semibold text-brand-primary transition hover:bg-white/90 disabled:opacity-60"
        >
          {ornatilmoqda ? '…' : 'O‘rnatish'}
        </button>
      )}

      <button
        type="button"
        onClick={yopish}
        aria-label="Yopish"
        className="flex size-11 min-h-0 shrink-0 items-center justify-center rounded-xl text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}
