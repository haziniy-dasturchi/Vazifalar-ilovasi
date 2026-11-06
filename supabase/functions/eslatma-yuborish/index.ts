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

  return Response.json({
    yuborildi,
    vazifalar: muvaffaqiyatli.size,
    tozalangan: eskirganObunalar.length,
  })
})
