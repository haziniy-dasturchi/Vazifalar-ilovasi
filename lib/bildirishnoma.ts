'use client'

import { createClient } from '@/lib/supabase/client'

/**
 * VAPID ochiq kaliti.
 *
 * Bu ataylab kodda turadi: u brauzerga baribir yuboriladi va
 * maxfiy emas. Maxfiy juftligi faqat Supabase sirlarida saqlanadi
 * va serverda bildirishnomani imzolash uchun ishlatiladi.
 */
const VAPID_OCHIQ_KALIT =
  'BCEIQsau7ki4XaRzC2JjpbnxZ3IeacRvWhrq60VDH_JnCpHQeJV1rzkp6KcafmdK9LJJOTYbnkhxVZw1W6n6ccU'

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
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Hozirgi holat — tugmani to'g'ri ko'rsatish uchun */
export async function bildirishnomaHolati(): Promise<BildirishnomaHolati> {
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
  const reg = await navigator.serviceWorker.getRegistration()
  const obuna = await reg?.pushManager.getSubscription()
  if (!obuna) return 'yoqilmagan'

  const manzil = obuna.endpoint
  await obuna.unsubscribe()
  await createClient().from('push_subscriptions').delete().eq('endpoint', manzil)
  return 'yoqilmagan'
}
