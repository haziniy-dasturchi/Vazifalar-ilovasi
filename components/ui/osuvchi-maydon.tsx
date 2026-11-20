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
 *     saqlanadi). Shift+Enter ham yangi qator qo'shmaydi — `kopQatorli`
 *     yoqilmagan bo'lsa.
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
  /**
   * Shift+Enter yangi qator ochadimi.
   *
   * Izoh maydoni uchun: oddiy Enter vazifani saqlaydi (nom maydoni
   * bilan bir xil, shunda odam qayerda turganini o'ylab o'tirmaydi),
   * yangi qator kerak bo'lsa — Shift+Enter.
   */
  kopQatorli = false,
  /**
   * Kalit so'zlarni belgilash uchun: maydonning o'ziga tashqaridan
   * murojaat, kursor o'rni va Backspace ni ushlab qolish.
   */
  maydonRef,
  onBosish,
  onOchirish,
  onSurilish,
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
  kopQatorli?: boolean
  maydonRef?: React.RefObject<HTMLTextAreaElement | null>
  /** Maydon bosilganda kursor o'rni bilan chaqiriladi */
  onBosish?: (kursor: number) => void
  /** Backspace: `true` qaytsa, belgi o'chirilmaydi (hodisa to'xtaydi) */
  onOchirish?: (kursor: number) => boolean
  /** Matn ichida surilganda — ustidagi belgilash qatlami uchun */
  onSurilish?: (yuqoridan: number) => void
  engKattaBalandlik?: number
  className?: string
}) {
  const ichkiRef = useRef<HTMLTextAreaElement>(null)
  const ref = maydonRef ?? ichkiRef

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
      onClick={(e) => onBosish?.(e.currentTarget.selectionStart)}
      onScroll={(e) => onSurilish?.(e.currentTarget.scrollTop)}
      onKeyDown={(e) => {
        if (
          e.key === 'Backspace' &&
          onOchirish &&
          e.currentTarget.selectionStart === e.currentTarget.selectionEnd &&
          onOchirish(e.currentTarget.selectionStart)
        ) {
          // Belgini bekor qilish o'chirish o'rniga: birinchi Backspace
          // belgilashni olib tashlaydi, matn joyida qoladi
          e.preventDefault()
          return
        }
        if (e.key === 'Enter') {
          // Shift+Enter — ko'p qatorli maydonda yangi qator ochadi,
          // shuning uchun brauzerning o'z ishiga tegmaymiz
          if (kopQatorli && e.shiftKey) return
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
