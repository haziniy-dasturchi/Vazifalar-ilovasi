import Link from 'next/link'
import { Compass } from 'lucide-react'

export default function TopilmadiSahifasi() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface-muted px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-2xl bg-brand-soft">
        <Compass className="size-8 text-brand-primary" aria-hidden />
      </span>
      <h1 className="mt-5 text-xl font-bold text-text-strong">
        Bunday sahifa yo‘q
      </h1>
      <p className="mt-2 max-w-sm text-base text-text-muted">
        Manzil noto‘g‘ri bo‘lishi yoki sahifa o‘chirilgan bo‘lishi mumkin.
      </p>
      <Link
        href="/jarayonda"
        className="mt-6 rounded-xl bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:bg-brand-primary-hover"
      >
        Bosh sahifaga qaytish
      </Link>
    </main>
  )
}
