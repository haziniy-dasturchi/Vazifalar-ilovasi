'use client'

import { useEffect, useState } from 'react'
import { onlineManager } from '@tanstack/react-query'
import { CloudOff } from 'lucide-react'

/**
 * Internet yo'qolganda yuqorida ingichka chiziq chiqadi.
 *
 * Muhim: bu shunchaki ogohlantirish emas — foydalanuvchi ilova
 * ishlayotganini, yozganlari yo'qolmasligini bilib turishi kerak,
 * aks holda ishonchni yo'qotadi va ilovani tashlab ketadi.
 */
export function OfflineBelgisi() {
  const [onlayn, setOnlayn] = useState(true)

  useEffect(() => {
    setOnlayn(onlineManager.isOnline())
    return onlineManager.subscribe((holat) => setOnlayn(holat))
  }, [])

  if (onlayn) return null

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-brand-ink px-4 py-1.5 text-xs font-medium text-white"
    >
      <CloudOff className="size-3.5 shrink-0" aria-hidden />
      Internet yo‘q — ishlashda davom eting, aloqa tiklanganda saqlanadi
    </div>
  )
}
