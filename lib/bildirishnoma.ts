'use client'

import { createClient } from '@/lib/supabase/client'
import { ilovaNativemi, nativePlatforma } from '@/lib/platform'

/**
 * VAPID ochiq kaliti.
 *
 * Bu ataylab kodda turadi: u brauzerga baribir yuboriladi va
 * maxfiy emas. Maxfiy juftligi faqat Supabase sirlarida saqlanadi
 * va serverda bildirishnomani imzolash uchun ishlatiladi.
 *
 * Faqat veb uchun — appda Web Push/`PushManager` umuman ishlamaydi,
 * shuning uchun u yerda Firebase (FCM) qurilma tokeni ishlatiladi
 * (pastdagi `native*` funksiyalar).
 */
const VAPID_OCHIQ_KALIT =
  'BCEIQsau7ki4XaRzC2JjpbnxZ3IeacRvWhrq60VDH_JnCpHQeJV1rzkp6KcafmdK9LJJOTYbnkhxVZw1W6n6ccU'

/** FCM qurilma tokeni shu yerda saqlanadi — qayta ro'yxatdan
 *  o'tmasdan "yoqilganmi" ekanini bilish va o'chirishda bazadan
 *  topish uchun (Capacitor'da brauzerdagi kabi `getSubscription()`
 *  yo'q — token faqat `register()` chaqirilganda keladi). */
const FCM_TOKEN_KALIT = 'samara-fcm-token'

export type BildirishnomaHolati =
  | 'qollab-quvvatlanmaydi'
  | 'rad-etilgan'
  | 'yoqilmagan'
  | 'yoqilgan'

/** base64url -> Uint8Array (PushManager shuni talab qiladi) */
function kalitniOgirish(base64: string): Uint8Array<ArrayBuffer> {
  const toldirilgan = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const xom = atob(toldirilgan)
  const natija = new Uint8Array(new ArrayBuffer(xom.length))
  for (let i = 0; i < xom.length; i++) natija[i] = xom.charCodeAt(i)
  return natija
}

export function qollabQuvvatlaydimi(): boolean {
  // Appda plagin har doim bor — faqat veb uchun brauzer API'si tekshiriladi
  if (ilovaNativemi()) return true
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Hozirgi holat — tugmani to'g'ri ko'rsatish uchun */
export async function bildirishnomaHolati(): Promise<BildirishnomaHolati> {
  if (ilovaNativemi()) return nativeHolati()
  if (!qollabQuvvatlaydimi()) return 'qollab-quvvatlanmaydi'
  if (Notification.permission === 'denied') return 'rad-etilgan'

  const reg = await navigator.serviceWorker.getRegistration()
  const obuna = await reg?.pushManager.getSubscription()
  return obuna ? 'yoqilgan' : 'yoqilmagan'
}

/**
 * Ruxsat so'rab, qurilmani ro'yxatga oladi.
 * Obuna bazada saqlanadi — server o'sha manzilga xabar yuboradi.
 */
export async function bildirishnomaniYoqish(): Promise<BildirishnomaHolati> {
  if (ilovaNativemi()) return nativeniYoqish()
  if (!qollabQuvvatlaydimi()) return 'qollab-quvvatlanmaydi'

  const ruxsat = await Notification.requestPermission()
  if (ruxsat !== 'granted') {
    return ruxsat === 'denied' ? 'rad-etilgan' : 'yoqilmagan'
  }

  const reg = await navigator.serviceWorker.ready
  const obuna =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: kalitniOgirish(VAPID_OCHIQ_KALIT),
    }))

  const json = obuna.toJSON()
  const supabase = createClient()
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!userId) throw new Error('Sessiya topilmadi')

  // Bir qurilma bir marta: endpoint noyob, qayta yozilaveradi
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      platform: 'web',
      endpoint: obuna.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error

  return 'yoqilgan'
}

/** Qurilmani ro'yxatdan chiqarish */
export async function bildirishnomaniOchirish(): Promise<BildirishnomaHolati> {
  if (ilovaNativemi()) return nativeniOchirish()

  const reg = await navigator.serviceWorker.getRegistration()
  const obuna = await reg?.pushManager.getSubscription()
  if (!obuna) return 'yoqilmagan'

  const manzil = obuna.endpoint
  await obuna.unsubscribe()
  await createClient().from('push_subscriptions').delete().eq('endpoint', manzil)
  return 'yoqilmagan'
}

