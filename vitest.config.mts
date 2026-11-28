import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Testlar — faqat sof mantiq uchun (UI emas).
 *
 * Nega shunday chegaralangan: ilovaning qiyin joyi komponentlar emas,
 * sana/takrorlanish/kalit so'z hisob-kitobi. Ularni brauzersiz,
 * tez va aniq sinash mumkin. Shu sababli jsdom va React test
 * kutubxonalari qo'shilmagan — keraksiz og'irlik bo'lardi.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    environment: 'node',
    // Edge funksiyalarning sof mantig'i (Payme/Click) ham — u
    // platformaga bog'liq emas, Node'da ham ishlaydi
    include: ['lib/**/*.test.ts', 'supabase/functions/_shared/**/*.test.ts'],
  },
})
