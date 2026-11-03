import type { Metadata } from 'next'
import { YoriqnomaKorinishi } from '@/components/sahifalar/yoriqnoma'

export const metadata: Metadata = { title: 'Yo‘riqnoma' }

export default function YoriqnomaSahifasi() {
  return <YoriqnomaKorinishi />
}
