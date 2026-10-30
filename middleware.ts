import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Statik fayllardan tashqari barcha so'rovlar:
     * _next/static, _next/image, rasm va ikonka fayllari chetlab o'tiladi.
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|brand/|manifest.webmanifest|sw.js|.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
