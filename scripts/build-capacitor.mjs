// Capacitor (Android/iOS) uchun statik build.
//
// Next.js'ning `output: 'export'` rejimi middleware'ni va dinamik route
// handler'larni UMUMAN ishlatmaydi (server yo'q — statik fayllar
// to'g'ridan-to'g'ri WebView'ga beriladi). Loyihada ikkitasi bor:
//   - middleware.ts        — har so'rovda sessiya tekshiradi
//   - app/auth/callback    — Google OAuth kodini (web oqimi) sessiyaga
//                             almashtiradi, cookies/request.url ishlatadi
//
// Appga ikkisi ham kerak emas: kirish huquqini ilova client tomonda
// (getSession()) tekshiradi, Google kirish esa native plugin orqali
// to'g'ridan-to'g'ri signInWithIdToken'ga boradi — brauzer callback'siz.
//
// Shu sababli bu ikkisi build paytida VAQTINCHA chetga olinadi, build
// tugagach — muvaffaqiyatli ham, xatolik bilan ham — joyiga qaytariladi.
// Veb (Vercel) build'iga bu fayl umuman tegmaydi.

import { existsSync, renameSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const ILDIZ = path.resolve(fileURLToPath(import.meta.url), '../..')

const KOCHIRISH = [
  ['middleware.ts', 'middleware.ts.capacitor-bak'],
  ['app/auth/callback/route.ts', 'app/auth/callback/route.ts.capacitor-bak'],
].map(([dan, ga]) => [path.join(ILDIZ, dan), path.join(ILDIZ, ga)])

function chetgaOl() {
  for (const [dan, ga] of KOCHIRISH) {
    if (existsSync(dan)) renameSync(dan, ga)
  }
}

function joyigaQaytar() {
  for (const [dan, ga] of KOCHIRISH) {
    if (existsSync(ga)) renameSync(ga, dan)
  }
}

function bajar(buyruq, argumentlar) {
  // Barcha argumentlar o'zimizdan — foydalanuvchi kiritmaydi, shuning
  // uchun bitta satr qilib birlashtirish xavfsiz (node shell:true +
  // massiv argument haqidagi DEP0190 ogohlantirishini oldini oladi)
  const satr = [buyruq, ...argumentlar].join(' ')
  const natija = spawnSync(satr, {
    cwd: ILDIZ,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, BUILD_TARGET: 'capacitor' },
  })
  if (natija.status !== 0) {
    throw new Error(`${satr} — kod ${natija.status}`)
  }
}

chetgaOl()
try {
  bajar('npx', ['next', 'build'])
  bajar('npx', ['cap', 'sync'])
} finally {
  joyigaQaytar()
}
