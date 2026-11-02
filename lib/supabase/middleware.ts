import { createServerClient } from '@supabase/ssr'
import { createRemoteJWKSet, errors, jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

/** Kirish talab qilinmaydigan yo'llar */
const PUBLIC_PATHS = ['/kirish', '/auth']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )
}

/**
 * Supabase'ning ochiq kalitlari (JWKS) — token imzosini TARMOQSIZ
 * tekshirish uchun. Modul darajasida bir marta yaratiladi, `jose`
 * natijani o'zi keshlaydi, shu sababli odatda qayta so'rov yubormaydi.
 */
const JWKS = createRemoteJWKSet(
  new URL(`${supabaseUrl()}/auth/v1/.well-known/jwks.json`)
)

const KUKI_NOMI = `sb-${new URL(supabaseUrl()).hostname.split('.')[0]}-auth-token`

/**
 * Sessiya cookie'sidan access_token'ni o'zimiz, to'liq nazorat ostida
 * o'qiymiz (katta sessiyalar bir nechta bo'lakka bo'linishi mumkin:
 * nomi, nomi.0, nomi.1, ...). Buzilgan/noto'g'ri formatdagi qiymat
 * uchraganda shunchaki `null` qaytaradi — @supabase/ssr'ning o'z ichki
 * tiklash mantig'iga umuman murojaat qilinmaydi, shu sababli u yerdagi
 * kutilmagan xatolarga duch kelmaymiz.
 */
function kukidanTokenniOl(request: NextRequest): string | null {
  const yagona = request.cookies.get(KUKI_NOMI)?.value
  let xom: string

  if (yagona) {
    xom = yagona
  } else {
    const boliklar: string[] = []
    for (let i = 0; ; i++) {
      const b = request.cookies.get(`${KUKI_NOMI}.${i}`)?.value
      if (!b) break
      boliklar.push(b)
    }
    if (boliklar.length === 0) return null
    xom = boliklar.join('')
  }

  try {
    const matn = xom.startsWith('base64-')
      ? Buffer.from(xom.slice(7), 'base64').toString('utf-8')
      : xom
    const sessiya = JSON.parse(matn)
    return typeof sessiya.access_token === 'string' ? sessiya.access_token : null
  } catch {
    return null
  }
}

/**
 * Har bir so'rovda sessiyani tekshiradi va kirmagan foydalanuvchini
 * /kirish sahifasiga yo'naltiradi.
 *
 * Tezlik uchun MUHIM: avval `getUser()` ishlatilardi — u HAR SAFAR
 * Supabase Auth serveriga tarmoq orqali murojaat qilardi. Telefonda,
 * ayniqsa uzoq mintaqadan (server Irlandiyada), bu har bir sahifa
 * o'tishida sezilarli kechikish qo'shardi. Endi token cookie'dan
 * o'zimiz (tarmoqsiz) olinadi va imzosi JWKS orqali mahalliy
 * tekshiriladi — bu xavfsizlik jihatidan getUser() bilan teng
 * (imzoni Supabase'ning haqiqiy kaliti bilan tasdiqlaymiz), lekin
 * deyarli zudlik bilan ishlaydi. Token muddati haqiqatan o'tgan
 * bo'lsagina (soatiga bir marta), createServerClient orqali uni
 * yangilashga urinamiz — bu holat kamdan-kam va muqarrar tarmoq
 * so'rovi talab qiladi.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  let user = null
  const token = kukidanTokenniOl(request)

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl()}/auth/v1`,
        audience: 'authenticated',
      })
      user = payload
    } catch (xato) {
      // Faqat "muddati o'tgan" holatida yangilashga urinamiz — token
      // cookie'dan to'g'ri o'qilgani allaqachon tasdiqlangan, shu
      // sababli bu yerda @supabase/ssr'ning ichki tiklash mantig'i
      // kutilmagan formatga duch kelmaydi.
      if (xato instanceof errors.JWTExpired) {
        const supabase = createServerClient<Database>(
          supabaseUrl(),
          supabaseAnonKey(),
          {
            cookies: {
              getAll() {
                return request.cookies.getAll()
              },
              setAll(cookiesToSet) {
                for (const { name, value } of cookiesToSet) {
                  request.cookies.set(name, value)
                }
                response = NextResponse.next({ request })
                for (const { name, value, options } of cookiesToSet) {
                  response.cookies.set(name, value, options)
                }
              },
            },
          }
        )

        try {
          const { data } = await supabase.auth.getUser()
          user = data.user
        } catch {
          user = null
        }
      } else {
        user = null
      }
    }
  }

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/kirish'
    url.searchParams.set('keyin', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/kirish') {
    const url = request.nextUrl.clone()
    url.pathname = '/bugun'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return response
}
