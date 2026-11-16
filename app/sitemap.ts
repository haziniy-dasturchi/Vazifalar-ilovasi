import type { MetadataRoute } from 'next'
import { DOMEN } from '@/lib/huquqiy'
import { TILLAR, tilPrefiksi } from '@/lib/i18n'

/**
 * Sayt xaritasi — faqat kirishsiz ochiladigan sahifalar.
 *
 * Ilova ichidagi sahifalar bu yerga qo'shilmaydi: robot ularni ocha
 * olmaydi va xaritada turgan, lekin ochilmaydigan manzil qidiruv
 * tizimida saytga salbiy belgi bo'lib qoladi.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const bugun = new Date()

  // Bosh sahifaning har bir tildagi nusxasi bir-biriga hreflang
  // orqali bog'lanadi — aks holda Google ularni takroriy mazmun deb
  // hisoblab, faqat bittasini ko'rsatishi mumkin.
  const tillar: Record<string, string> = {}
  for (const { kod } of TILLAR) {
    tillar[kod] = `${DOMEN}${tilPrefiksi(kod)}` || DOMEN
  }

  const boshSahifalar: MetadataRoute.Sitemap = TILLAR.map(({ kod }) => ({
    url: `${DOMEN}${tilPrefiksi(kod)}` || DOMEN,
    lastModified: bugun,
    changeFrequency: 'weekly' as const,
    priority: kod === 'uz' ? 1 : 0.9,
    alternates: { languages: tillar },
  }))

  return [
    ...boshSahifalar,
    {
      url: `${DOMEN}/maxfiylik`,
      lastModified: bugun,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${DOMEN}/shartlar`,
      lastModified: bugun,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${DOMEN}/hisobni-ochirish`,
      lastModified: bugun,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
