import type { Metadata } from 'next'
import { BoshSahifa, boshMetadata } from '@/components/sahifalar/bosh-sahifa'

export const metadata: Metadata = boshMetadata('en')

export default function BoshEn() {
  return <BoshSahifa til="en" />
}
