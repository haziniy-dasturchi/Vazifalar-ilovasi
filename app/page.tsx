import type { Metadata } from 'next'
import { BoshSahifa, boshMetadata } from '@/components/sahifalar/bosh-sahifa'
import { NativeDarvoza } from '@/components/app/native-darvoza'

export const metadata: Metadata = boshMetadata('uz')

export default function Bosh() {
  return (
    <>
      <NativeDarvoza joy="bosh" />
      {/* Appda reklama sahifasi ko'rsatilmaydi — izoh: native-darvoza.tsx */}
      <div className="native-yashir">
        <BoshSahifa til="uz" />
      </div>
    </>
  )
}
