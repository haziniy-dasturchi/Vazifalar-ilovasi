'use client'

import { useEffect, useState } from 'react'
import { onlineManager, useMutationState } from '@tanstack/react-query'
import { CloudOff, RefreshCw, TriangleAlert } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'

/**
 * Yuqoridagi ingichka holat chizig'i.
 *
 * Uchta holat ko'rsatiladi:
 *   1. Internet yo'q — ishlashda davom etish mumkinligi;
 *   2. Navbatda turgan o'zgarishlar soni;
 *   3. Saqlanmagan o'zgarishlar (server rad etgan).
 *
 * Nega muhim: bu shunchaki ogohlantirish emas. Foydalanuvchi
 * yozganlari yo'qolmasligini KO'RIB turishi kerak, aks holda
 * ishonchni yo'qotadi va ilovani tashlab ketadi. "N ta o'zgarish
 * kutmoqda" degan aniq raqam "hammasi joyida" degan umumiy
 * so'zdan ko'ra ishonchliroq.
 */
export function OfflineBelgisi() {
  const t = useT()
  const [onlayn, setOnlayn] = useState(true)

  useEffect(() => {
    setOnlayn(onlineManager.isOnline())
    return onlineManager.subscribe((holat) => setOnlayn(holat))
  }, [])

  // Internet yo'qligi sababli to'xtab turgan yozuvlar
  const kutayotgan = useMutationState({
    filters: { predicate: (m) => m.state.isPaused },
  }).length

  /*
    Server rad etgan yozuvlar — bular o'zi qayta urinmaydi.

    Xatoning O'Z XABARI ham ko'rsatiladi. Oldin faqat "saqlanmadi"
    deyilardi va sababni bilishning yagona yo'li brauzer
    konsolini ochish edi — oddiy foydalanuvchi uchun bu imkonsiz,
    men uchun esa har safar so'rab-surishtirish demakdi.
  */
  const xatoXabarlari = useMutationState({
    filters: { status: 'error' },
    select: (m) => (m.state.error as Error | null)?.message ?? '',
  })
  const xatolar = xatoXabarlari.length
  const birinchiXabar = xatoXabarlari.find((x) => x.length > 0)

  if (onlayn && kutayotgan === 0 && xatolar === 0) return null

  return (
    <div className="sticky top-0 z-50">
      {!onlayn && (
        <Chiziq uslub="qora" ikonka={CloudOff}>
          {t('offline.yoq')}
          {kutayotgan > 0 && ` · ${t('offline.kutmoqda', { n: kutayotgan })}`}
        </Chiziq>
      )}

      {onlayn && kutayotgan > 0 && (
        <Chiziq uslub="qora" ikonka={RefreshCw}>
          {t('offline.yuborilmoqda', { n: kutayotgan })}
        </Chiziq>
      )}

      {xatolar > 0 && (
        <Chiziq uslub="xato" ikonka={TriangleAlert}>
          {t('offline.xato', { n: xatolar })}
          {birinchiXabar && (
            <span className="ml-2 font-normal opacity-90">
              — {birinchiXabar.slice(0, 160)}
            </span>
          )}
        </Chiziq>
      )}
    </div>
  )
}

function Chiziq({
  uslub,
  ikonka: Ikonka,
  children,
}: {
  uslub: 'qora' | 'xato'
  ikonka: typeof CloudOff
  children: React.ReactNode
}) {
  return (
    <div
      role="status"
      className={`flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium text-white ${
        uslub === 'xato' ? 'bg-danger' : 'bg-brand-ink'
      }`}
    >
      <Ikonka className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
    </div>
  )
}
