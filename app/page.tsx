import type { Metadata } from 'next'
import { BoshSahifa, boshMetadata } from '@/components/sahifalar/bosh-sahifa'

export const metadata: Metadata = boshMetadata('uz')

export default function Bosh() {
  return <BoshSahifa til="uz" />
}
