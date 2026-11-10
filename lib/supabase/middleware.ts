import { createServerClient } from '@supabase/ssr'
import { createRemoteJWKSet, errors, jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { supabaseAnonKey, supabaseUrl } from '@/lib/env'

/**
 * Kirish talab qilinmaydigan yo'llar.
 *
 * Huquqiy sahifalar ham shu yerda: Google Play va App Store ularni
 * tekshiruvchi robotlar bilan ochadi, robotlar esa login qila
 * olmaydi. Kirish talab qilinsa, ariza rad etiladi.
 */
const PUBLIC_PATHS = [
  '/kirish',
  '/auth',
  '/maxfiylik',
  '/shartlar',
  '/hisobni-ochirish',
  '/.well-known',
]

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

/** Sessiya kukisi qancha yashashi — Supabase'ning o'z muddati bilan bir xil */
const KUKI_MUDDATI = 400 * 24 * 60 * 60

/**
 * Sessiya bir nechta kukiga bo'lingan bo'lishi mumkin (nomi, nomi.0,
 * nomi.1 ...). Hammasini nomi bilan birga qaytaradi.
 */
function sessiyaKukilari(
  request: NextRequest
): { nom: string; qiymat: string }[] {
  const natija: { nom: string; qiymat: string }[] = []

  const yagona = request.cookies.get(KUKI_NOMI)?.value
  if (yagona) natija.push({ nom: KUKI_NOMI, qiymat: yagona })

  for (let i = 0; ; i++) {
    const nom = `${KUKI_NOMI}.${i}`
    const qiymat = request.cookies.get(nom)?.value
    if (!qiymat) break
    natija.push({ nom, qiymat })
  }

  return natija
}

/**
 * Sessiya cookie'sidan access_token'ni o'zimiz, to'liq nazorat ostida
 * o'qiymiz. Buzilgan/noto'g'ri formatdagi qiymat uchraganda shunchaki
 * `null` qaytaradi — @supabase/ssr'ning o'z ichki tiklash mantig'iga
 * umuman murojaat qilinmaydi, shu sababli u yerdagi kutilmagan
 * xatolarga duch kelmaymiz.
 */
function kukidanTokenniOl(kukilar: { qiymat: string }[]): string | null {
  if (kukilar.length === 0) return null
  const xom = kukilar.map((k) => k.qiymat).join('')

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
 * Sessiya kukilarini SERVER tomonidan qayta yozamiz.
 *
 * Nega kerak: Safari (iPhone, iPad va Mac) JavaScript orqali yozilgan
 * kukilarga atigi 7 kun muddat qo'yadi. Supabase mijozi esa kukini
 * aynan JavaScript orqali yozadi. Natijada iOS va Mac foydalanuvchilari
 * sessiyasini tez yo'qotib, qaytadan login qilishga majbur bo'lardi —
 * aynan shu "har safar login so'ramoqda" shikoyati.
 *
 * Server javobidagi Set-Cookie bu cheklovga tushmaydi. Shuning uchun
 * har bir sahifa ochilishida xuddi shu qiymatni server nomidan qayta
 * yozamiz: qo'shimcha tarmoq so'rovi yo'q, lekin kuki endi uzoq
 * yashaydigan bo'lib qoladi.
 */
function kukilarniUzaytir(
  response: NextResponse,
  request: NextRequest,
  kukilar: { nom: string; qiymat: string }[]
) {
  for (const { nom, qiymat } of kukilar) {
    response.cookies.set(nom, qiymat, {
      path: '/',
      maxAge: KUKI_MUDDATI,
      sameSite: 'lax',
      // Supabase mijozi kukini brauzerda o'qiy olishi shart
      httpOnly: false,
      secure: request.nextUrl.protocol === 'https:',
    })
  }
}

/**
 * Tokenni tekshirishdagi xato HAQIQATAN tokenning yaroqsizligini
 * bildiradimi?
 *
 * Buni ajratish muhim: "imzo to'g'ri kelmadi" bilan "ochiq kalitlarni
 * internetdan yuklab bo'lmadi" mutlaqo boshqa narsa. Birinchisi —
 * chiqarib yuborish uchun asos, ikkinchisi — bizning tomondagi
 * vaqtinchalik nosozlik. Ro'yxatga kirmagan har qanday xato
 * (tarmoq uzilishi, DNS, timeout) ehtiyotkorlik yuzasidan
 * "vaqtinchalik" deb qaraladi va sessiya saqlanib qoladi.
 */
function haqiqiyRad(xato: unknown): boolean {
  return (
    xato instanceof errors.JWSSignatureVerificationFailed ||
    xato instanceof errors.JWSInvalid ||
    xato instanceof errors.JWTInvalid ||
    xato instanceof errors.JWTClaimValidationFailed ||
    xato instanceof errors.JOSEAlgNotAllowed ||
    xato instanceof errors.JWKSNoMatchingKey
  )
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
 * deyarli zudlik bilan ishlaydi.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  const kukilar = sessiyaKukilari(request)
  const token = kukidanTokenniOl(kukilar)

  let user = null
  /** Sessiya bor, lekin hozir tasdiqlab bo'lmadi (tarmoq nosozligi) */
  let tasdiqlanmadi = false
  /** Token yangilandi — eski kukini qayta yozib yubormaslik uchun */
  let yangilandi = false

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `${supabaseUrl()}/auth/v1`,
        audience: 'authenticated',
      })
      user = payload
    } catch (xato) {
      if (xato instanceof errors.JWTExpired) {
        // Muddati o'tgan — refresh token orqali yangilashga urinamiz
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
                  response.cookies.set(name, value, {
                    ...options,
                    maxAge: KUKI_MUDDATI,
                  })
                }
                yangilandi = true
              },
            },
          }
        )

        try {
          const { data, error } = await supabase.auth.getUser()
          user = data.user

          // MUHIM: yangilash muvaffaqiyatsiz tugashining ikki sababi
          // bor va ularni ajratish shart.
          //
          //   * Refresh token haqiqatan yaroqsiz (status 400/401) —
          //     bu haqiqiy chiqish, /kirish'ga yo'naltiramiz.
          //   * Tarmoq nosozligi (status yo'q) — telefonda juda keng
          //     tarqalgan. Avval bu ham chiqish deb hisoblanib,
          //     foydalanuvchi aybsiz login sahifasiga uloqtirilardi.
          //     Endi sessiyani saqlab qolamiz: mijoz aloqa tiklanganda
          //     o'zi yangilaydi, ma'lumotlar esa baribir RLS bilan
          //     himoyalangan.
          if (!user && error && !error.status) tasdiqlanmadi = true
        } catch {
          // fetch butunlay yiqildi — bu ham tarmoq nosozligi
          tasdiqlanmadi = true
        }
      } else if (haqiqiyRad(xato)) {
        // Imzo yaroqsiz / token buzilgan — haqiqiy rad etish
        user = null
      } else {
        // Qolgan hamma narsa (ochiq kalitlarni yuklab bo'lmadi,
        // tarmoq uzildi...) — bizning tomondagi nosozlik.
        // Foydalanuvchini bunday holatda chiqarib yuborish adolatsiz.
        tasdiqlanmadi = true
      }
    }
  }

  const kirgan = Boolean(user) || tasdiqlanmadi

  if (!kirgan && !isPublic(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/kirish'
    url.searchParams.set('keyin', pathname)
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/kirish') {
    const url = request.nextUrl.clone()
    url.pathname = '/jarayonda'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Kuki hali yangilanmagan bo'lsa, uni server nomidan qayta yozamiz
  // (Safari'ning 7 kunlik cheklovidan qutqaradi — yuqoriga qarang)
  if (kirgan && !yangilandi) kukilarniUzaytir(response, request, kukilar)

  return response
}
