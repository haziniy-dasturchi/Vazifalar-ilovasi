import type { Metadata } from 'next'
import { JarayondaKorinishi } from '@/components/sahifalar/jarayonda'

export const metadata: Metadata = { title: 'Jarayonda' }

export default function JarayondaSahifasi() {
  return <JarayondaKorinishi />
}
