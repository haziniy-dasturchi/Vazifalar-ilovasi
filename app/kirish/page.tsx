import type { Metadata } from 'next'
import { Suspense } from 'react'
import { KirishTugmalari, KirishXatosi } from '@/components/auth/kirish-tugmalari'
import { NativeDarvoza } from '@/components/app/native-darvoza'

export const metadata: Metadata = {
  title: 'Kirish',
}

export default function KirishSahifasi() {
  return (
    <main className="flex min-h-dvh flex-col bg-surface px-6 pt-[calc(2.5rem+env(safe-area-inset-top))] pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
      <NativeDarvoza joy="kirish" />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="w-full max-w-sm text-center">
          <h1 className="sr-only">Samara</h1>
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
          <img
            src="/brand/logo-login-light.svg"
            alt="Samara"
            width={224}
            height={168}
            className="faqat-yorug mx-auto h-auto w-56"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- SVG, next/image optimallashtirmaydi */}
          <img
            src="/brand/logo-login-dark.svg"
            alt=""
            aria-hidden
            width={224}
            height={168}
            className="faqat-qorongi mx-auto h-auto w-56"
          />
          <p className="mt-2 text-sm font-semibold text-brand-onsoft">
            Har kun — samarali kun
          </p>
          <p className="mt-3 text-base leading-relaxed text-text-muted">
            Kunlik ishlaringizni bir joyda rejalashtiring va bajaring.
            Hamma uchun bepul.
          </p>

          {/*
            `useSearchParams()` ishlatadigan qismlar Suspense ichida
            bo'lishi shart — aks holda butun sahifa statik eksportda
            "dynamic = error" sifatida belgilanib, build yiqiladi.
          */}
          <Suspense fallback={null}>
            <KirishXatosi />
          </Suspense>

          <div className="mt-9">
            <Suspense fallback={null}>
              <KirishTugmalari />
            </Suspense>
          </div>

          <p className="mt-5 text-sm text-text-faint">
            Kirish uchun mavjud hisobingiz yetarli — alohida parol o‘ylab topish shart emas.
          </p>
        </div>
      </div>
    </main>
  )
}
