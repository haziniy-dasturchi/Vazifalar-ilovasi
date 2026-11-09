'use client'

import { useEffect, useState } from 'react'
import { Download, Share } from 'lucide-react'
import { Oyna } from '@/components/ui/oyna'

/** Standart DOM tiplarida hali yo'q (yangi, tajribaviy brauzer hodisasi) */
interface OrnatishTaklifi extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface Window {
    /** app/layout.tsx'dagi erta skript shu yerga saqlaydi */
    __samaraOrnatishTaklifi?: OrnatishTaklifi | null
  }
}

/** Faqat shu sessiya (vkladka) davomida yashirish — keyingi tashrifda qayta chiqadi */
const YOPILDI_KALITI = 'samara-ornatish-yopildi'

function ornatilganmi(): boolean {
  const standalone =
    typeof window !== 'undefined' &&
    window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    typeof navigator !== 'undefined' &&
    (navigator as unknown as { standalone?: boolean }).standalone === true
  return standalone || iosStandalone
}

/**
 * O'rnatish usuli brauzerga qarab butunlay boshqacha.
 *
 *   'avto'       — Chrome, Edge, Samsung...: brauzerning o'z taklifi
 *   'ios'        — iPhone/iPad: Ulashish -> Bosh ekranga qo'shish
 *   'mac-safari' — Mac Safari: Fayl -> Dockka qo'shish
 *
 * MUHIM: Safari'da (Mac'da ham, iPhone'da ham) `beforeinstallprompt`
 * hodisasi UMUMAN yo'q. Avval faqat iPhone alohida ko'rib chiqilardi,
 * natijada Mac Safari va iPad foydalanuvchilariga o'rnatish haqida
 * hech qanday taklif ko'rsatilmasdi — ular ilovani o'rnata olmasdi.
 */
type Usul = 'avto' | 'ios' | 'mac-safari'

function usulniAniqla(): Usul {
  const ua = navigator.userAgent

  // iPadOS 13+ o'zini "Macintosh" deb tanishtiradi — uni faqat
  // sensorli ekran borligi bilan haqiqiy Mac'dan ajratish mumkin
  const ipad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1
  if (/iPhone|iPad|iPod/i.test(ua) || ipad) return 'ios'

  // Chrome/Edge/Firefox ham UA'da "Safari" so'zini yozadi, shuning
  // uchun ularni alohida chiqarib tashlaymiz
  const safari = /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/i.test(ua)
  if (/Macintosh/.test(ua) && safari) return 'mac-safari'

  return 'avto'
}

const MATN: Record<Usul, string> = {
  ios: 'Pastdagi Ulashish tugmasini bosing va “Bosh ekranga qo‘shish” (Add to Home Screen) ni tanlang — ilova bosh ekraningizda paydo bo‘ladi.',
  'mac-safari':
    'Yuqoridagi menyudan Fayl → “Dockka qo‘shish” (File → Add to Dock) ni tanlang — Samara alohida ilova bo‘lib Dock’ingizda turadi.',
  avto: 'Bosh ekraningizga qo‘shib qo‘ying — tezroq ishlaydi va bitta bosish bilan ochiladi, xuddi oddiy ilova kabi.',
}

/**
 * Ilovani o'rnatishga taklif qiluvchi modal — telefonda ham,
 * kompyuterda ham, ilovaga kirishning o'zidayoq (o'rnatilmagan bo'lsa)
 * qalqib chiqadi. Faqat shu sessiya uchun yopib qo'yish mumkin.
 *
 * MUHIM: brauzerning haqiqiy o'rnatish taklifi (`beforeinstallprompt`)
 * sahifa yuklanishining ISTALGAN vaqtida kelishi mumkin — ko'pincha
 * bu komponent hali DOM'ga ulanmasdan oldin. Shu sababli uni bu yerda
 * emas, `app/layout.tsx`dagi React'dan OLDIN ishga tushadigan skriptda
 * ushlab olamiz; bu komponent faqat `window.__samaraOrnatishTaklifi`
 * orqali natijani o'qiydi.
 */
export function PwaOrnatish() {
  const [korsat, setKorsat] = useState(false)
  const [usul, setUsul] = useState<Usul>('avto')
  const [taklif, setTaklif] = useState<OrnatishTaklifi | null>(null)
  const [ornatilmoqda, setOrnatilmoqda] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ro'yxatdan o'tmasa ham ilova ishlayveradi
      })
    }

    if (ornatilganmi()) return
    if (sessionStorage.getItem(YOPILDI_KALITI)) return

    const aniqlangan = usulniAniqla()
    setUsul(aniqlangan)

    // Safari'da kutadigan hodisa yo'q — qo'llanmani darhol ko'rsatamiz
    if (aniqlangan !== 'avto') {
      setKorsat(true)
      return
    }

    // Hodisa biz ulanishimizdan OLDIN kelib, allaqachon saqlangan
    // bo'lishi mumkin — shu holatni birinchi tekshiramiz.
    if (window.__samaraOrnatishTaklifi) {
      setTaklif(window.__samaraOrnatishTaklifi)
      setKorsat(true)
    }

    function tayyor() {
      if (window.__samaraOrnatishTaklifi) {
        setTaklif(window.__samaraOrnatishTaklifi)
        setKorsat(true)
      }
    }
    // Zaxira: erta skript ishlamagan bo'lsa ham hodisa ushlanadi
    function tayyorZaxira(e: Event) {
      e.preventDefault()
      const t = e as OrnatishTaklifi
      window.__samaraOrnatishTaklifi = t
      setTaklif(t)
      setKorsat(true)
    }
    function ornatildi() {
      setKorsat(false)
      setTaklif(null)
    }

    window.addEventListener('samara:ornatish-tayyor', tayyor)
    window.addEventListener('samara:ornatildi', ornatildi)
    window.addEventListener('beforeinstallprompt', tayyorZaxira)
    window.addEventListener('appinstalled', ornatildi)

    return () => {
      window.removeEventListener('samara:ornatish-tayyor', tayyor)
      window.removeEventListener('samara:ornatildi', ornatildi)
      window.removeEventListener('beforeinstallprompt', tayyorZaxira)
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
      window.__samaraOrnatishTaklifi = null
      setKorsat(false)
    }
  }

  if (!korsat) return null

  const qollanma = usul !== 'avto'

  return (
    <Oyna sarlavha="Ilovani o‘rnating" yop={yopish}>
      <div className="flex flex-col items-center gap-4 pb-2 text-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-brand-soft">
          {qollanma ? (
            <Share className="size-7 text-brand-primary" aria-hidden />
          ) : (
            <Download className="size-7 text-brand-primary" aria-hidden />
          )}
        </span>

        <p className="text-base leading-relaxed text-text-muted">
          {MATN[usul]}
        </p>

        {qollanma ? (
          // Safari o'rnatishni dastur orqali boshlashga ruxsat bermaydi —
          // foydalanuvchi o'zi menyudan tanlashi kerak
          <p className="text-sm text-text-faint">
            O‘rnatgandan keyin ilova tezroq ochiladi va internetsiz ham
            ishlaydi.
          </p>
        ) : (
          <button
            type="button"
            onClick={ornat}
            disabled={ornatilmoqda || !taklif}
            className="min-h-touch w-full rounded-xl bg-brand-primary px-6 text-base font-semibold text-white transition hover:bg-brand-primary-hover disabled:opacity-60"
          >
            {ornatilmoqda ? 'Kuting…' : 'O‘rnatish'}
          </button>
        )}
      </div>
    </Oyna>
  )
}
