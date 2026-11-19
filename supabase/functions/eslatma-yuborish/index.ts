// =============================================================
// Samara — vaqti kelgan vazifalar uchun push bildirishnoma
// =============================================================
// Har daqiqada pg_cron chaqiradi. Vaqti kelgan, hali eslatilmagan
// vazifalarni topadi va foydalanuvchining barcha qurilmalariga
// bildirishnoma yuboradi.
//
// Nega server tomonda: ilova yopiq bo'lsa ham bildirishnoma kelishi
// kerak, shuning uchun uni brauzer emas, server yuboradi.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@samara.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

type Eslatma = {
  task_id: string
  user_id: string
  sarlavha: string
  endpoint: string
  p256dh: string
  auth: string
}

Deno.serve(async () => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY)

  const { data, error } = await sb.rpc('kutilayotgan_eslatmalar')
  if (error) {
    return Response.json({ xato: error.message }, { status: 500 })
  }

  const eslatmalar = (data ?? []) as Eslatma[]
  if (eslatmalar.length === 0) {
    return Response.json({ yuborildi: 0, vazifalar: 0 })
  }

  let yuborildi = 0
  const eskirganObunalar: string[] = []
  // Bitta vazifada bir nechta qurilma bo'lishi mumkin — vazifani
  // faqat kamida bitta qurilmaga yetib borgandan keyin belgilaymiz
  const muvaffaqiyatli = new Set<string>()

  await Promise.all(
    eslatmalar.map(async (e) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: e.endpoint,
            keys: { p256dh: e.p256dh, auth: e.auth },
          },
          JSON.stringify({
            sarlavha: 'Vazifa vaqti keldi',
            matn: e.sarlavha,
            yol: '/bugun',
          })
        )
        yuborildi++
        muvaffaqiyatli.add(e.task_id)
      } catch (xato) {
        // 404/410 — obuna o'chirilgan yoki eskirgan, tozalaymiz
        const kod = (xato as { statusCode?: number }).statusCode
        if (kod === 404 || kod === 410) eskirganObunalar.push(e.endpoint)
      }
    })
  )

  if (muvaffaqiyatli.size > 0) {
    await sb.rpc('eslatma_yuborildi', { vazifalar: [...muvaffaqiyatli] })
  }

  if (eskirganObunalar.length > 0) {
    await sb
      .from('push_subscriptions')
      .delete()
      .in('endpoint', eskirganObunalar)
  }

  // -----------------------------------------------------------
  // Yangi topshiriqlar
  // -----------------------------------------------------------
  // Alohida RPC: `kutilayotgan_eslatmalar` ga tegilmagan, shuning
  // uchun bu funksiya eski holida ham ishlayveradi — faqat topshiriq
  // bildirishnomalari bo'lmaydi.
  const topshiriqNatija = await topshiriqlarniYubor(sb)

  return Response.json({
    yuborildi,
    vazifalar: muvaffaqiyatli.size,
    tozalangan: eskirganObunalar.length,
    topshiriqlar: topshiriqNatija,
  })
})

type TopshiriqXabari = {
  topshiriq_id: string
  sarlavha: string
  yuboruvchi: string
  endpoint: string
  p256dh: string
  auth: string
}

async function topshiriqlarniYubor(
  sb: ReturnType<typeof createClient>
): Promise<{ yuborildi: number; topshiriqlar: number }> {
  const { data, error } = await sb.rpc('kutilayotgan_topshiriqlar')
  // Migratsiya hali qo'llanmagan bo'lsa shu yerda to'xtaymiz —
  // oddiy eslatmalar baribir yuborilgan bo'ladi
  if (error) return { yuborildi: 0, topshiriqlar: 0 }

  const xabarlar = (data ?? []) as TopshiriqXabari[]
  if (xabarlar.length === 0) return { yuborildi: 0, topshiriqlar: 0 }

  let yuborildi = 0
  const belgilanadi = new Set<string>()
  const eskirgan: string[] = []

  await Promise.all(
    xabarlar.map(async (x) => {
      try {
        await webpush.sendNotification(
          { endpoint: x.endpoint, keys: { p256dh: x.p256dh, auth: x.auth } },
          JSON.stringify({
            sarlavha: x.yuboruvchi
              ? `Yangi topshiriq — ${x.yuboruvchi}`
              : 'Yangi topshiriq',
            matn: x.sarlavha,
            yol: '/topshiriqlar',
          })
        )
        yuborildi++
        belgilanadi.add(x.topshiriq_id)
      } catch (xato) {
        const kod = (xato as { statusCode?: number }).statusCode
        if (kod === 404 || kod === 410) eskirgan.push(x.endpoint)
      }
    })
  )

  if (belgilanadi.size > 0) {
    await sb.rpc('topshiriq_bildirildi', { topshiriqlar: [...belgilanadi] })
  }
  if (eskirgan.length > 0) {
    await sb.from('push_subscriptions').delete().in('endpoint', eskirgan)
  }

  return { yuborildi, topshiriqlar: belgilanadi.size }
}
