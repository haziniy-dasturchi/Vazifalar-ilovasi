// =============================================================
// API qatlamini haqiqiy sessiya bilan sinash
// =============================================================
// Vaqtinchalik ikkita foydalanuvchi yaratadi, ulardan biri nomidan
// REST API va RPC chaqiradi, RLS begona ma'lumotni bermasligini
// tekshiradi, so'ng hammasini o'chiradi va sozlamalarni tiklaydi.
//
//   node tools/api-test.mjs <PROJECT_REF>
//
// Eslatma: test davomida email provayderi vaqtincha yoqiladi
// (parol bilan kirish uchun) va oxirida avvalgi holatiga qaytariladi.

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const REF = process.argv[2] ?? process.env.SUPABASE_PROJECT_REF
const tokenFile = join(root, '.secrets', 'supabase-token.txt')
const TOKEN =
  process.env.SUPABASE_ACCESS_TOKEN ??
  (existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : null)

if (!REF || !TOKEN) {
  console.error('Foydalanish: node tools/api-test.mjs <PROJECT_REF>')
  process.exit(2)
}

const BASE = `https://${REF}.supabase.co`
const MGMT = `https://api.supabase.com/v1/projects/${REF}`

let otdi = 0
const xatolar = []

function ok(nom, shart, izoh = '') {
  if (shart) {
    otdi++
    console.log(`  ok   ${nom}`)
  } else {
    xatolar.push(`${nom}${izoh ? ' — ' + izoh : ''}`)
    console.log(`  XATO ${nom}${izoh ? ' — ' + izoh : ''}`)
  }
}

function eq(nom, olingan, kutilgan) {
  const a = JSON.stringify(olingan)
  const e = JSON.stringify(kutilgan)
  ok(nom, a === e, a === e ? '' : `kutilgan ${e}, olingan ${a}`)
}

