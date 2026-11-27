'use client'

import { useEffect, useRef } from 'react'

/**
 * Android'ning apparat "orqaga" tugmasi uchun ochiq qatlamlar stegi
 * (oyna, ochiluvchi menyu, tanlagich).
 *
 * Muammo: oyna ochiq turganda "orqaga" bosilsa, `NativeBootstrap`
 * sahifa tarixiga qaytar yoki tarix bo'sh bo'lsa ILOVANI YOPAR edi —
 * yozilgan matn ham yo'qolardi. Odam esa bu tugmadan faqat oynani
 * yopishni kutadi. Endi eng tepadagi ochiq qatlam birinchi yopiladi.
 */
const stek: Array<{ current: () => void }> = []

/** Eng tepadagi qatlamni yopadi. Yopadigan narsa bo'lsa `true`. */
export function orqagaQatlamniYop(): boolean {
  const eng = stek[stek.length - 1]
  if (!eng) return false
  eng.current()
  return true
}

/** `ochiq` bo'lgan paytda "orqaga" tugmasi `yop` ni chaqiradi */
export function useOrqagaYopish(ochiq: boolean, yop: () => void) {
  const ref = useRef(yop)
  ref.current = yop

  useEffect(() => {
    if (!ochiq) return
    const yozuv = ref
    stek.push(yozuv)
    return () => {
      const i = stek.lastIndexOf(yozuv)
      if (i !== -1) stek.splice(i, 1)
    }
  }, [ochiq])
}
