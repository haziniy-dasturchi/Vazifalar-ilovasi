import type { Metadata } from 'next'
import { SozlamalarKorinishi } from '@/components/sahifalar/sozlamalar'

export const metadata: Metadata = { title: 'Sozlamalar' }

export default function SozlamalarSahifasi() {
  return <SozlamalarKorinishi />
}
