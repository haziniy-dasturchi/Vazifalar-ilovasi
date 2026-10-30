'use client'

import { useEffect } from 'react'
import { TriangleAlert } from 'lucide-react'

export default function Xato({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-red-50">
        <TriangleAlert className="size-8 text-red-600" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-text-strong">
        Nimadir noto‘g‘ri ketdi
      </h1>
      <p className="mt-2 max-w-sm text-base text-text-muted">
        Sahifani qayta yuklashga urinib ko‘ring. Muammo takrorlansa, biroz
        kutib turing.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
      >
        Qayta urinish
      </button>
    </main>
  )
}
