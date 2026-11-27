// =============================================================
// Samara — vaqti kelgan vazifalar uchun push bildirishnoma
// =============================================================
// Har daqiqada pg_cron chaqiradi. Vaqti kelgan, hali eslatilmagan
// vazifalarni topadi va foydalanuvchining barcha qurilmalariga
// bildirishnoma yuboradi.
//
// Nega server tomonda: ilova yopiq bo'lsa ham bildirishnoma kelishi
// kerak, shuning uchun uni brauzer emas, server yuboradi.
//
// Ikki yo'l bor (`push_subscriptions.platform`):
//   web            -> Web Push (VAPID, `web-push` kutubxonasi)
//   android / ios  -> Firebase Cloud Messaging (FCM HTTP v1)
// Capacitor WebView'da `PushManager` ishlamaydi, shuning uchun
// appdagi qurilmalar FCM orqali, veb qurilmalar esa eskisidek
// Web Push orqali oladi.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { SignJWT, importPKCS8 } from 'npm:jose@6.2.15'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@samara.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

type XabarYoli = '/bugun' | '/topshiriqlar' | `/topshiriq?id=${string}`

type Obuna = {
  platform: string
  endpoint: string | null
  p256dh: string | null
  auth: string | null
  fcm_token: string | null
}

/**
 * FCM HTTP v1 — OAuth2 kirish tokeni.
 *
 * `npm:jose` DEB ATALGAN Node kutubxonasi Edge Function muhitida (Deno)
 * ham ishlaydi — shuning uchun `firebase-admin` kabi og'ir SDK shart
 * emas, JWT'ni o'zimiz imzolaymiz.
 *
 * Token 1 soatga yaroqli; har chaqiruvda qayta so'ramaslik uchun
 * modul darajasida keshlab qo'yamiz (Edge Function "issiq" bo'lsa,
 * keyingi chaqiruv shu keshdan foydalanadi).
 *
 * Bir nechta qurilmaga BIR VAQTDA (`Promise.all`) yuborilgani uchun
 * TUGAMAGAN so'rov ham keshlanadi — aks holda har bir qurilma uchun
 * Google'ga alohida OAuth2 so'rovi ketib, bekorga sekinlashtirardi.
 */
let fcmSirKesh: { client_email: string; private_key: string; token_uri: string; project_id: string } | null = null
let fcmTokenKesh: { token: string; amal_qiladi: number } | null = null
let fcmTokenSorovi: Promise<string> | null = null

function fcmSir() {
  if (fcmSirKesh) return fcmSirKesh
  const xomSir = Deno.env.get('FIREBASE_SERVICE_ACCOUNT')
  if (!xomSir) return null
  fcmSirKesh = JSON.parse(xomSir)
  return fcmSirKesh
}

async function fcmKirishTokeniniOl(sir: NonNullable<typeof fcmSirKesh>): Promise<string> {
  const maxfiyKalit = await importPKCS8(sir.private_key, 'RS256')
  const hozir = Math.floor(Date.now() / 1000)
  const jwt = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(hozir)
    .setIssuer(sir.client_email)
    .setSubject(sir.client_email)
    .setAudience(sir.token_uri)
    .setExpirationTime(hozir + 3600)
    .sign(maxfiyKalit)

  const javob = await fetch(sir.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!javob.ok) throw new Error(`FCM OAuth2 xato: ${javob.status}`)

  const { access_token, expires_in } = (await javob.json()) as {
    access_token: string
    expires_in: number
  }
  // 60 soniya zaxira — soat chegarasida eskirgan token bilan so'rov
  // yubormaslik uchun
  fcmTokenKesh = { token: access_token, amal_qiladi: Date.now() + (expires_in - 60) * 1000 }
  return access_token
}

async function fcmKirishTokeni(): Promise<string | null> {
  const sir = fcmSir()
  if (!sir) return null

  if (fcmTokenKesh && fcmTokenKesh.amal_qiladi > Date.now()) {
    return fcmTokenKesh.token
  }

  if (!fcmTokenSorovi) {
    fcmTokenSorovi = fcmKirishTokeniniOl(sir).finally(() => {
      fcmTokenSorovi = null
    })
  }
  return fcmTokenSorovi
}

/**
 * Bitta obunaga yuboradi — platformaga qarab FCM yoki Web Push.
 * Obuna eskirgan/o'chirilgan bo'lsa `eskirganmi: true` qaytaradi,
 * chaqiruvchi shu bo'yicha bazadan tozalaydi.
 */
