'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

/**
 * Bir nechta oyna ustma-ust ochilishi mumkin (masalan vazifani
 * tahrirlash oynasi ustida o'chirishni tasdiqlash). Escape bosilganda
 * faqat eng tepadagi oyna yopilishi uchun umumiy stek.
 */
const ochiqOynalarStegi: symbol[] = []

/**
 * Oyna: telefonda pastdan chiqadi, kompyuterda markazda turadi.
 */
export function Oyna({
  sarlavha,
  tavsif,
  yop,
  children,
  kenglik = 'oddiy',
}: {
  sarlavha: string
  tavsif?: string
  yop: () => void
  children: React.ReactNode
  kenglik?: 'oddiy' | 'keng'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [id] = useState(() => Symbol('oyna'))

  useEffect(() => {
    ochiqOynalarStegi.push(id)
    return () => {
      const i = ochiqOynalarStegi.indexOf(id)
      if (i !== -1) ochiqOynalarStegi.splice(i, 1)
    }
  }, [id])

  // Escape bilan yopish (faqat eng tepadagi oyna uchun) va orqa fonni qotirish
  useEffect(() => {
    function klavisha(e: KeyboardEvent) {
      const engTepadagi = ochiqOynalarStegi[ochiqOynalarStegi.length - 1]
      if (e.key === 'Escape' && engTepadagi === id) yop()
    }
    document.addEventListener('keydown', klavisha)

    const oldingiOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Fokusni oyna ichiga olib kiramiz
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', klavisha)
      document.body.style.overflow = oldingiOverflow
    }
  }, [yop, id])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Yopish"
        onClick={yop}
        className="absolute inset-0 min-h-0 cursor-default bg-brand-ink/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={sarlavha}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-float outline-none sm:rounded-3xl ${
          kenglik === 'keng' ? 'sm:max-w-2xl' : 'sm:max-w-md'
        }`}
      >
        {/* Telefonda sudrash uchun chiziqcha */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-surface-sunken sm:hidden" />

        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-1">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text-strong">{sarlavha}</h2>
            {tavsif && (
              <p className="mt-1 text-sm text-text-muted">{tavsif}</p>
            )}
          </div>
          <button
            type="button"
            onClick={yop}
            aria-label="Yopish"
            className="-mt-1 -mr-2 flex size-10 min-h-0 shrink-0 items-center justify-center rounded-xl text-text-faint transition hover:bg-surface-muted hover:text-text-strong"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  )
}
