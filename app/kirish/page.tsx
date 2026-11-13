import type { Metadata } from 'next'
import { KirishTugmalari } from '@/components/auth/kirish-tugmalari'

export const metadata: Metadata = {
  title: 'Kirish',
}

const XATOLAR: Record<string, string> = {
  kod_yoq: 'Kirish yakunlanmadi. Qayta urinib ko‘ring.',
  sessiya: 'Kirish yakunlanmadi. Qayta urinib ko‘ring.',
}

export default async function KirishSahifasi({
  searchParams,
}: {
  searchParams: Promise<{ keyin?: string; xato?: string }>
}) {
  const { keyin, xato } = await searchParams
  const xatoMatni = xato ? (XATOLAR[xato] ?? XATOLAR.sessiya) : null

  return (
    <main className="flex min-h-dvh flex-col bg-surface px-6 py-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h1 className="sr-only">Samara</h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
          <img
            src="/brand/logo-login-light.svg"
            alt="Samara"
            width={224}
            height={168}
            className="mx-auto h-auto w-56"
          />
          <p className="mt-2 text-sm font-semibold text-brand-onsoft">
            Har kun — samarali kun
          </p>
          <p className="mt-3 text-base leading-relaxed text-text-muted">
            Kunlik ishlaringizni bir joyda rejalashtiring va bajaring.
            Hamma uchun bepul.
          </p>

          {xatoMatni && (
            <p
              role="alert"
              className="mt-6 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              {xatoMatni}
            </p>
          )}

          <div className="mt-9">
            <KirishTugmalari keyin={keyin} />
          </div>

          <p className="mt-5 text-sm text-text-faint">
            Kirish uchun mavjud hisobingiz yetarli — alohida parol o‘ylab topish shart emas.
          </p>
        </div>
      </div>
    </main>
  )
}
