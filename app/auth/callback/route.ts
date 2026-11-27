import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Google'dan qaytgan kodni sessiyaga almashtiradi.
 * Google Cloud Console'dagi redirect URL shu manzilga ishora qiladi.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Faqat o'z saytimizdagi yo'l: "//boshqa-sayt.uz" kabi qiymat
  // foydalanuvchini begona saytga olib ketmasin (ochiq yo'naltirish)
  const soralgan = searchParams.get('keyin') ?? ''
  const keyin =
    soralgan.startsWith('/') && !soralgan.startsWith('//') && !soralgan.startsWith('/\\')
      ? soralgan
      : '/jarayonda'

  if (!code) {
    return NextResponse.redirect(`${origin}/kirish?xato=kod_yoq`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/kirish?xato=sessiya`)
  }

  // Proksi ortida ishlaganda to'g'ri manzilni tanlaymiz
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocal = process.env.NODE_ENV === 'development'
  const base = isLocal || !forwardedHost ? origin : `https://${forwardedHost}`

  return NextResponse.redirect(`${base}${keyin}`)
}