async function bittaYubor(
  obuna: Obuna,
  sarlavha: string,
  matn: string,
  yol: XabarYoli
): Promise<{ yubordi: boolean; eskirganmi: boolean }> {
  if (obuna.platform === 'web') {
    if (!obuna.endpoint || !obuna.p256dh || !obuna.auth) {
      return { yubordi: false, eskirganmi: true }
    }
    try {
      await webpush.sendNotification(
        { endpoint: obuna.endpoint, keys: { p256dh: obuna.p256dh, auth: obuna.auth } },
        JSON.stringify({ sarlavha, matn, yol })
      )
      return { yubordi: true, eskirganmi: false }
    } catch (xato) {
      const kod = (xato as { statusCode?: number }).statusCode
      return { yubordi: false, eskirganmi: kod === 404 || kod === 410 }
    }
  }

  // android / ios -> FCM
  if (!obuna.fcm_token) return { yubordi: false, eskirganmi: true }

  const kirishTokeni = await fcmKirishTokeni()
  const sir = fcmSir()
  if (!kirishTokeni || !sir) {
    // FIREBASE_SERVICE_ACCOUNT hali sozlanmagan — appdagilar hozircha
    // bildirishnoma ololmaydi, lekin veb qurilmalarga xalaqit bermasin
    return { yubordi: false, eskirganmi: false }
  }

  const javob = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sir.project_id}/messages:send`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kirishTokeni}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          token: obuna.fcm_token,
          notification: { title: sarlavha, body: matn },
          data: { yol },
        },
      }),
    }
  )
  if (javob.ok) return { yubordi: true, eskirganmi: false }

  const xatoBadani = await javob.json().catch(() => null)
  const holat = (xatoBadani as { error?: { status?: string } } | null)?.error?.status
  const eskirganmi = javob.status === 404 || holat === 'UNREGISTERED' || holat === 'NOT_FOUND'
  return { yubordi: false, eskirganmi }
}

Deno.serve(async () => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  /*
    Ikkala ish ham MUSTAQIL bajariladi.

    Avval bu yerda "vaqti kelgan vazifa yo'q bo'lsa — darhol
    qaytamiz" degan satr bor edi. Oqibati og'ir bo'ldi: aksariyat
    daqiqalarda eslatiladigan vazifa bo'lmaydi, funksiya o'sha
    yerda to'xtab qolardi va pastdagi TOPSHIRIQ kodiga umuman
    yetib bormasdi. Natijada topshiriq bildirishnomasi hech
    qachon yuborilmasdi, vazifa eslatmasi esa ishlayverardi —
    shuning uchun muammo uzoq vaqt ko'rinmay turdi.
  */
  const vazifaNatija = await vazifalarniYubor(sb)
  const topshiriqNatija = await topshiriqlarniYubor(sb)
  const xabarNatija = await topshiriqXabarlariniYubor(sb)

  return Response.json({
    vazifalar: vazifaNatija,
    topshiriqlar: topshiriqNatija,
    xabarlar: xabarNatija,
  })
})

/**
 * Topshiriq hayotidagi voqealar: tekshiruvga keldi, qaytarildi,
 * tasdiqlandi, yangi izoh, jamoada yangi topshiriq, muddat
 * yaqinlashdi / o'tdi. Navbatni bazadagi triggerlar to'ldiradi,
 * muddat xabarlarini esa shu yerda har daqiqada tekshiramiz.
 */
async function topshiriqXabarlariniYubor(
  sb: ReturnType<typeof createClient>
): Promise<{ yuborildi: number; xabarlar: number }> {
  // Migratsiya qo'llanmagan bo'lsa ikkalasi ham xato beradi — jim o'tamiz
  await sb.rpc('topshiriq_muddat_xabarlari')
  const { data, error } = await sb.rpc('kutilayotgan_topshiriq_xabarlari')
  if (error) return { yuborildi: 0, xabarlar: 0 }

  type Xabar = Obuna & {
    xabar_id: number
    topshiriq_id: string | null
    sarlavha: string
    matn: string
  }
  const xabarlar = (data ?? []) as Xabar[]
  if (xabarlar.length === 0) return { yuborildi: 0, xabarlar: 0 }

  let yuborildi = 0
  const belgilanadi = new Set<number>()
  const eskirganEndpointlar: string[] = []
  const eskirganFcmTokenlar: string[] = []

  await Promise.all(
    xabarlar.map(async (x) => {
      // Bosilganda aynan shu topshiriq (va uning chati) ochilsin
      const yol: XabarYoli = x.topshiriq_id ? `/topshiriq?id=${x.topshiriq_id}` : '/topshiriqlar'
      const natija = await bittaYubor(x, x.sarlavha, x.matn, yol)
      if (natija.yubordi) {
        yuborildi++
        belgilanadi.add(x.xabar_id)
      }
      if (natija.eskirganmi) {
        if (x.platform === 'web' && x.endpoint) eskirganEndpointlar.push(x.endpoint)
        if (x.platform !== 'web' && x.fcm_token) eskirganFcmTokenlar.push(x.fcm_token)
      }
    })
  )

  if (belgilanadi.size > 0) {
    await sb.rpc('topshiriq_xabarlari_yuborildi', { p_idlar: [...belgilanadi] })
  }
  await eskirganObunalarniTozala(sb, eskirganEndpointlar, eskirganFcmTokenlar)
  return { yuborildi, xabarlar: belgilanadi.size }
}

async function vazifalarniYubor(
  sb: ReturnType<typeof createClient>
): Promise<{ yuborildi: number; vazifalar: number; tozalangan: number }> {
  const bosh = { yuborildi: 0, vazifalar: 0, tozalangan: 0 }

  const { data, error } = await sb.rpc('kutilayotgan_eslatmalar')
  if (error) return bosh

  type Eslatma = Obuna & { task_id: string; sarlavha: string }
  const eslatmalar = (data ?? []) as Eslatma[]
  if (eslatmalar.length === 0) return bosh

  let yuborildi = 0
  const eskirganEndpointlar: string[] = []
  const eskirganFcmTokenlar: string[] = []
  // Bitta vazifada bir nechta qurilma bo'lishi mumkin — vazifani
  // faqat kamida bitta qurilmaga yetib borgandan keyin belgilaymiz
  const muvaffaqiyatli = new Set<string>()

  await Promise.all(
    eslatmalar.map(async (e) => {
      const natija = await bittaYubor(e, 'Vazifa vaqti keldi', e.sarlavha, '/bugun')
      if (natija.yubordi) {
        yuborildi++
        muvaffaqiyatli.add(e.task_id)
      }
      if (natija.eskirganmi) {
        if (e.platform === 'web' && e.endpoint) eskirganEndpointlar.push(e.endpoint)
        if (e.platform !== 'web' && e.fcm_token) eskirganFcmTokenlar.push(e.fcm_token)
      }
    })
  )

  if (muvaffaqiyatli.size > 0) {
    await sb.rpc('eslatma_yuborildi', { vazifalar: [...muvaffaqiyatli] })
  }

  await eskirganObunalarniTozala(sb, eskirganEndpointlar, eskirganFcmTokenlar)

  return {
    yuborildi,
    vazifalar: muvaffaqiyatli.size,
    tozalangan: eskirganEndpointlar.length + eskirganFcmTokenlar.length,
  }
}

async function topshiriqlarniYubor(
  sb: ReturnType<typeof createClient>
): Promise<{ yuborildi: number; topshiriqlar: number }> {
  const { data, error } = await sb.rpc('kutilayotgan_topshiriqlar')
  // Migratsiya hali qo'llanmagan bo'lsa shu yerda to'xtaymiz —
  // oddiy eslatmalar baribir yuborilgan bo'ladi
  if (error) return { yuborildi: 0, topshiriqlar: 0 }

  type TopshiriqXabari = Obuna & { topshiriq_id: string; sarlavha: string; yuboruvchi: string }
  const xabarlar = (data ?? []) as TopshiriqXabari[]
  if (xabarlar.length === 0) return { yuborildi: 0, topshiriqlar: 0 }

  let yuborildi = 0
  const belgilanadi = new Set<string>()
  const eskirganEndpointlar: string[] = []
  const eskirganFcmTokenlar: string[] = []

  await Promise.all(
    xabarlar.map(async (x) => {
      const sarlavha = x.yuboruvchi ? `Yangi topshiriq — ${x.yuboruvchi}` : 'Yangi topshiriq'
      const natija = await bittaYubor(x, sarlavha, x.sarlavha, '/topshiriqlar')
      if (natija.yubordi) {
        yuborildi++
        belgilanadi.add(x.topshiriq_id)
      }
      if (natija.eskirganmi) {
        if (x.platform === 'web' && x.endpoint) eskirganEndpointlar.push(x.endpoint)
        if (x.platform !== 'web' && x.fcm_token) eskirganFcmTokenlar.push(x.fcm_token)
      }
    })
  )

  if (belgilanadi.size > 0) {
    await sb.rpc('topshiriq_bildirildi', { p_idlar: [...belgilanadi] })
  }

  await eskirganObunalarniTozala(sb, eskirganEndpointlar, eskirganFcmTokenlar)

  return { yuborildi, topshiriqlar: belgilanadi.size }
}

async function eskirganObunalarniTozala(
  sb: ReturnType<typeof createClient>,
  endpointlar: string[],
  fcmTokenlar: string[]
): Promise<void> {
  if (endpointlar.length > 0) {
    await sb.from('push_subscriptions').delete().in('endpoint', endpointlar)
  }
  if (fcmTokenlar.length > 0) {
    await sb.from('push_subscriptions').delete().in('fcm_token', fcmTokenlar)
  }
}
