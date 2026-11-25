import type { MatnKaliti } from '@/lib/i18n'
import type { Topshiriq } from '@/types/vazifalar'

/**
 * Kartada ko'rinadigan holat. Bazadagi `holat` dan ko'ra boyroq:
 * ijrochi vazifani boshlagan-boshlamagani, qaytarilgani va kechikkani
 * ham hisobga olinadi — rahbar bir qarashda vaziyatni ko'rsin.
 */
export type KorinishHolati =
  | 'yangi'
  | 'jarayonda'
  | 'tekshiruvda'
  | 'qaytarildi'
  | 'kechikkan'
  | 'bajarildi'
  | 'rad'

export const HOLAT_USLUBI: Record<
  KorinishHolati,
  { kalit: MatnKaliti; rang: string; fon: string }
> = {
  yangi: { kalit: 'tk.holat.yangi', rang: '#2563eb', fon: 'rgba(37,99,235,0.12)' },
  jarayonda: { kalit: 'tk.holat.jarayonda', rang: '#d97706', fon: 'rgba(245,158,11,0.16)' },
  tekshiruvda: { kalit: 'tk.holat.tekshiruvda', rang: '#7c3aed', fon: 'rgba(124,58,237,0.13)' },
  qaytarildi: { kalit: 'tk.holat.qaytarildi', rang: '#ea580c', fon: 'rgba(234,88,12,0.13)' },
  kechikkan: { kalit: 'tk.holat.kechikkan', rang: '#dc2626', fon: 'rgba(220,38,38,0.12)' },
  bajarildi: { kalit: 'tk.holat.bajarildi', rang: '#059669', fon: 'rgba(16,185,129,0.15)' },
  rad: { kalit: 'tk.holat.rad', rang: '#6b7280', fon: 'rgba(107,114,128,0.14)' },
}

export function korinishHolati(
  t: Topshiriq,
  vazifaHolati: string | null | undefined,
  kechikkan: boolean
): KorinishHolati {
  if (t.holat === 'bajarildi') return 'bajarildi'
  if (t.holat === 'tekshiruvda') return 'tekshiruvda'
  if (t.holat === 'rad') return 'rad'
  if (kechikkan) return 'kechikkan'
  if (t.holat === 'qabul' && t.qaytarish_sababi) return 'qaytarildi'
  if (t.holat === 'qabul' && vazifaHolati === 'in_progress') return 'jarayonda'
  return 'yangi'
}

/** "Azizbek Xoldarov" -> "AX", "ali@mail.uz" -> "A" */
export function bosHarflar(matn: string): string {
  return matn
    .split('@')[0]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')
}

/** Ism bo'yicha doimiy avatar rangi — bir odam doim bir xil rangda */
const AVATAR_RANGLARI = ['#0b3d2e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#65a30d']
export function avatarRangi(kalit: string): string {
  let h = 0
  for (const c of kalit) h = (h * 31 + c.charCodeAt(0)) | 0
  return AVATAR_RANGLARI[Math.abs(h) % AVATAR_RANGLARI.length]
}

/** "Har hafta", "Har 3 kunda" */
export function takrorMatni(
  takror: string,
  t: (k: MatnKaliti, q?: Record<string, string | number>) => string
): string {
  if (takror === 'kunlik') return t('tj.takror.kunlik')
  if (takror === 'haftalik') return t('tj.takror.haftalik')
  if (takror === 'oylik') return t('tj.takror.oylik')
  const [, son, birlik] = takror.split(':')
  const kalit: MatnKaliti =
    birlik === 'hafta' ? 'tk.har.hafta' : birlik === 'oy' ? 'tk.har.oy' : 'tk.har.kun'
  return t(kalit, { son: Number(son) })
}
