import { ilovaNativemi } from '@/lib/platform'

/**
 * Papka sahifasi manzili — veb va app uchun turlicha.
 *
 * Veb: `/papka/<id>` (server har qanday ID uchun sahifani chizadi).
 *
 * App (Capacitor statik eksporti): build paytida faqat bitta zaxira
 * sahifa (`/papka/_/`) yaratiladi — haqiqiy ID'lar foydalanuvchida.
 * `/papka/<id>/` ga o'tilsa Next uning RSC faylini topolmay to'liq
 * qayta yuklaydi, Capacitor esa mavjud bo'lmagan yo'l uchun ildizdagi
 * `index.html` ni (bosh sahifa) beradi — papka umuman ochilmasdi.
 * Shuning uchun appda ID so'rov parametrida uzatiladi: `/papka/_/?id=<id>`.
 */
export function papkaYoli(id: string): string {
  return ilovaNativemi()
    ? `/papka/_/?id=${encodeURIComponent(id)}`
    : `/papka/${id}`
}

/** Zaxira segment — `app/(ilova)/papka/[id]/page.tsx` bilan bir xil */
export const PAPKA_ZAXIRA_ID = '_'
