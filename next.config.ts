import type { NextConfig } from 'next'

/**
 * Capacitor uchun statik eksport FAQAT shu muhit o'zgaruvchisi bilan
 * yoqiladi (`scripts/build-capacitor.mjs` qo'yadi) — veb (Vercel) build'i
 * hech qachon shu shoxobchaga tushmaydi, SSR/middleware o'zgarishsiz qoladi.
 */
const CAPACITOR_UCHUN = process.env.BUILD_TARGET === 'capacitor'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(CAPACITOR_UCHUN
    ? {
        output: 'export',
        // next/image optimallashtirish serveri statik eksportda yo'q
        images: { unoptimized: true },
        /*
          MUHIM: buni o'chirmang. Standart holatda har sahifa yassi
          faylga yoziladi (`bugun.html`). Capacitor WebView'da sahifa
          almashtirish ba'zan to'liq qayta yuklanishga olib keladi —
          o'shanda `/bugun` so'raladi, aniq `bugun.html` fayli emas, va
          natija 404 → kirish oldidagi sahifaga ("index.html") tushib
          qolish bo'ladi. `trailingSlash: true` fayllarni
          `bugun/index.html` qilib yaratadi — bu har qanday statik
          server/WebView uchun universal tushunarli yo'l.
        */
        trailingSlash: true,
      }
    : {}),
}

export default nextConfig
