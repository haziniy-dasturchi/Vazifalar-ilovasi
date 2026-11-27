'use client'

import { createBrowserClient } from '@supabase/ssr'
import {
  createClient as createSupabaseClient,
  type Session,
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
 * Yozishdan oldin: amaldagi sessiya, kerak bo'lsa qayta tiklangan.
 *
 * Muammo (telefonda kuzatilgan): token muddati tugagan paytda internet
 * beqaror bo'lsa, avtomatik yangilash yiqiladi va mijoz XOTIRADA
 * sessiyasiz qoladi — garchi refresh token telefonda butun bo'lsa ham.
 * Interfeys foydalanuvchini saqlangan ma'lumotdan ko'rsataveradi, lekin
 * so'rovlar anonim ketadi: yozish RLS'dan o'tmaydi ("Bu odamga
 * topshiriq yubora olmaysiz"), o'qish bo'sh ro'yxat qaytaradi, chiqish
 * esa "sessiya yo'q" deb yiqiladi. Shu yerda sessiya qayta tiklanadi.
 */
export async function faolSessiya(): Promise<Session | null> {
  const sb = createClient()
  const { data } = await sb.auth.getSession()
  if (data.session) return data.session

  let refreshToken: string | undefined
  if (ilovaNativemi()) {
    try {
      const xom = await nativeSaqlagich.getItem(sessiyaKaliti())
      refreshToken = xom ? (JSON.parse(xom) as { refresh_token?: string }).refresh_token : undefined
    } catch {
      refreshToken = undefined
    }
  }
  const { data: yangi } = refreshToken
    ? await sb.auth.refreshSession({ refresh_token: refreshToken })
    : await sb.auth.refreshSession()
  return yangi.session ?? null
}

/**
 * Sessiyani shu qurilmada majburan o'chiradi — serverga murojaat qilmay.
 *
 * Nega kerak: `signOut()` avval serverga "chiqdim" deydi. Internet sust
 * bo'lsa yoki token yangilanmay qolsa, u xato qaytaradi va sessiyani
 * qurilmada O'CHIRMAY qoldiradi — odam umuman chiqa olmasdi ("Chiqib
 * bo'lmadi"). Chiqish esa odamning qurilmasidagi qaror: server bilan
 * kelishuvsiz ham bajarilishi shart. Refresh token serverda o'z
 * muddatida eskiradi.
 */
export async function sessiyaniQurilmadaTozala(): Promise<void> {
  const kalit = sessiyaKaliti()
  if (ilovaNativemi()) {
    await nativeSaqlagich.removeItem(kalit)
    await nativeSaqlagich.removeItem(`${kalit}-code-verifier`)
    return
  }
  // Veb: sessiya kukida (katta bo'lsa `.0`, `.1` bo'laklarga bo'linadi)
  for (const qism of document.cookie.split(';')) {
    const nom = qism.split('=')[0]?.trim()
    if (nom && nom.startsWith(kalit)) {
      document.cookie = `${nom}=; Max-Age=0; path=/`
    }
  }
  try {
    window.localStorage.removeItem(kalit)
  } catch {
    // Saqlagichga kirib bo'lmasa — kuki baribir o'chdi
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
