import { createServerClient } from '@supabase/ssr'
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
 * Har bir so'rovda sessiyani yangilaydi va kirmagan foydalanuvchini
 * /kirish sahifasiga yo'naltiradi.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

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

  // MUHIM: getUser() va createServerClient orasiga kod qo'shmang —
  // sessiya yangilanishi shu chaqiruvga bog'liq.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase'ga ulanib bo'lmadi (tarmoq yoki server o'chiq).
    // Foydalanuvchini kirmagan deb hisoblaymiz — ilova 500 bermaydi.
    user = null
  }

  const { pathname } = request.nextUrl

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

  if (user) {
    // Foydalanuvchi shu yerda allaqachon tekshirildi (getUser() Supabase'ga
    // tarmoq orqali murojaat qiladi). Natijani so'rov sarlavhasi orqali
    // Server Component'larga uzatamiz — shunda ular getUser()'ni qayta
    // chaqirib, yana bir tarmoq safarini sarflamaydi. Mijoz bu sarlavhani
    // o'zi yubora olmaydi: middleware uni har doim shu yerda, haqiqiy
    // tekshiruv natijasi bilan qayta yozadi.
    const requestHeaders = new Headers(request.headers)
    const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
    requestHeaders.set(
      'x-vazifalar-user',
      JSON.stringify({
        id: user.id,
        email: user.email ?? '',
        ism:
          meta.full_name ??
          meta.name ??
          user.email?.split('@')[0] ??
          'Foydalanuvchi',
        rasm: meta.avatar_url ?? null,
      })
    )

    const yangilanganResponse = NextResponse.next({
      request: { headers: requestHeaders },
    })
    // Token yangilangan bo'lsa, sessiya cookie'lari saqlanib qolishi kerak
    for (const cookie of response.cookies.getAll()) {
      yangilanganResponse.cookies.set(cookie)
    }
    response = yangilanganResponse
  }

  return response
}
