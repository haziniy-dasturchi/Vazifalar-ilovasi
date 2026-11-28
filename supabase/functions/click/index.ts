// =============================================================
// Samara — Click Shop API (xayriyalar)
// =============================================================
// Click kabinetida "Prepare URL" va "Complete URL" ikkalasiga ham
// shu funksiya manzili yoziladi:
//   https://<loyiha>.supabase.co/functions/v1/click
// (`action` maydoniga qarab o'zi ajratadi).
//
// JWT tekshiruvi O'CHIRILGAN (config.toml: verify_jwt = false) —
// Click Supabase tokeni yubormaydi. O'rniga har so'rov MD5 imzo
// bilan tekshiriladi.
//
// Sirlar (supabase secrets set ...):
//   CLICK_SERVICE_ID  — xizmat ID'si
//   CLICK_SECRET_KEY  — maxfiy kalit

import { createClient } from 'npm:@supabase/supabase-js@2'
import { crypto } from 'jsr:@std/crypto@1'
import { encodeHex } from 'jsr:@std/encoding@1/hex'
import { clickSorovi } from '../_shared/click.ts'
import { supabaseOmbor } from '../_shared/supabase-ombor.ts'

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
)
const ombor = supabaseOmbor(db)

const sozlama = {
  serviceId: Deno.env.get('CLICK_SERVICE_ID') ?? '',
  sirKalit: Deno.env.get('CLICK_SECRET_KEY') ?? '',
  async md5(matn: string) {
    const hash = await crypto.subtle.digest('MD5', new TextEncoder().encode(matn))
    return encodeHex(hash)
  },
}

const json = (tana: unknown) =>
  new Response(JSON.stringify(tana), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST' || !sozlama.sirKalit) {
    return json({ error: -8, error_note: 'Error in request from click' })
  }

  let parametrlar: Record<string, string>
  try {
    const forma = await req.formData()
    parametrlar = Object.fromEntries(
      [...forma.entries()].map(([k, v]) => [k, String(v)])
    )
  } catch {
    return json({ error: -8, error_note: 'Error in request from click' })
  }

  try {
    return json(await clickSorovi(parametrlar, ombor, sozlama))
  } catch (e) {
    console.error('click', e)
    return json({
      click_trans_id: parametrlar.click_trans_id ?? '',
      merchant_trans_id: parametrlar.merchant_trans_id ?? '',
      error: -7,
      error_note: 'Failed to update user',
    })
  }
})
