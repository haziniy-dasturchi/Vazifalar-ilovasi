// =============================================================
// Bulutdagi bazani amalda sinash
// =============================================================
// Vaqtinchalik test foydalanuvchi yaratadi, triggerlar va RPC
// funksiyalarni tekshiradi, so'ng foydalanuvchini butunlay o'chiradi.
//
//   node tools/cloud-test.mjs <PROJECT_REF>

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
  console.error('Foydalanish: node tools/cloud-test.mjs <PROJECT_REF>')
  process.exit(2)
}

const API = `https://api.supabase.com/v1/projects/${REF}/database/query`
const TEST_USER = '0e57c0de-0000-4000-8000-000000000001'

async function sql(query) {
  const javob = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })
  const matn = await javob.text()
  if (!javob.ok) {
    let xato = matn
    try {
      xato = JSON.parse(matn).message ?? matn
    } catch {}
    throw new Error(xato)
  }
  try {
    return JSON.parse(matn)
  } catch {
    return null
  }
}

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

/** Xato kutilgan holatlar uchun */
async function xatoKutamiz(nom, query, matnQismi) {
  try {
    await sql(query)
    ok(nom, false, 'xato kutilgan edi, lekin so‘rov bajarildi')
  } catch (e) {
    const m = String(e.message)
    ok(nom, !matnQismi || m.includes(matnQismi), `xato matni: ${m.slice(0, 120)}`)
  }
}

// =============================================================
console.log(`\nLoyiha: ${REF}`)
console.log('\n== Tozalash (oldingi test qoldiqlari) ==')
await sql(`delete from auth.users where id = '${TEST_USER}'`)
console.log('  ok   tayyor')

