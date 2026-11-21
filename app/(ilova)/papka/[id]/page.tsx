import { Suspense } from 'react'
import { PapkaKorinishi } from '@/components/sahifalar/papka'

/**
 * Capacitor statik eksporti uchun: real papka ID'lari build vaqtida
 * noma'lum, shuning uchun faqat BITTA zaxira yo'l hosil qilinadi.
 * Appda manzil `/papka/_/?id=<id>` ko'rinishida bo'ladi (lib/yollar.ts).
 */
export function generateStaticParams() {
  return [{ id: '_' }]
}

export default function PapkaSahifasi() {
  // `useSearchParams` (appda papka ID'si `?id=` da) Suspense talab qiladi
  return (
    <Suspense fallback={null}>
      <PapkaKorinishi />
    </Suspense>
  )
}
