'use client'

import { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/components/app/til-provayder'
import { useRuxsatOzgartirish, useTopshiriqRuxsatlari } from '@/lib/queries/topshiriqlar'

/**
 * Kim menga topshiriq yubora oladi: bloklanganlar va ruxsat
 * berilganlar. Sahifa oxirida, yig'ilgan holda — kamdan-kam kerak.
 */
export function Bloklanganlar() {
  const t = useT()
  const { korsat } = useToast()
  const { data: royxat } = useTopshiriqRuxsatlari()
  const ozgartir = useRuxsatOzgartirish()
  const [ochiq, setOchiq] = useState(false)

  const bloklangan = (royxat ?? []).filter((r) => r.holat === 'blok')
  const ruxsatli = (royxat ?? []).filter((r) => r.holat === 'ruxsat')

  if (bloklangan.length === 0 && ruxsatli.length === 0) return null

  async function ozgartirish(email: string, holat: 'ruxsat' | null) {
    try {
      await ozgartir.mutateAsync({ email, holat })
      korsat({
        matn: holat === 'ruxsat' ? t('topshiriq.ruxsatBerildi') : t('topshiriq.blokOlindi'),
        tone: 'muvaffaqiyat',
      })
    } catch {
      korsat({ matn: t('umumiy.bajarilmadi'), tone: 'xato' })
    }
  }

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOchiq((v) => !v)}
        aria-expanded={ochiq}
        className="flex w-full min-h-0 items-center gap-2 rounded-xl px-1 py-2 text-left transition hover:bg-surface-muted"
      >
        <ShieldCheck className="size-4 shrink-0 text-text-faint" aria-hidden />
        <span className="flex-1 text-sm font-semibold text-text-muted">
          {t('topshiriq.kimYozaOladi')}
        </span>
        <span className="shrink-0 text-sm text-text-faint">
          {bloklangan.length + ruxsatli.length}
        </span>
      </button>

      {ochiq && (
        <>
          <p className="mt-1 mb-2 px-1 text-xs leading-relaxed text-text-faint">
            {t('topshiriq.kimYozaOladiIzoh')}
          </p>

          <ul className="overflow-hidden rounded-2xl bg-surface shadow-card">
            {[...bloklangan, ...ruxsatli].map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center gap-2 border-b border-border-subtle px-4 py-3 last:border-0"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-text-strong">
                  {r.yuboruvchi_email}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    r.holat === 'blok'
                      ? 'bg-danger-soft text-danger'
                      : 'bg-brand-soft text-brand-onsoft'
                  }`}
                >
                  {r.holat === 'blok'
                    ? t('topshiriq.bloklangan')
                    : t('topshiriq.ruxsatli')}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    ozgartirish(
                      r.yuboruvchi_email,
                      r.holat === 'blok' ? 'ruxsat' : null
                    )
                  }
                  disabled={ozgartir.isPending}
                  className="min-h-0 shrink-0 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-semibold text-text-strong transition hover:bg-surface-muted disabled:opacity-50"
                >
                  {r.holat === 'blok'
                    ? t('topshiriq.ruxsatBerish')
                    : t('topshiriq.blokniOlish')}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
