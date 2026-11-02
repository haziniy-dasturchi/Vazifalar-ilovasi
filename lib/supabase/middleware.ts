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

  return response
}
