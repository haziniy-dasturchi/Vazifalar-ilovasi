import type { MetadataRoute } from 'next'
import { DOMEN } from '@/lib/huquqiy'

/**
 * Qidiruv robotlari uchun qoidalar.
 *
 * Ilova ichidagi sahifalar (`/bugun`, `/papka/...`) baribir kirishni
 * talab qiladi — robot u yerga kira olmaydi va faqat kirish sahifasiga
 * yo'naltiriladi. Ularni ataylab taqiqlaymiz: aks holda Google bir xil
 * "Kirish" sahifasini o'nlab manzil ostida ko'rib, saytni sifatsiz deb
 * baholashi mumkin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/jarayonda',
          '/bugun',
          '/kelgusi',
          '/korish',
          '/kechki-reja',
          '/hisobot',
          '/arxiv',
          '/sozlamalar',
          '/papka/',
          '/kirish',
          '/auth/',
        ],
      },
    ],
    sitemap: `${DOMEN}/sitemap.xml`,
    host: DOMEN,
  }
}
