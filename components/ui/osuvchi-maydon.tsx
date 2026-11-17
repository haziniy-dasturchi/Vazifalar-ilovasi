'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * Matn uzunligiga qarab o'sib boradigan kiritish maydoni.
 *
 * Nega oddiy `<input>` emas: vazifa nomi ko'pincha bir qatorga
 * sig'maydi ("Sentrga borib printerga qora siyoh quydirishim kerak,
 * kitoblarni ..."). `<input>` da matnning faqat boshi ko'rinadi,
 * qolganini ko'rish uchun kursorni surib borish kerak — odam
 * yozganini bir ko'rishda tekshira olmaydi.
 *
 * `<textarea>` esa kerakli qadar o'sadi. Ikkita nozik joy bor:
 *
 *  1. Balandlik HAR o'zgarishda qayta hisoblanadi. Avval `auto`
 *     qilinadi — aks holda matn qisqarganda maydon katta bo'lib
 *     qolaveradi, chunki `scrollHeight` hech qachon kamaymaydi.
 *  2. `<textarea>` da Enter yangi qator qo'shadi va formani
 *     yubormaydi. Vazifa nomi esa bir qatorli, shuning uchun Enter
 *     yuborish uchun ishlatiladi (oldingi `<input>` dagi xatti-harakat
 *     saqlanadi). Shift+Enter ham yangi qator qo'shmaydi.
 */
export function OsuvchiMaydon({
  qiymat,
  onChange,
  onEnter,
  onEscape,
  placeholder,
  maxLength,
  autoFocus,
  ariaLabel,
  /** Shundan oshsa maydon o'smaydi va ichida suriladi */
  engKattaBalandlik = 200,
  className = '',
}: {
  qiymat: string
  onChange: (q: string) => void
  onEnter?: () => void
  onEscape?: () => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
  ariaLabel?: string
  engKattaBalandlik?: number
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, engKattaBalandlik)}px`
    el.style.overflowY = el.scrollHeight > engKattaBalandlik ? 'auto' : 'hidden'
  }, [qiymat, engKattaBalandlik])

  return (
    <textarea
      ref={ref}
      rows={1}
      value={qiymat}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          // Yangi qator kerak emas — nom bir qatorli
          e.preventDefault()
          onEnter?.()
        } else if (e.key === 'Escape' && onEscape) {
          e.preventDefault()
          onEscape()
        }
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      autoFocus={autoFocus}
      aria-label={ariaLabel}
      // `resize-none`: balandlikni kod boshqaradi, qo'lda sudrash
      // uni buzib qo'yardi
      className={`block w-full resize-none ${className}`}
    />
  )
}
