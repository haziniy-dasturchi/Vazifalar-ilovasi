import type { Metadata } from 'next'
import { BoshSahifa, boshMetadata } from '@/components/sahifalar/bosh-sahifa'

export const metadata: Metadata = boshMetadata('ru')

export default function BoshRu() {
  return <BoshSahifa til="ru" />
}
