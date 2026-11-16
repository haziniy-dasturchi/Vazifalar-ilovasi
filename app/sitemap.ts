import type { MetadataRoute } from 'next'
import { DOMEN } from '@/lib/huquqiy'

/**
 * Sayt xaritasi — faqat kirishsiz ochiladigan sahifalar.
 *
 * Ilova ichidagi sahifalar bu yerga qo'shilmaydi: robot ularni ocha
 * olmaydi va xaritada turgan, lekin ochilmaydigan manzil qidiruv
 * tizimida saytga salbiy belgi bo'lib qoladi.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const bugun = new Date()

  return [
    {
      url: DOMEN,
      lastModified: bugun,
      changeFrequency: 'weekly',
      priority: 1,
    },
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
