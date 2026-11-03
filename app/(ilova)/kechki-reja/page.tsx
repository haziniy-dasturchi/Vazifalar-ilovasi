import type { Metadata } from 'next'
import { KechkiRejaKorinishi } from '@/components/sahifalar/kechki-reja'

export const metadata: Metadata = { title: 'Kechki reja' }

export default function KechkiRejaSahifasi() {
  return <KechkiRejaKorinishi />
}
