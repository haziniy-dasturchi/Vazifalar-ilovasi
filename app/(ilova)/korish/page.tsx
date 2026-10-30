import type { Metadata } from 'next'
import { KorishKorinishi } from '@/components/sahifalar/korish'

export const metadata: Metadata = { title: 'Ko‘rish' }

export default function KorishSahifasi() {
  return <KorishKorinishi />
}
