'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ilovaNativemi } from '@/lib/platform'
import { PAPKA_ZAXIRA_ID, papkaYoli } from '@/lib/yollar'
import {
  createClient,
  saqlanganSessiyaFoydalanuvchisi,
} from '@/lib/supabase/client'

/** Appda oxirgi ochilgan ichki sahifa — qayta ochilganda shu yerga qaytiladi */
const OXIRGI_YOL_KALITI = 'samara-oxirgi-yol'
const STANDART_YOL = '/jarayonda'

/** `/papka/<id>` — appda mavjud bo'lmagan (eski uslubdagi) papka manzili */
const ESKI_PAPKA = /^\/papka\/([^/?#]+)\/?$/

/**
 * Manzilni app ichida ochiladigan ko'rinishga keltiradi yoki rad etadi.
 * - kirishdan oldingi sahifalar (`/`, `/kirish`) — saqlanmaydi
 * - `/papka/<id>` (statik eksportda bunday fayl yo'q) — `/papka/_/?id=<id>`
 */
function ichkiYol(yol: string): string | null {
  if (!yol.startsWith('/')) return null
  yol = faylYoliniTozala(yol) ?? yol
  const [nom] = yol.split('?')
  if (nom === '/' || nom.startsWith('/kirish') || nom.startsWith('/auth')) {
    return null
  }
  const papka = ESKI_PAPKA.exec(nom)
  if (papka && papka[1] !== PAPKA_ZAXIRA_ID) {
    return papkaYoli(decodeURIComponent(papka[1]))
  }
  return yol
}

export function oxirgiYolniSaqla(yol: string) {
  const toza = ichkiYol(yol)
  if (!toza) return
  try {
    localStorage.setItem(OXIRGI_YOL_KALITI, toza)
  } catch {
    // saqlab bo'lmasa — standart sahifa ochiladi, jiddiy emas
  }
}

function oxirgiYol(): string {
  try {
    const yol = localStorage.getItem(OXIRGI_YOL_KALITI)
    if (yol) return ichkiYol(yol) ?? STANDART_YOL
  } catch {
    // saqlagich yopiq bo'lsa standart sahifa
  }
  return STANDART_YOL
}

/** `/a/b?x=1` -> `/a/b/` (taqqoslash uchun) */
function yolNomi(yol: string): string {
  const [nom] = yol.split('?')
  return nom.endsWith('/') ? nom : `${nom}/`
}

/**
 * Sahifani ochadi. Agar so'ralgan manzil HOZIRGI manzilning o'zi bo'lsa
 * (Capacitor shu manzilga bosh sahifa HTML'ini bergan holat), Next
 * `router.replace` hech narsa qilmaydi — sahifa bo'sh qoladi. Shunda
 * sahifaning haqiqiy faylini (`/bugun/index.html`) to'liq yuklaymiz:
 * nuqtali yo'lni Capacitor fayl sifatida beradi. Ortiqcha `index.html`
 * keyin `NativeBootstrap` da manzildan olib tashlanadi.
 */
async function ochish(router: ReturnType<typeof useRouter>, yol: string) {
  if (yolNomi(yol) !== yolNomi(window.location.pathname)) {
    router.replace(yol)
    return
  }
  const [nom, soroq] = yol.split('?')
  const fayl = `${yolNomi(nom)}index.html`
  // Bunday sahifa umuman yo'q bo'lsa (eski/noto'g'ri havola), fayl
  // yuklansa brauzerning "Veb-sahifa mavjud emas" xatosi chiqardi
  const bormi = await fetch(fayl, { method: 'HEAD' })
    .then((j) => j.ok)
    .catch(() => false)
  if (!bormi) {
    router.replace(yolNomi(STANDART_YOL) === yolNomi(nom) ? '/korish/' : STANDART_YOL)
    return
  }
  window.location.replace(`${fayl}${soroq ? `?${soroq}` : ''}`)
}

/** `/bugun/index.html?x` -> `/bugun/?x` — haqiqiy fayl orqali ochilgandan keyin */
export function faylYoliniTozala(yol: string): string | null {
  const [nom, soroq] = yol.split('?')
  if (!nom.endsWith('/index.html')) return null
  const toza = nom.slice(0, -'index.html'.length)
  return soroq ? `${toza}?${soroq}` : toza
}

async function kirganmi(): Promise<boolean> {
  const { data } = await createClient().auth.getSession()
  if (data.session) return true
  // Oflayn + muddati o'tgan token: sessiya saqlagichda butun turibdi
  return (await saqlanganSessiyaFoydalanuvchisi()) !== null
}

/**
 * Appning kirish nuqtasi.
 *
 * Capacitor nuqtasiz har qanday yo'l uchun (masalan, Android jarayonni
 * yopib qayta ochganda yoki sahifa to'liq qayta yuklanganda) ILDIZDAGI
 * `index.html` ni — kirishdan oldingi bosh sahifani — beradi. Veb'da
 * buni middleware hal qiladi, appda middleware yo'q.
 *
 * Shuning uchun appda bosh sahifa chizilmaydi (`app/layout.tsx` dagi
 * skript `data-native` qo'yadi, CSS `.native-yashir` ni yashiradi), bu
 * komponent esa:
 *  - manzil `/` emas bo'lsa (zaxira sifatida berilgan) — o'sha manzilni
 *    mijoz tomonda qayta ochadi;
 *  - `/` bo'lsa — kirgan foydalanuvchini oxirgi sahifasiga, kirmaganni
 *    `/kirish` ga olib boradi.
 */
export function NativeDarvoza({ joy }: { joy: 'bosh' | 'kirish' }) {
  const router = useRouter()

  useEffect(() => {
    if (!ilovaNativemi()) return
    let bekor = false
    kirganmi().then((ha) => {
      if (bekor) return
      if (!ha) {
        if (joy === 'bosh') void ochish(router, '/kirish/')
        return
      }
      const joriy = ichkiYol(window.location.pathname + window.location.search)
      void ochish(router, joy === 'bosh' && joriy ? joriy : oxirgiYol())
    })
    return () => {
      bekor = true
    }
  }, [joy, router])

  return null
}
