import type { Metadata } from 'next'
import { QollabQuvvatlashKorinishi } from '@/components/sahifalar/qollab-quvvatlash'

export const metadata: Metadata = { title: 'Loyihani qo‘llab-quvvatlash' }

export default function QollabQuvvatlashSahifasi() {
  return <QollabQuvvatlashKorinishi />
}