try {
  // ---------------------------------------------------------
  console.log('\n== 1. Yangi foydalanuvchi triggeri ==')
  await sql(`
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      raw_user_meta_data, created_at, updated_at
    ) values (
      '00000000-0000-0000-0000-000000000000',
      '${TEST_USER}', 'authenticated', 'authenticated',
      'bulut-test@vazifalar.local', '',
      '{"full_name":"Bulut Test"}'::jsonb, now(), now()
    );
  `)

  const profil = await sql(
    `select full_name, timezone, daily_goal from public.profiles where id = '${TEST_USER}'`
  )
  eq('profil yaratildi', profil.length, 1)
  eq('full_name metadatadan olindi', profil[0]?.full_name, 'Bulut Test')
  eq('timezone = Asia/Tashkent', profil[0]?.timezone, 'Asia/Tashkent')
  eq('daily_goal = 5', profil[0]?.daily_goal, 5)

  const papkalar = await sql(
    `select id, name, is_inbox from public.folders where user_id = '${TEST_USER}'`
  )
  eq('aynan 1 ta papka yaratildi', papkalar.length, 1)
  eq('papka nomi Kiruvchi', papkalar[0]?.name, 'Kiruvchi')
  eq('is_inbox = true', papkalar[0]?.is_inbox, true)
  const inboxId = papkalar[0]?.id

  // ---------------------------------------------------------
  console.log('\n== 2. Inbox himoyasi ==')
  await xatoKutamiz(
    'Inbox o‘chirilmaydi',
    `delete from public.folders where id = '${inboxId}'`,
    "o'chirish mumkin emas"
  )
  await xatoKutamiz(
    'Inbox arxivlanmaydi',
    `update public.folders set is_archived = true where id = '${inboxId}'`,
    'arxivlash mumkin emas'
  )
  await xatoKutamiz(
    'ikkinchi Inbox yaratilmaydi',
    `insert into public.folders (user_id, name, is_inbox)
     values ('${TEST_USER}', 'Ikkinchi', true)`,
    ''
  )

  // ---------------------------------------------------------
  console.log('\n== 3. Vazifa va subtask ==')
  await sql(`
    insert into public.folders (id, user_id, name, color)
    values ('0e57c0de-1000-4000-8000-000000000001', '${TEST_USER}', 'Sinov', '#0ea5e9');

    insert into public.tasks (id, user_id, folder_id, title, due_date)
    values ('0e57c0de-2000-4000-8000-000000000001', '${TEST_USER}',
            '0e57c0de-1000-4000-8000-000000000001', 'Oddiy vazifa', current_date);

    insert into public.tasks (id, user_id, folder_id, parent_id, title)
    values ('0e57c0de-2000-4000-8000-000000000002', '${TEST_USER}',
            '0e57c0de-1000-4000-8000-000000000001',
            '0e57c0de-2000-4000-8000-000000000001', 'Subtask');

    insert into public.tasks (id, user_id, folder_id, title, due_date, recurrence)
    values ('0e57c0de-2000-4000-8000-000000000003', '${TEST_USER}',
            '0e57c0de-1000-4000-8000-000000000001',
            'Kunlik vazifa', current_date - 3, 'daily');
  `)

  const yaratilgan = await sql(
    `select count(*)::int n from public.task_events
     where user_id = '${TEST_USER}' and event = 'created'`
  )
  eq("'created' hodisalari yozildi", yaratilgan[0].n, 3)

  await xatoKutamiz(
    '2-daraja subtask taqiqlangan',
    `insert into public.tasks (user_id, folder_id, parent_id, title)
     values ('${TEST_USER}', '0e57c0de-1000-4000-8000-000000000001',
             '0e57c0de-2000-4000-8000-000000000002', 'Ikkinchi daraja')`,
    'faqat 1 daraja'
  )

  // ---------------------------------------------------------
  console.log('\n== 4. RPC funksiyalar ==')
  const boshlandi = await sql(`
    select set_config('request.jwt.claims',
      '{"sub":"${TEST_USER}","role":"authenticated"}', true);
    select status, started_at is not null as boshlandi
    from public.start_task('0e57c0de-2000-4000-8000-000000000001');
  `)
  eq('start_task -> in_progress', boshlandi[0]?.status, 'in_progress')
  eq('started_at to‘ldirildi', boshlandi[0]?.boshlandi, true)

  const bajarildi = await sql(`
    select set_config('request.jwt.claims',
      '{"sub":"${TEST_USER}","role":"authenticated"}', true);
    select status, completed_at is not null as bajarildi
    from public.complete_task('0e57c0de-2000-4000-8000-000000000001', true);
  `)
  eq('complete_task -> done', bajarildi[0]?.status, 'done')
  eq('completed_at to‘ldirildi', bajarildi[0]?.bajarildi, true)

  const subtask = await sql(
    `select status from public.tasks where id = '0e57c0de-2000-4000-8000-000000000002'`
  )
  eq('include_subtasks subtaskni ham yopdi', subtask[0]?.status, 'done')

  const takror = await sql(`
    select set_config('request.jwt.claims',
      '{"sub":"${TEST_USER}","role":"authenticated"}', true);
    select status, due_date::text, completed_at
    from public.complete_task('0e57c0de-2000-4000-8000-000000000003', false);
  `)
  eq('takrorlanuvchi vazifa planned ga qaytdi', takror[0]?.status, 'planned')
  eq('completed_at tozalandi', takror[0]?.completed_at, null)

  const bugun = (await sql(`select (now() at time zone 'Asia/Tashkent')::date::text d`))[0].d
  ok(
    'takrorlanuvchi vazifa kelajakka surildi',
    takror[0]?.due_date > bugun,
    `${takror[0]?.due_date} > ${bugun}`
  )

  const hodisalar = await sql(`
    select event, count(*)::int n from public.task_events
    where user_id = '${TEST_USER}' group by event order by event
  `)
  const h = Object.fromEntries(hodisalar.map((r) => [r.event, r.n]))
  eq("'started' hodisasi", h.started, 1)
  eq("'completed' hodisalari", h.completed, 3)
  ok(
    "takrorlanuvchi vazifa ortiqcha 'uncompleted' yozmadi",
    !h.uncompleted,
    `uncompleted=${h.uncompleted}`
  )

  // ---------------------------------------------------------
  console.log('\n== 5. get_report ==')
  const hisobot = await sql(`
    select set_config('request.jwt.claims',
      '{"sub":"${TEST_USER}","role":"authenticated"}', true);
    select public.get_report(current_date - 13, current_date) as r;
  `)
  const r = hisobot[0]?.r
  ok('hisobot qaytdi', Boolean(r))
  ok('summary bor', Boolean(r?.summary), JSON.stringify(r?.summary))
  eq('by_day 14 kun', r?.by_day?.length, 14)
  eq('by_folder 2 papka (Kiruvchi + Sinov)', r?.by_folder?.length, 2)
  eq('summary.completed = 3', r?.summary?.completed, 3)
  const sinov = r?.by_folder?.find((f) => f.name === 'Sinov')
  ok('Sinov papkasi hisobotda', Boolean(sinov))
  ok(
    'health qiymati to‘g‘ri turdan',
    ['good', 'attention', 'behind'].includes(sinov?.health),
    `health=${sinov?.health}`
  )
  ok('sabab o‘zbekcha to‘ldirilgan', Boolean(sinov?.reason), `reason=${sinov?.reason}`)
  console.log(`       summary: ${JSON.stringify(r?.summary)}`)
  console.log(`       Sinov: health=${sinov?.health} "${sinov?.reason}"`)

  // ---------------------------------------------------------
  console.log('\n== 6. Cascade o‘chirish ==')
  await sql(`delete from public.folders where id = '0e57c0de-1000-4000-8000-000000000001'`)
  const qolgan = await sql(
    `select count(*)::int n from public.tasks where user_id = '${TEST_USER}'`
  )
  eq('papka o‘chdi -> vazifalar ham o‘chdi', qolgan[0].n, 0)

  const tarix = await sql(
    `select count(*)::int n from public.task_events where user_id = '${TEST_USER}'`
  )
  ok('hodisalar tarixi saqlandi', tarix[0].n > 0, `${tarix[0].n} ta yozuv`)
} finally {
  // ---------------------------------------------------------
  console.log('\n== 7. Test ma‘lumotlarini tozalash ==')
  await sql(`delete from auth.users where id = '${TEST_USER}'`)
  const qoldi = await sql(`
    select
      (select count(*)::int from public.profiles where id = '${TEST_USER}') as profil,
      (select count(*)::int from public.folders where user_id = '${TEST_USER}') as papka,
      (select count(*)::int from public.tasks where user_id = '${TEST_USER}') as vazifa,
      (select count(*)::int from public.task_events where user_id = '${TEST_USER}') as hodisa
  `)
  const q = qoldi[0]
  eq(
    'test foydalanuvchi butunlay o‘chdi',
    [q.profil, q.papka, q.vazifa, q.hodisa],
    [0, 0, 0, 0]
  )
}

console.log('\n=============================================')
console.log(`  O‘tdi: ${otdi}   Xato: ${xatolar.length}`)
if (xatolar.length) {
  console.log('\n  Xatolar:')
  for (const x of xatolar) console.log('   - ' + x)
}
console.log('=============================================\n')

process.exit(xatolar.length ? 1 : 0)
