'use client'

import { createBrowserClient } from '@supabase/ssr'
import {
  createClient as createSupabaseClient,
  type User,
} from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'
import { ilovaNativemi } from '@/lib/platform'

let mijoz: ReturnType<typeof createBrowserClient<Database>> | undefined

/**
 * Capacitor'da `@capacitor/preferences` (native SharedPreferences /
 * UserDefaults) sessiya saqlagichi sifatida ishlatiladi.
 *
 * Nega localStorage emas: WebView'ning o'z saqlash joyi tizim
 * tomonidan (keshni tozalash, WebView yangilanishi) ko'proq xavf
 * ostida. `@capacitor/preferences` esa native saqlagichga yozadi —
 * ancha ishonchli. Shu sababli sessiya internetsiz, ilova
 * yopib-ochilgandan keyin ham joyida qoladi.
 */
const nativeSaqlagich = {
  async getItem(kalit: string) {
    const { Preferences } = await import('@capacitor/preferences')
    const { value } = await Preferences.get({ key: kalit })
    return value
  },
  async setItem(kalit: string, qiymat: string) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.set({ key: kalit, value: qiymat })
  },
  async removeItem(kalit: string) {
    const { Preferences } = await import('@capacitor/preferences')
    await Preferences.remove({ key: kalit })
  },
}

/** supabase-js'ning standart saqlash kaliti: `sb-<loyiha>-auth-token` */
function sessiyaKaliti() {
  return `sb-${new URL(supabaseUrl()).hostname.split('.')[0]}-auth-token`
}

/**
 * Appda native saqlagichdagi sessiya egasini (tarmoqsiz) o'qiydi.
 *
 * Nega `getSession()` yetmaydi: access token muddati (1 soat) o'tgan
 * bo'lsa, `getSession()` uni yangilashga urinadi. Internet bo'lmasa
 * yangilash yiqiladi va u `session: null` qaytaradi — garchi refresh
 * token saqlagichda butun bo'lsa ham. Shu `null` ga qarab foydalanuvchini
 * kirish sahifasiga haydash noto'g'ri: u chiqmagan, shunchaki oflayn.
 * Internet qaytgach `autoRefreshToken` sessiyani o'zi yangilaydi.
 */
export async function saqlanganSessiyaFoydalanuvchisi(): Promise<User | null> {
  if (!ilovaNativemi()) return null
  try {
    const xom = await nativeSaqlagich.getItem(sessiyaKaliti())
    if (!xom) return null
    const s = JSON.parse(xom) as { user?: User; refresh_token?: string }
    return s.refresh_token && s.user ? s.user : null
  } catch {
    return null
  }
}

/**
 * Brauzerdagi Supabase mijozi — butun ilova uchun bitta nusxa.
 *
 * Har bir sahifa o'tishida qayta yaratilsa, GoTrueClient va uning auth
 * tinglovchilari har safar qaytadan ishga tushadi — bu telefonda sezilarli
 * sekinlik qo'shadi. Shu sababli bir marta yaratib, modul darajasida saqlaymiz.
 *
 * Veb'da `createBrowserClient` (kuki orqali saqlaydi — middleware shu
 * kukini o'qiydi) ishlatiladi, appda esa oddiy `createClient` +
 * `@capacitor/preferences`: appda middleware umuman yo'q (statik
 * eksport), kuki bilan bog'lanish kerak emas, OAuth URL'ni o'qish ham
 * kerak emas (native kirish to'g'ridan-to'g'ri idToken qaytaradi).
 */
export function createClient() {
  if (!mijoz) {
    mijoz = ilovaNativemi()
      ? createSupabaseClient<Database>(supabaseUrl(), supabaseAnonKey(), {
          auth: {
            storage: nativeSaqlagich,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        })
      : createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey())
  }
  return mijoz
}
