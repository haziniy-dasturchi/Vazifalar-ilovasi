'use client'

import { Oyna } from './oyna'

/** Tasdiqlash oynasi — o'chirish kabi qaytarib bo'lmaydigan harakatlar uchun */
export function Tasdiq({
  sarlavha,
  matn,
  tugmaMatni = 'O‘chirish',
  xavfli = true,
  tasdiqla,
  yop,
  bajarilmoqda = false,
}: {
  sarlavha: string
  matn: string
  tugmaMatni?: string
  xavfli?: boolean
  tasdiqla: () => void
  yop: () => void
  bajarilmoqda?: boolean
}) {
  return (
    <Oyna sarlavha={sarlavha} yop={yop}>
      <p className="text-base leading-relaxed text-text-muted">{matn}</p>

      <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={yop}
          className="rounded-xl border border-border-subtle px-5 py-3 text-base font-medium text-text-strong transition hover:bg-surface-muted"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={tasdiqla}
          disabled={bajarilmoqda}
          className={`rounded-xl px-5 py-3 text-base font-semibold text-white transition disabled:opacity-60 ${
            xavfli
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-brand-primary hover:bg-brand-primary-hover'
          }`}
        >
          {bajarilmoqda ? 'Bajarilmoqda…' : tugmaMatni}
        </button>
      </div>
    </Oyna>
  )
}
