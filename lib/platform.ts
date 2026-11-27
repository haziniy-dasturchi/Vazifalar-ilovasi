import { Capacitor } from '@capacitor/core'

/**
 * Veb va ilova (Capacitor) orasidagi farqlar FAQAT shu yerda hal
 * qilinadi. Boshqa joyda `Capacitor.isNativePlatform()` ga to'g'ridan-to'g'ri
 * murojaat qilinmasin — kelajakda platforma aniqlash mantiqi o'zgarsa,
 * o'zgarish bitta joyda qolishi uchun.
 */
export function ilovaNativemi(): boolean {
  return Capacitor.isNativePlatform()
}

export function nativePlatforma(): 'ios' | 'android' | null {
  const p = Capacitor.getPlatform()
  return p === 'ios' || p === 'android' ? p : null
}
