import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/**
 * Huquqiy sahifalar (maxfiylik, shartlar, hisobni o'chirish).
 *
 * MUHIM: bular KIRISHSIZ ochilishi shart. Google Play ham, App Store
 * ham maxfiylik siyosati va hisobni o'chirish havolasini tekshiruvchi
 * robotlar bilan ochadi — ular login qila olmaydi. Shu sababli bu
 * sahifalar middleware'dagi ochiq yo'llar ro'yxatida turadi.
 */
export default function HuquqiyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-surface">
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-5 py-4">
          <Link
            href="/"
            className="flex size-9 items-center justify-center rounded-lg text-text-muted transition hover:bg-surface-muted"
            aria-label="Bosh sahifa"
          >
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
          <span className="text-base font-bold text-brand-primary">Samara</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 pb-16">{children}</main>
    </div>
  )
}
