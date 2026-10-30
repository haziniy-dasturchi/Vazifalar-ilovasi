import type { Metadata } from 'next'
import { ArxivKorinishi } from '@/components/sahifalar/arxiv'

export const metadata: Metadata = { title: 'Arxiv' }

export default function ArxivSahifasi() {
  return <ArxivKorinishi />
}
