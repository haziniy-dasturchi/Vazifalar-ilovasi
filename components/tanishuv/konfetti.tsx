'use client'

import { useMemo } from 'react'

const RANGLAR = ['#f59e0b', '#10b981', '#ec4899', '#6366f1', '#ef4444', '#0ea5e9', '#a855f7']

/**
 * Bir martalik konfetti portlashi — faqat CSS.
 * Ota element `relative` bo'lishi kerak; zarrachalar markazdan otiladi.
 */
export function Konfetti({ kop = false }: { kop?: boolean }) {
  const zarralar = useMemo(() => {
    const soni = kop ? 36 : 18
    return Array.from({ length: soni }, (_, i) => {
      const burchak = (i / soni) * Math.PI * 2 + Math.random() * 0.4
      const masofa = (kop ? 140 : 90) + Math.random() * (kop ? 80 : 40)
      return {
        x: `${Math.cos(burchak) * masofa}px`,
        y: `${Math.sin(burchak) * masofa}px`,
        r: `${Math.round(Math.random() * 540 - 270)}deg`,
        rang: RANGLAR[i % RANGLAR.length],
        kech: `${Math.random() * 0.12}s`,
        shakl: i % 3 === 0 ? 'rounded-full' : 'rounded-[2px]',
      }
    })
  }, [kop])

  return (
    <span className="pointer-events-none absolute top-1/2 left-1/2" aria-hidden>
      {zarralar.map((z, i) => (
        <span
          key={i}
          className={`absolute h-2.5 w-1.5 ${z.shakl}`}
          style={
            {
              background: z.rang,
              '--x': z.x,
              '--y': z.y,
              '--r': z.r,
              animation: `tanishuv-konfetti 1.1s cubic-bezier(0.15, 0.7, 0.4, 1) ${z.kech} both`,
            } as React.CSSProperties
          }
        />
      ))}
    </span>
  )
}
