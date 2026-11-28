// =============================================================
// Samara — Payme Merchant API (xayriyalar)
// =============================================================
// Payme kassasining "Endpoint URL" maydoniga shu funksiya manzili
// yoziladi: https://<loyiha>.supabase.co/functions/v1/payme
//
// JWT tekshiruvi O'CHIRILGAN (config.toml: verify_jwt = false) —
// Payme Supabase tokeni yubormaydi. O'rniga Basic auth kassa kaliti
// bilan tekshiriladi.
//
// Sirlar (supabase secrets set ...):
//   PAYME_KEY       — kassaning ishlab turgan kaliti
//   PAYME_TEST_KEY  — test kaliti (ixtiyoriy, sandbox uchun)

import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  paymeRuxsatTogrimi,
  paymeRuxsatXatosi,
  paymeSorovi,
  paymeTahlilXatosi,
} from '../_shared/payme.ts'
import { supabaseOmbor } from '../_shared/supabase-ombor.ts'

const db = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } }
)
const ombor = supabaseOmbor(db)

const KALITLAR = [Deno.env.get('PAYME_KEY') ?? '', Deno.env.get('PAYME_TEST_KEY') ?? '']

// Payme har doim HTTP 200 kutadi — xato ham `error` ichida
const json = (tana: unknown) =>
  new Response(JSON.stringify(tana), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ jsonrpc: '2.0', id: null, error: { code: -32300, message: 'POST only' } })
  }

  let tana: { id?: string | number } | null
  try {
    tana = await req.json()
  } catch {
    return json(paymeTahlilXatosi())
  }

  if (!paymeRuxsatTogrimi(req.headers.get('Authorization'), KALITLAR)) {
    return json(paymeRuxsatXatosi(tana?.id ?? null))
  }

  try {
    return json(await paymeSorovi(tana, ombor))
  } catch (e) {
    console.error('payme', e)
    // Kutilmagan xato (masalan, baza) — Payme keyinroq qayta urinadi
    return json({
      jsonrpc: '2.0',
      id: tana?.id ?? null,
      error: { code: -32400, message: { uz: 'Ichki xato', ru: 'Системная ошибка', en: 'System error' } },
    })
  }
})
