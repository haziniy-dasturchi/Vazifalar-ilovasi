'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/toast'
import { Loader2 } from 'lucide-react'

/** Google'ning rasmiy ko'p rangli "G" belgisi */
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

export function GoogleTugma({ keyin }: { keyin?: string }) {
  const [yuklanmoqda, setYuklanmoqda] = useState(false)
  const { korsat } = useToast()

  async function kirish() {
    setYuklanmoqda(true)
    try {
      const supabase = createClient()
      const manzil = new URL('/auth/callback', window.location.origin)
      if (keyin) manzil.searchParams.set('keyin', keyin)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: manzil.toString(),
          queryParams: { prompt: 'select_account' },
        },
      })

      if (error) throw error
      // Muvaffaqiyatli bo'lsa brauzer Google'ga o'tadi
    } catch {
      setYuklanmoqda(false)
      korsat({
        matn: 'Kirib bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.',
        tone: 'xato',
      })
    }
  }

  return (
    <button
      type="button"
      onClick={kirish}
      disabled={yuklanmoqda}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-border-subtle bg-surface px-6 py-4 text-base font-semibold text-text-strong shadow-card transition hover:bg-surface-muted active:scale-[0.99] disabled:opacity-60"
    >
      {yuklanmoqda ? (
        <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden />
      ) : (
        <GoogleBelgi />
      )}
      {yuklanmoqda ? 'Ochilmoqda…' : 'Google bilan davom etish'}
    </button>
  )
}
