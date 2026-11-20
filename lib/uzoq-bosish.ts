'use client'

import { useRef } from 'react'

/**
 * "Bosib turish" (long press) — telefonda tanlashni boshlash uchun.
 *
 * Nega kerak: telefonda har kartaning oldida turadigan katakcha
 * ro'yxatni xunuk qiladi va joy egallaydi. Telegram, Gmail va
 * Fotosuratlar ilovalarida bu masala bir xil hal qilingan: odam
 * kartani bosib turadi, tanlash rejimi ochiladi, keyin qolganlari
 * oddiy bosish bilan belgilanadi. Katakcha faqat kompyuterda
 * ko'rinadi — u yerda sichqoncha bor va "bosib turish" kutilmaydi.
 *
 * Uch nozik joy:
 *  1. Faqat BARMOQ uchun. Sichqonchada uzoq bosish hech narsa
 *     qilmaydi, aks holda matn belgilayotgan odam tasodifan
 *     tanlash rejimiga tushib qolardi.
 *  2. Barmoq sal surilsa — bekor qilinadi. Ro'yxatni aylantirish
 *     tanlashga aylanib ketmasligi kerak.
 *  3. Brauzerning o'z menyusi (nusxa olish) chiqmaydi — u
 *     tanlash rejimini to'sib qo'yardi.
 */
export function useUzoqBosish(bajar: () => void, kechikish = 450) {
  const vaqt = useRef<number | null>(null)
  const boshlanish = useRef<{ x: number; y: number } | null>(null)
  const barmoqmi = useRef(false)

  function tozala() {
    if (vaqt.current !== null) {
      window.clearTimeout(vaqt.current)
      vaqt.current = null
    }
    boshlanish.current = null
  }

  return {
    onPointerDown(e: React.PointerEvent) {
      barmoqmi.current = e.pointerType !== 'mouse'
      if (!barmoqmi.current) return
      boshlanish.current = { x: e.clientX, y: e.clientY }
      vaqt.current = window.setTimeout(() => {
        vaqt.current = null
        bajar()
      }, kechikish)
    },
    onPointerMove(e: React.PointerEvent) {
      const b = boshlanish.current
      if (!b) return
      // 10px — barmoq qimirlashi bilan aylantirish orasidagi chegara
      if (Math.abs(e.clientX - b.x) > 10 || Math.abs(e.clientY - b.y) > 10) {
        tozala()
      }
    },
    onPointerUp: tozala,
    onPointerCancel: tozala,
    onContextMenu(e: React.MouseEvent) {
      // Sichqonchaning o'ng tugmasiga tegmaymiz
      if (barmoqmi.current) e.preventDefault()
    },
  }
}
