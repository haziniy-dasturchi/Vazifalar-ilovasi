'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

type ToastTone = 'xato' | 'muvaffaqiyat' | 'xabar'

type Toast = {
  id: number
  matn: string
  tone: ToastTone
  /** Ixtiyoriy harakat tugmasi, masalan "Bekor qilish" */
  harakat?: { matn: string; bajar: () => void }
  muddat: number
}

type ToastInput = Omit<Toast, 'id' | 'tone' | 'muddat'> & {
  tone?: ToastTone
  muddat?: number
}

const ToastContext = createContext<{
  korsat: (t: ToastInput) => number
  yop: (id: number) => void
} | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast faqat ToastProvider ichida ishlaydi')
  return ctx
}

const ICONS: Record<ToastTone, typeof Info> = {
  xato: CircleAlert,
  muvaffaqiyat: CircleCheck,
  xabar: Info,
}

const TONE_CLASS: Record<ToastTone, string> = {
  xato: 'bg-red-600 text-white',
  muvaffaqiyat: 'bg-brand-primary text-white',
  xabar: 'bg-brand-ink text-white',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const yop = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((list) => list.filter((t) => t.id !== id))
  }, [])

  const korsat = useCallback(
    (input: ToastInput) => {
      const id = nextId.current++
      const toast: Toast = {
        id,
        matn: input.matn,
        tone: input.tone ?? 'xabar',
        harakat: input.harakat,
        muddat: input.muddat ?? 4000,
      }
      setToasts((list) => [...list, toast])
      timers.current.set(
        id,
        setTimeout(() => yop(id), toast.muddat)
      )
      return id
    },
    [yop]
  )

  const value = useMemo(() => ({ korsat, yop }), [korsat, yop])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-100 flex flex-col items-center gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] md:items-end md:p-6"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.tone]
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl px-4 py-3 shadow-float ${TONE_CLASS[t.tone]}`}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              <p className="flex-1 text-sm leading-snug">{t.matn}</p>
              {t.harakat && (
                <button
                  type="button"
                  onClick={() => {
                    t.harakat?.bajar()
                    yop(t.id)
                  }}
                  className="shrink-0 rounded-lg px-3 py-1 text-sm font-semibold underline underline-offset-2"
                >
                  {t.harakat.matn}
                </button>
              )}
              <button
                type="button"
                onClick={() => yop(t.id)}
                aria-label="Yopish"
                className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
