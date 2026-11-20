'use client'

import { useEffect, useState } from 'react'
import { TriangleAlert } from 'lucide-react'
import { del } from 'idb-keyval'

/** `app/providers.tsx` dagi bilan bir xil bo'lishi SHART */
const SAQLAGICH_KALITI = 'samara-query-cache'

export default function Xato({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [tozalanmoqda, setTozalanmoqda] = useState(false)

  useEffect(() => {
    console.error(error)
  }, [error])

  /**
   * Oxirgi chora: qurilmada saqlangan nusxani o'chirib, ilovani
   * noldan ochish.
   *
   * Nega kerak bo'ldi: saqlangan kesh buzuq bo'lsa (masalan eski
   * versiya noto'g'ri shaklda yozib qo'ygan bo'lsa), "Qayta
   * urinish" foyda bermaydi — har safar o'sha buzuq nusxa
   * tiklanaveradi va odam boshi berk ko'chaga kirib qoladi.
   *
   * Yo'qotiladigan narsa yo'q: kesh shunchaki serverdagi
   * ma'lumotning nusxasi, u qaytadan yuklanadi. YUBORILMAGAN
   * o'zgarishlar ham shu yerda tursa-da, bu tugma faqat ilova
   * umuman ochilmay qolganda bosiladi.
   */
  async function tozalaVaOch() {
    setTozalanmoqda(true)
    try {
      await del(SAQLAGICH_KALITI)
    } catch {
      // Tozalab bo'lmasa ham qayta yuklashga urinamiz
    }
    window.location.reload()
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-danger-soft">
        <TriangleAlert className="size-8 text-danger" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-text-strong">
        Nimadir noto‘g‘ri ketdi
      </h1>
      <p className="mt-2 max-w-sm text-base text-text-muted">
        Avval qayta urinib ko‘ring. Yordam bermasa, qurilmada saqlangan
        nusxani tozalang — ma’lumotlaringiz serverda saqlanadi va
        qaytadan yuklanadi.
      </p>

      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
      >
        Qayta urinish
      </button>

      <button
        type="button"
        onClick={tozalaVaOch}
        disabled={tozalanmoqda}
        className="mt-3 rounded-xl border border-border-subtle px-6 py-3 text-base font-medium text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
      >
        {tozalanmoqda ? 'Tozalanmoqda…' : 'Tozalab, qaytadan ochish'}
      </button>
    </main>
  )
}
