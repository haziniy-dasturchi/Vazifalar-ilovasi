'use client'

import { CircleAlert, type LucideIcon } from 'lucide-react'

/** Yuklanish skeleti — vazifa qatorlari shaklida */
export function Yuklanmoqda({ qator = 4 }: { qator?: number }) {
  return (
    <ul className="space-y-2" aria-label="Yuklanmoqda" aria-busy="true">
      {Array.from({ length: qator }, (_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-card"
        >
          <span className="size-6 shrink-0 animate-pulse rounded-full bg-surface-sunken" />
          <span className="flex-1 space-y-2">
            <span
              className="block h-4 animate-pulse rounded bg-surface-sunken"
              style={{ width: `${70 - i * 8}%` }}
            />
            <span className="block h-3 w-24 animate-pulse rounded bg-surface-sunken" />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Bo'sh holat — har sahifada bir xil ko'rinadi */
export function BoshHolat({
  ikonka: Ikonka,
  sarlavha,
  matn,
  harakat,
}: {
  ikonka: LucideIcon
  sarlavha: string
  matn: string
  harakat?: { matn: string; bajar: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-surface px-6 py-16 text-center shadow-card">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft">
        <Ikonka className="size-8 text-brand-primary" aria-hidden />
      </span>
      <h2 className="mt-5 text-lg font-semibold text-text-strong">
        {sarlavha}
      </h2>
      <p className="mt-2 max-w-xs text-base leading-relaxed text-text-muted">
        {matn}
      </p>
      {harakat && (
        <button
          type="button"
          onClick={harakat.bajar}
          className="mt-6 rounded-xl bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
        >
          {harakat.matn}
        </button>
      )}
    </div>
  )
}

/** Xato holati */
export function XatoHolati({ qayta }: { qayta?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-surface px-6 py-14 text-center shadow-card">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-red-50">
        <CircleAlert className="size-7 text-red-600" aria-hidden />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-text-strong">
        Ma’lumotni yuklab bo‘lmadi
      </h2>
      <p className="mt-2 text-base text-text-muted">
        Internet aloqasini tekshirib ko‘ring.
      </p>
      {qayta && (
        <button
          type="button"
          onClick={qayta}
          className="mt-6 rounded-xl border border-border-subtle px-6 py-3 text-base font-medium text-text-strong transition hover:bg-surface-muted"
        >
          Qayta urinish
        </button>
      )}
    </div>
  )
}
