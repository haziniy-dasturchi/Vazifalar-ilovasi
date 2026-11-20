'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Send } from 'lucide-react'
import { useT } from './til-provayder'
import { useBolimTartibi } from '@/lib/queries/bolim-tartibi'
import { useKelganTopshiriqlar } from '@/lib/queries/topshiriqlar'

// Ro'yxatning o'zi `lib/bolimlar.ts` ga ko'chirildi: uni sozlamalar
// sahifasi ham ishlatadi va komponentdan import qilish aylanma
// bog'lanish hosil qilardi.
export { BOLIMLAR } from '@/lib/bolimlar'

export function PastkiMenyu() {
  const yol = usePathname()
  const BOLIMLAR = useBolimTartibi()
  const t = useT()

  const { data: kelganlar } = useKelganTopshiriqlar()
  const kutilayotgan =
    kelganlar?.filter((x) => x.holat === 'kutilmoqda').length ?? 0

  const topshiriqFaol = yol === '/topshiriqlar'

  return (
    <nav
      aria-label={t('nav.asosiyBolimlar')}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {BOLIMLAR.map(({ yol: manzil, nom, ikonka: Ikonka }) => {
          const faol = yol === manzil || yol.startsWith(manzil + '/')
          return (
            <li key={manzil} className="min-w-0 flex-1">
              <Link
                href={manzil}
                aria-current={faol ? 'page' : undefined}
                className={`flex min-h-touch flex-col items-center justify-center gap-1 px-0.5 py-2 text-[11px] font-medium transition ${
                  faol ? 'text-brand-onsoft' : 'text-text-faint'
                }`}
              >
                <Ikonka
                  className={`size-6 shrink-0 ${faol ? 'stroke-[2.4]' : ''}`}
                  aria-hidden
                />
                <span className="w-full truncate text-center">{t(nom)}</span>
              </Link>
            </li>
          )
        })}

        {/*
          Topshiriqlar ataylab ALOHIDA — chap tomonida ajratuvchi
          chiziq bilan. Sababi: qolgan to'rttasi mening ishlarim,
          bu esa boshqa odamlar bilan bog'liq bo'lim. Yon panelda
          ham xuddi shunday ajratilgan.

          Javob kutayotganlari soni shu yerda ko'rinadi: avval u
          faqat kompyuterda bor edi va telefonda yangi topshiriq
          kelgani bilinmay qolardi.
        */}
        <li className="min-w-0 flex-1 border-l border-border-subtle">
          <Link
            href="/topshiriqlar"
            aria-current={topshiriqFaol ? 'page' : undefined}
            className={`flex min-h-touch flex-col items-center justify-center gap-1 px-0.5 py-2 text-[11px] font-medium transition ${
              topshiriqFaol ? 'text-brand-onsoft' : 'text-text-faint'
            }`}
          >
            <span className="relative shrink-0">
              <Send
                className={`size-6 ${topshiriqFaol ? 'stroke-[2.4]' : ''}`}
                aria-hidden
              />
              {kutilayotgan > 0 && (
                <span
                  aria-hidden
                  className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-brand-primary px-1 text-center text-[10px] leading-4 font-bold text-white"
                >
                  {kutilayotgan > 9 ? '9+' : kutilayotgan}
                </span>
              )}
            </span>
            <span className="w-full truncate text-center">
              {t('topshiriq.bolimi')}
            </span>
            {kutilayotgan > 0 && (
              <span className="sr-only">
                {t('topshiriq.yangiSoni', { son: kutilayotgan })}
              </span>
            )}
          </Link>
        </li>
      </ul>
    </nav>
  )
}
