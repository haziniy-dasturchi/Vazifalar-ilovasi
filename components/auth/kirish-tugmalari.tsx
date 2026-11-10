'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'

/**
 * Apple bilan kirish YOQILGANMI.
 *
 * Bu tugma Apple Developer Program a'zoligisiz ishlamaydi: Apple
 * tomonida Service ID, kalit va domen tasdiqlanishi kerak, so'ng
 * Supabase'da provayder yoqiladi. Shu sozlamalar qilinmaguncha
 * tugma bosilsa xato chiqadi — shuning uchun u standart holatda
 * YASHIRIN. Sozlagandan keyin Vercel'da NEXT_PUBLIC_APPLE_KIRISH=1
 * qo'yilsa, tugma paydo bo'ladi.
 *
 * Batafsil: docs/apple-kirish.md
 */
const APPLE_YOQILGAN = process.env.NEXT_PUBLIC_APPLE_KIRISH === '1'

function GoogleBelgi() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  )
}

function AppleBelgi() {
  return (
    <svg className="size-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M16.37 1.43c0 1.14-.47 2.26-1.24 3.08-.83.89-2.18 1.57-3.3 1.48-.14-1.1.42-2.27 1.17-3.02.84-.86 2.3-1.5 3.37-1.54ZM20.9 17.17c-.55 1.27-.81 1.83-1.52 2.95-.99 1.56-2.38 3.5-4.1 3.52-1.53.01-1.92-.99-3.99-.98-2.07.01-2.5.99-4.03.97-1.72-.02-3.04-1.78-4.03-3.33-2.77-4.35-3.06-9.45-1.35-12.17 1.21-1.93 3.12-3.06 4.92-3.06 1.83 0 2.98 1 4.49 1 1.47 0 2.36-1 4.48-1 1.6 0 3.3.87 4.51 2.38-3.97 2.17-3.33 7.83.62 9.72Z"
      />
    </svg>
  )
}

type Provayder = 'google' | 'apple'

export function KirishTugmalari({ keyin }: { keyin?: string }) {
  // Qaysi tugma bosilgani — ikkalasini birdan bloklamaslik uchun
  const [band, setBand] = useState<Provayder | null>(null)
  const { korsat } = useToast()

  async function kirish(provayder: Provayder) {
    if (band) return
    setBand(provayder)
    try {
      const supabase = createClient()
      const manzil = new URL('/auth/callback', window.location.origin)
      if (keyin) manzil.searchParams.set('keyin', keyin)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provayder,
        options: {
          redirectTo: manzil.toString(),
          // Google'da hisob tanlash oynasi majburan ochiladi; Apple'da
          // bunday parametr yo'q va berilsa xatoga olib keladi
          ...(provayder === 'google'
            ? { queryParams: { prompt: 'select_account' } }
            : {}),
        },
      })

      if (error) throw error
      // Muvaffaqiyatli bo'lsa brauzer provayder sahifasiga o'tadi
    } catch {
      setBand(null)
      korsat({
        matn: 'Kirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.',
        tone: 'xato',
      })
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => kirish('google')}
        disabled={band !== null}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-surface px-6 py-4 text-base font-semibold text-text-strong shadow-card transition hover:bg-surface-muted active:scale-[0.99] disabled:opacity-60"
      >
        {band === 'google' ? (
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <GoogleBelgi />
        )}
        {band === 'google' ? 'Ochilmoqda…' : 'Google bilan davom etish'}
      </button>

      {APPLE_YOQILGAN && (
        <button
          type="button"
          onClick={() => kirish('apple')}
          disabled={band !== null}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-black px-6 py-4 text-base font-semibold text-white shadow-card transition hover:bg-neutral-800 active:scale-[0.99] disabled:opacity-60"
        >
          {band === 'apple' ? (
            <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
          ) : (
            <AppleBelgi />
          )}
          {band === 'apple' ? 'Ochilmoqda…' : 'Apple bilan davom etish'}
        </button>
      )}
    </div>
  )
}
