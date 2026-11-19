import type { Metadata } from 'next'
import { TopshiriqlarKorinishi } from '@/components/sahifalar/topshiriqlar'

export const metadata: Metadata = { title: 'Topshiriqlar' }

export default function TopshiriqlarSahifasi() {
  return <TopshiriqlarKorinishi />
}
