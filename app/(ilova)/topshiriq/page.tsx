'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { TopshiriqSahifasi } from '@/components/topshiriq/topshiriq-sahifasi'

/**
 * Bitta topshiriq sahifasi: `/topshiriq?id=...`.
 *
 * ID so'rov qismida (yo'lda emas): ilova (Capacitor) statik eksport
 * qilinadi va unda dinamik `[id]` sahifalarni oldindan yaratib
 * bo'lmaydi — so'rov qismi esa har qanday statik serverda ishlaydi.
 */
function Ichki() {
  const id = useSearchParams().get('id')
  return <TopshiriqSahifasi id={id} />
}

export default function TopshiriqSahifasiRoute() {
  return (
    <Suspense fallback={null}>
      <Ichki />
    </Suspense>
  )
}
