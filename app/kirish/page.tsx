import Image from 'next/image'
import type { Metadata } from 'next'
import { GoogleTugma } from '@/components/auth/google-tugma'

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
          <Image
            src="/brand/belgi-512.png"
            alt=""
            width={88}
            height={88}
            priority
            className="mx-auto size-22"
          />

          <h1 className="mt-7 text-4xl font-bold tracking-tight text-brand-primary">
            Vazifalar
          </h1>
          <p className="mt-3 text-base leading-relaxed text-text-muted">
            Kunlik ishlaringizni bir joyda rejalashtiring va bajaring.
            Hamma uchun bepul.
          </p>

          {xatoMatni && (
            <p
              role="alert"
              className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {xatoMatni}
            </p>
          )}

          <div className="mt-9">
            <GoogleTugma keyin={keyin} />
          </div>

          <p className="mt-5 text-sm text-text-faint">
            Kirish uchun Google hisobingiz yetarli.
          </p>
        </div>
      </div>
    </main>
  )
}
