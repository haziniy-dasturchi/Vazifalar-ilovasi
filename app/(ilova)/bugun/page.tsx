import type { Metadata } from 'next'
import { BugunKorinishi } from '@/components/sahifalar/bugun'

export const metadata: Metadata = { title: 'Bugun' }

export default function BugunSahifasi() {
  return <BugunKorinishi />
}