async function mgmt(yol, options = {}) {
  const r = await fetch(`${MGMT}${yol}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${yol}: ${r.status} ${t.slice(0, 200)}`)
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// Tayyorgarlik
// -------------------------------------------------------------
console.log(`\nLoyiha: ${REF}`)

const kalitlar = await mgmt('/api-keys?reveal=true')
const SERVICE = kalitlar.find((k) => k.name === 'service_role')?.api_key
const ANON = kalitlar.find((k) => k.name === 'anon')?.api_key
if (!SERVICE || !ANON) {
  console.error('Kalitlarni olib bo‘lmadi')
  process.exit(1)
}

const oldingiAuth = await mgmt('/config/auth')
const EMAIL_HOLATI = oldingiAuth.external_email_enabled

const PAROL = 'Test-' + Math.random().toString(36).slice(2, 12) + '-Aa1!'
const A = { email: `api-test-a-${Date.now()}@example.com`, id: null, jwt: null }
const B = { email: `api-test-b-${Date.now()}@example.com`, id: null, jwt: null }

async function admin(yol, options = {}) {
  const r = await fetch(`${BASE}/auth/v1${yol}`, {
    ...options,
    headers: {
      apikey: SERVICE,
      Authorization: `Bearer ${SERVICE}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const t = await r.text()
  if (!r.ok) throw new Error(`${yol}: ${r.status} ${t.slice(0, 200)}`)
  return t ? JSON.parse(t) : null
}

/** Foydalanuvchi JWT si bilan REST so'rovi */
async function rest(jwt, yol, options = {}) {
  const r = await fetch(`${BASE}/rest/v1${yol}`, {
    ...options,
    headers: {
      apikey: ANON,
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const t = await r.text()
  let tana = null
  try {
    tana = t ? JSON.parse(t) : null
  } catch {
    tana = t
  }
  return { status: r.status, tana }
}

try {
  // -----------------------------------------------------------
  console.log('\n== 0. Tayyorgarlik ==')
  if (!EMAIL_HOLATI) {
    await mgmt('/config/auth', {
      method: 'PATCH',
      body: JSON.stringify({ external_email_enabled: true }),
    })

    // Auth xizmati yangi sozlamani darhol qabul qilmaydi — tarqalishini kutamiz
    let yoqildi = false
    for (let i = 0; i < 20 && !yoqildi; i++) {
      await new Promise((r) => setTimeout(r, 1500))
      const sozlama = await fetch(`${BASE}/auth/v1/settings`, {
        headers: { apikey: ANON },
      }).then((r) => r.json())
      yoqildi = sozlama?.external?.email === true
    }
    ok('email provayderi vaqtincha yoqildi', yoqildi, 'sozlama tarqalmadi')
  }

  for (const u of [A, B]) {
    const yaratildi = await admin('/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        email: u.email,
        password: PAROL,
        email_confirm: true,
        user_metadata: { full_name: 'API Test' },
      }),
    })
    u.id = yaratildi.id
  }
  console.log('  ok   ikkita vaqtinchalik foydalanuvchi yaratildi')

  for (const u of [A, B]) {
    const javob = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: ANON, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: u.email, password: PAROL }),
    })
    const sessiya = await javob.json()
    u.jwt = sessiya.access_token
    if (!u.jwt) {
      console.log(
        `       ${u.email}: ${javob.status} ${JSON.stringify(sessiya).slice(0, 160)}`
      )
    }
  }
  ok('ikkala foydalanuvchi uchun sessiya olindi', Boolean(A.jwt && B.jwt))
  if (!A.jwt || !B.jwt) {
    throw new Error('Sessiya olinmadi — qolgan testlar ma’noga ega emas')
  }

  // -----------------------------------------------------------
  console.log('\n== 1. Ro‘yxatdan o‘tish triggeri (API orqali) ==')
  const profil = await rest(A.jwt, '/profiles?select=id,timezone,daily_goal')
  eq('profil API orqali o‘qiladi', profil.status, 200)
  eq('aynan bitta profil ko‘rinadi', profil.tana?.length, 1)
  eq('profil o‘ziniki', profil.tana?.[0]?.id, A.id)
  eq('timezone = Asia/Tashkent', profil.tana?.[0]?.timezone, 'Asia/Tashkent')

  const papkalar = await rest(A.jwt, '/folders?select=id,name,is_inbox')
  eq('papkalar o‘qiladi', papkalar.status, 200)
  eq('aynan bitta Inbox papka bor', papkalar.tana?.length, 1)
  eq('papka nomi Kiruvchi', papkalar.tana?.[0]?.name, 'Kiruvchi')
  const inboxA = papkalar.tana?.[0]?.id

  // -----------------------------------------------------------
  console.log('\n== 2. Yozish huquqi ==')
  const yangiPapka = await rest(A.jwt, '/folders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ user_id: A.id, name: 'API sinov', color: '#0ea5e9' }),
  })
  eq('papka yaratildi', yangiPapka.status, 201)
  const papkaId = yangiPapka.tana?.[0]?.id

  const yangiVazifa = await rest(A.jwt, '/tasks', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: A.id,
      folder_id: papkaId,
      title: 'API orqali qo‘shilgan vazifa',
      due_date: new Date().toISOString().slice(0, 10),
    }),
  })
  eq('vazifa yaratildi', yangiVazifa.status, 201)
  const vazifaId = yangiVazifa.tana?.[0]?.id
  eq('status default planned', yangiVazifa.tana?.[0]?.status, 'planned')

  const hodisa = await rest(
    A.jwt,
    `/task_events?select=event&task_id=eq.${vazifaId}`
  )
  eq("'created' hodisasi yozildi", hodisa.tana?.[0]?.event, 'created')

  // -----------------------------------------------------------
  console.log('\n== 3. RPC funksiyalar (API orqali) ==')
  const boshla = await rest(A.jwt, '/rpc/start_task', {
    method: 'POST',
    body: JSON.stringify({ task_id: vazifaId }),
  })
  eq('start_task javob berdi', boshla.status, 200)
  eq('status in_progress', boshla.tana?.status, 'in_progress')
  ok('started_at to‘ldirildi', Boolean(boshla.tana?.started_at))

  const bajar = await rest(A.jwt, '/rpc/complete_task', {
    method: 'POST',
    body: JSON.stringify({ task_id: vazifaId, include_subtasks: false }),
  })
  eq('complete_task javob berdi', bajar.status, 200)
  eq('status done', bajar.tana?.status, 'done')

  const hisobot = await rest(A.jwt, '/rpc/get_report', {
    method: 'POST',
    body: JSON.stringify({
      p_from: new Date(Date.now() - 13 * 864e5).toISOString().slice(0, 10),
      p_to: new Date().toISOString().slice(0, 10),
    }),
  })
  eq('get_report javob berdi', hisobot.status, 200)
  eq('summary.completed = 1', hisobot.tana?.summary?.completed, 1)
  eq('by_day 14 kun', hisobot.tana?.by_day?.length, 14)
  eq('by_folder 2 papka', hisobot.tana?.by_folder?.length, 2)
  console.log(`       summary: ${JSON.stringify(hisobot.tana?.summary)}`)

  // -----------------------------------------------------------
  console.log('\n== 4. RLS: begona ma‘lumot ==')
  const bNingKorishi = await rest(B.jwt, '/tasks?select=id,title')
  eq('B o‘z ro‘yxatini oladi', bNingKorishi.status, 200)
  eq('B da A ning vazifalari ko‘rinmaydi', bNingKorishi.tana?.length, 0)

  const bPapkalari = await rest(B.jwt, `/folders?select=id&user_id=eq.${A.id}`)
  eq('B A ning papkalarini ko‘rmaydi', bPapkalari.tana?.length, 0)

  const bYozish = await rest(B.jwt, '/tasks', {
    method: 'POST',
    body: JSON.stringify({
      user_id: A.id,
      folder_id: papkaId,
      title: 'Buzg‘unchi vazifa',
    }),
  })
  ok(
    'B A nomidan vazifa qo‘sha olmaydi',
    bYozish.status === 401 || bYozish.status === 403,
    `status=${bYozish.status}`
  )

  const bRpc = await rest(B.jwt, '/rpc/start_task', {
    method: 'POST',
    body: JSON.stringify({ task_id: vazifaId }),
  })
  ok(
    'B A ning vazifasini RPC orqali boshlay olmaydi',
    bRpc.status !== 200,
    `status=${bRpc.status} ${JSON.stringify(bRpc.tana)?.slice(0, 80)}`
  )

  const bOchirish = await rest(B.jwt, `/folders?id=eq.${papkaId}`, {
    method: 'DELETE',
  })
  const aHaliBor = await rest(A.jwt, `/folders?select=id&id=eq.${papkaId}`)
  eq('B A ning papkasini o‘chira olmadi', aHaliBor.tana?.length, 1)
  ok('o‘chirish so‘rovi xatoga uchramadi, lekin ta‘sir qilmadi', bOchirish.status < 500)

  // -----------------------------------------------------------
  console.log('\n== 5. Inbox himoyasi (API orqali) ==')
  const inboxOchirish = await rest(A.jwt, `/folders?id=eq.${inboxA}`, {
    method: 'DELETE',
  })
  ok(
    'Inbox API orqali ham o‘chmaydi',
    inboxOchirish.status >= 400,
    `status=${inboxOchirish.status}`
  )
} finally {
  // -----------------------------------------------------------
  console.log('\n== 6. Tozalash ==')
  for (const u of [A, B]) {
    if (u.id) {
      try {
        await admin(`/admin/users/${u.id}`, { method: 'DELETE' })
      } catch (e) {
        console.log(`  diqqat: ${u.email} o‘chmadi — ${e.message}`)
      }
    }
  }
  console.log('  ok   vaqtinchalik foydalanuvchilar o‘chirildi')

  if (!EMAIL_HOLATI) {
    await mgmt('/config/auth', {
      method: 'PATCH',
      body: JSON.stringify({ external_email_enabled: false }),
    })
    console.log('  ok   email provayderi yana o‘chirildi')
  }
}

console.log('\n=============================================')
console.log(`  O‘tdi: ${otdi}   Xato: ${xatolar.length}`)
if (xatolar.length) {
  console.log('\n  Xatolar:')
  for (const x of xatolar) console.log('   - ' + x)
}
console.log('=============================================\n')

process.exit(xatolar.length ? 1 : 0)
