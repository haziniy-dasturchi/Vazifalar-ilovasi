import type { Metadata } from 'next'
import { KelgusiKorinishi } from '@/components/sahifalar/kelgusi'

export const metadata: Metadata = { title: 'Kelgusi' }

export default function KelgusiSahifasi() {
  return <KelgusiKorinishi />
}
