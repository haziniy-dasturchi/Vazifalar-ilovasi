'use client'

import { Star } from 'lucide-react'
import { useT } from '@/components/app/til-provayder'

/** 1-5 yulduzli baho: ko'rsatish yoki (ozgartir berilsa) tanlash */
export function Yulduzlar({
  qiymat,
  ozgartir,
}: {
  qiymat: number
  ozgartir?: (b: number) => void
}) {
  const t = useT()
  return (
    <span className="inline-flex items-center gap-0.5" role={ozgartir ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) =>
        ozgartir ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={qiymat === n}
            aria-label={t('tj.yulduz', { son: n })}
            onClick={() => ozgartir(qiymat === n ? 0 : n)}
            className="min-h-0 p-1"
          >
            <Star
              className={`size-7 ${n <= qiymat ? 'fill-amber-400 text-amber-400' : 'text-text-faint'}`}
              aria-hidden
            />
          </button>
        ) : (
          <Star
            key={n}
            className={`size-4 ${n <= qiymat ? 'fill-amber-400 text-amber-400' : 'text-text-faint'}`}
            aria-hidden
          />
        )
      )}
    </span>
  )
}