// =============================================================
// Native (Android/iOS) — Firebase Cloud Messaging
// =============================================================
// Brauzerdagi kabi "joriy obunani o'qish" imkoni yo'q: token faqat
// `register()` chaqirilganda, bir martalik hodisa sifatida keladi.
// Shuning uchun uni mahalliy saqlab qo'yamiz (`@capacitor/preferences`) —
// aks holda har safar holatni bilish uchun qayta ro'yxatdan o'tkazib,
// foydalanuvchiga keraksiz ruxsat so'rovi ko'rsatilardi.

async function nativeHolati(): Promise<BildirishnomaHolati> {
  const [{ PushNotifications }, { Preferences }] = await Promise.all([
    import('@capacitor/push-notifications'),
    import('@capacitor/preferences'),
  ])

  const ruxsat = await PushNotifications.checkPermissions()
  if (ruxsat.receive === 'denied') return 'rad-etilgan'

  const { value } = await Preferences.get({ key: FCM_TOKEN_KALIT })
  return ruxsat.receive === 'granted' && value ? 'yoqilgan' : 'yoqilmagan'
}

async function nativeniYoqish(): Promise<BildirishnomaHolati> {
  const [{ PushNotifications }, { Preferences }] = await Promise.all([
    import('@capacitor/push-notifications'),
    import('@capacitor/preferences'),
  ])

  const ruxsat = await PushNotifications.requestPermissions()
  if (ruxsat.receive !== 'granted') {
    return ruxsat.receive === 'denied' ? 'rad-etilgan' : 'yoqilmagan'
  }

  // Token `register()`dan qaytmaydi — 'registration' hodisasi orqali
  // keladi, shuning uchun promise bilan o'raymiz
  const token = await new Promise<string>((resolve, reject) => {
    let tokenTinglovchi: { remove: () => void } | undefined
    let xatoTinglovchi: { remove: () => void } | undefined
    // Firebase javob bermasa (masalan, Play xizmatlari yo'q) tugma
    // abadiy "band" bo'lib qolmasin
    const muddat = setTimeout(() => {
      tinglovchilarniOchir()
      reject(new Error('FCM token kelmadi'))
    }, 20_000)
    function tinglovchilarniOchir() {
      clearTimeout(muddat)
      tokenTinglovchi?.remove()
      xatoTinglovchi?.remove()
    }

    PushNotifications.addListener('registration', ({ value }) => {
      tinglovchilarniOchir()
      resolve(value)
    }).then((t) => {
      tokenTinglovchi = t
    })

    PushNotifications.addListener('registrationError', (xato) => {
      tinglovchilarniOchir()
      reject(new Error(xato.error))
    }).then((t) => {
      xatoTinglovchi = t
    })

    PushNotifications.register()
  })

  const platforma = nativePlatforma()
  if (!platforma) throw new Error('Platforma aniqlanmadi')

  // RPC orqali: token shu telefonda avval boshqa hisobga biriktirilgan
  // bo'lsa ham joriy foydalanuvchiga ko'chiriladi (oddiy upsert buni
  // RLS tufayli qila olmaydi). Izoh: migratsiya 20261124120000
  const { error } = await createClient().rpc('fcm_tokenni_saqlash', {
    p_token: token,
    p_platform: platforma,
  })
  if (error) throw error

  await Preferences.set({ key: FCM_TOKEN_KALIT, value: token })
  return 'yoqilgan'
}

async function nativeniOchirish(): Promise<BildirishnomaHolati> {
  const { Preferences } = await import('@capacitor/preferences')
  const { value: token } = await Preferences.get({ key: FCM_TOKEN_KALIT })
  if (!token) return 'yoqilmagan'

  await createClient().from('push_subscriptions').delete().eq('fcm_token', token)
  await Preferences.remove({ key: FCM_TOKEN_KALIT })
  return 'yoqilmagan'
}
