'use client'

import { useProfil } from './profil'
import { BOLIMLAR, tartiblanganBolimlar, type Bolim } from '@/lib/bolimlar'

/**
 * Yon panel va pastki menyu uchun bo'limlar — foydalanuvchi tartibida.
 *
 * Profil hali yuklanmagan bo'lsa sukut tartibi qaytariladi: menyu
 * bo'sh turib, keyin "sakrab" to'lishi kerak emas.
 */
export function useBolimTartibi(): Bolim[] {
  const { data: profil } = useProfil()
  if (!profil) return [...BOLIMLAR]
  return tartiblanganBolimlar(profil.sidebar_order ?? [])
}
