'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'

export type TanlovVarianti = {
  qiymat: string
  nom: string
  /** Nom yonida ko'rinadigan rangli nuqta (papka rangi kabi) */
  rang?: string
  /** Nomning o'ng tomonidagi qo'shimcha izoh */
  izoh?: string
}

const CHEKKA = 8

/**
 * Brend uslubidagi tanlash ro'yxati — brauzerning standart <select>
 * o'rniga. Standart select'ning ko'rinishini (ayniqsa ochilgan
 * ro'yxatini) CSS bilan boshqarib bo'lmaydi, shu sababli u ilova
 * ranglariga mos tushmasdi.
 *
 * Ro'yxat portal orqali <body> ga chiqariladi — shunda modal oynaning
 * overflow/scroll konteyneri uni qirqib qo'ymaydi.
 */
export function Tanlagich({
  qiymat,
  variantlar,
  onChange,
  ariaLabel,
  placeholder = 'Tanlang',
}: {
  qiymat: string
  variantlar: TanlovVarianti[]
  onChange: (qiymat: string) => void
  ariaLabel: string
  placeholder?: string
}) {
  const [ochiq, setOchiq] = useState(false)
  const [koord, setKoord] = useState<{
    top: number
    left: number
    width: number
  } | null>(null)
  const tugmaRef = useRef<HTMLButtonElement>(null)

  const tanlangan = variantlar.find((v) => v.qiymat === qiymat)

  function joylashuvniHisobla() {
    const rect = tugmaRef.current?.getBoundingClientRect()
    if (!rect) return

    // Ro'yxat balandligi: variantlar soniga qarab, lekin 280px dan oshmaydi
    const taxminiyBalandlik = Math.min(variantlar.length * 44 + 8, 280)
    const pastdaJoyBor =
      rect.bottom + taxminiyBalandlik + CHEKKA < window.innerHeight

    setKoord({
      top: pastdaJoyBor
        ? rect.bottom + 4
        : Math.max(CHEKKA, rect.top - taxminiyBalandlik - 4),
      left: rect.left,
      width: rect.width,
    })
  }

  function ochish() {
    joylashuvniHisobla()
    setOchiq(true)
  }

  useEffect(() => {
    if (!ochiq) return

    function qayta() {
      joylashuvniHisobla()
    }
    function klavisha(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOchiq(false)
      }
    }

    window.addEventListener('resize', qayta)
    document.addEventListener('scroll', qayta, true)
    // capture: modal o'zining Escape ishlovchisidan oldin ushlaymiz
    document.addEventListener('keydown', klavisha, true)

    return () => {
      window.removeEventListener('resize', qayta)
      document.removeEventListener('scroll', qayta, true)
      document.removeEventListener('keydown', klavisha, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ochiq, variantlar.length])

  return (
    <>
      <button
        ref={tugmaRef}
        type="button"
        onClick={() => (ochiq ? setOchiq(false) : ochish())}
        aria-haspopup="listbox"
        aria-expanded={ochiq}
        aria-label={ariaLabel}
        className={`flex min-h-touch w-full items-center gap-2 rounded-xl border bg-surface px-4 py-3 text-left text-base transition ${
          ochiq
            ? 'border-brand-primary'
            : 'border-border-subtle hover:bg-surface-muted'
        }`}
      >
        {tanlangan?.rang && (
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: tanlangan.rang }}
            aria-hidden
          />
        )}
        <span
          className={`flex-1 truncate ${
            tanlangan ? 'text-text-strong' : 'text-text-faint'
          }`}
        >
          {tanlangan?.nom ?? placeholder}
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-text-faint transition ${
            ochiq ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      {ochiq &&
        koord &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Yopish"
              onClick={() => setOchiq(false)}
              className="fixed inset-0 z-[110] min-h-0 cursor-default"
            />
            <ul
              role="listbox"
              aria-label={ariaLabel}
              style={{
                top: koord.top,
                left: koord.left,
                width: koord.width,
              }}
              className="fixed z-[120] max-h-[280px] overflow-y-auto rounded-xl border border-border-subtle bg-surface p-1 shadow-float"
            >
              {variantlar.map((v) => {
                const faol = v.qiymat === qiymat
                return (
                  <li key={v.qiymat}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={faol}
                      onClick={() => {
                        onChange(v.qiymat)
                        setOchiq(false)
                      }}
                      className={`flex min-h-0 w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                        faol
                          ? 'bg-brand-soft font-medium text-brand-primary'
                          : 'text-text-strong hover:bg-surface-muted'
                      }`}
                    >
                      {v.rang && (
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: v.rang }}
                          aria-hidden
                        />
                      )}
                      <span className="flex-1 truncate">{v.nom}</span>
                      {v.izoh && (
                        <span className="shrink-0 text-xs text-text-faint">
                          {v.izoh}
                        </span>
                      )}
                      {faol && (
                        <Check
                          className="size-4 shrink-0 text-brand-primary"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>,
          document.body
        )}
    </>
  )
}
