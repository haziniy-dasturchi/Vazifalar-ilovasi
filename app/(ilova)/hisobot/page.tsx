import type { Metadata } from 'next'
import { HisobotKorinishi } from '@/components/sahifalar/hisobot'

export const metadata: Metadata = { title: 'Hisobot' }

export default function HisobotSahifasi() {
  return <HisobotKorinishi />
}
