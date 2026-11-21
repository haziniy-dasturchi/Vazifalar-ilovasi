// =============================================================
// Migratsiyalarni lokal tekshirish (PGlite — brauzerdagi Postgres)
// =============================================================
// Bulutga tegmasdan: barcha migratsiyalar ketma-ket qo'llanadi,
// so'ng takrorlanish va yumshoq o'chirish ustunlari, CHECK
// cheklovlari va eski qiymatlarning ko'chirilishi tekshiriladi.
//
//   cd tools && node migratsiya-sinov.mjs
//
// Eslatma: `20261113090000_sozlamalar.sql` va
// `20261120090000_topshiriqlar.sql` bu yerda xato beradi, chunki
// ular Supabase platformasining o'ziga xos qismlariga tayanadi
// (`storage.buckets.file_size_limit`, `auth.jwt()`). Haqiqiy
// bazada ular ishlaydi; bu yerda ataylab e'tiborsiz qoldiriladi.

import { PGlite } from '@electric-sql/pglite'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const tools = dirname(fileURLToPath(import.meta.url))
const root = join(tools, '..')
const migr = join(root, 'supabase', 'migrations')

const db = await PGlite.create()
await db.exec(readFileSync(join(tools, 'auth-stub.sql'), 'utf8'))

// `auth.jwt()` stub — topshiriqlar migratsiyasi shunga tayanadi.
// Haqiqiy Supabase'da uni platforma beradi.
await db.exec(`
  create or replace function auth.jwt()
  returns jsonb language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb,
      '{}'::jsonb)
  $$;
`)

// Minimal `storage` stub — avatar siyosatlari uchun
await db.exec(`
  create schema if not exists storage;
  create table if not exists storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text,
    name text,
    owner uuid
  );
  create table if not exists storage.buckets (
    id text primary key, name text, public boolean default false
  );
  alter table storage.objects enable row level security;
  create or replace function storage.foldername(p text)
  returns text[] language sql immutable as $$ select string_to_array(p, '/') $$;
`)

const fayllar = readdirSync(migr).filter((f) => f.endsWith('.sql')).sort()
let xato = 0

// Supabase platformasiga tayanadigan, bu yerda ishlamasligi
// KUTILGAN migratsiyalar — ular muammo deb sanalmaydi
const KUTILGAN = new Set(['20261113090000_sozlamalar.sql'])

for (const f of fayllar) {
  try {
    await db.exec(readFileSync(join(migr, f), 'utf8'))
    console.log('  OK   ', f)
  } catch (e) {
    if (KUTILGAN.has(f)) {
      console.log('  -    ', f, '(Supabase’ga xos qism, o‘tkazildi)')
      continue
    }
    xato += 1
    console.log('  XATO ', f, '\n        ', String(e.message).slice(0, 300))
  }
}

// Yangi ustunlar va funksiya imzosi
const cols = await db.query(`
  select column_name, udt_name, is_nullable
  from information_schema.columns
  where table_schema='public' and table_name='tasks'
    and column_name in ('rrule','rrule_start','rrule_from_completion','deleted_at','description')
  order by column_name`)
console.log('\n== tasks yangi ustunlari ==')
for (const c of cols.rows) console.log(` ${c.column_name} | ${c.udt_name} | null=${c.is_nullable}`)

const fn = await db.query(`
  select pg_get_function_arguments(p.oid) as args
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='complete_task'`)
console.log('\n== complete_task ==')
for (const r of fn.rows) console.log(' ', r.args)

// Ko'chirish mantiqini amalda sinash
await db.exec(`
  insert into auth.users (id) values ('00000000-0000-4000-8000-000000000001')
  on conflict do nothing;
`)
const uid = '00000000-0000-4000-8000-000000000001'
await db.exec(`
  insert into public.folders (id, user_id, name, color, sort_order)
  values ('11111111-0000-4000-8000-000000000001', '${uid}', 'Sinov', '#000000', 1)
  on conflict do nothing;
`)

// Eski shakldagi qatorlar + migratsiya yana bir marta
const eskilar = ['daily', 'weekdays', 'weekly', 'monthly', 'days:2,4']
for (let i = 0; i < eskilar.length; i += 1) {
  await db.exec(`
    insert into public.tasks (user_id, folder_id, title, due_date, recurrence)
    values ('${uid}', '11111111-0000-4000-8000-000000000001',
            'Eski ${i}', date '2026-01-31', '${eskilar[i]}');
  `)
}
await db.exec(readFileSync(join(migr, '20261121090000_takrorlanish_rrule.sql'), 'utf8'))

const kochirilgan = await db.query(`
  select recurrence, rrule, rrule_start::text as boshi
  from public.tasks where recurrence is not null order by title`)
console.log('\n== ko\'chirish natijasi ==')
for (const r of kochirilgan.rows) {
  console.log(` ${String(r.recurrence).padEnd(10)} -> ${r.rrule}  (${r.boshi})`)
}

// CHECK cheklovi haqiqatan ishlayaptimi
try {
  await db.exec(`
    insert into public.tasks (user_id, folder_id, title, rrule, rrule_start)
    values ('${uid}', '11111111-0000-4000-8000-000000000001', 'Yomon', 'salom', date '2026-01-01');
  `)
  console.log('\n XATO: noto\'g\'ri rrule o\'tib ketdi')
  xato += 1
} catch {
  console.log('\n OK: noto\'g\'ri rrule rad etildi')
}

try {
  await db.exec(`
    insert into public.tasks (user_id, folder_id, title, rrule)
    values ('${uid}', '11111111-0000-4000-8000-000000000001', 'Boshsiz', 'FREQ=DAILY');
  `)
  console.log(' XATO: rrule_start siz qator o\'tib ketdi')
  xato += 1
} catch {
  console.log(' OK: rrule_start siz qator rad etildi')
}

// Yumshoq o'chirish
await db.exec(`
  update public.tasks set deleted_at = now() where title = 'Eski 0';
`)
const tirik = await db.query(
  `select count(*)::int as n from public.tasks where deleted_at is null`
)
console.log(` OK: o'chirilmagan qatorlar: ${tirik.rows[0].n}`)

// -------------------------------------------------------------
// Topshiriq xavfsizligi qoidalari — amalda
// -------------------------------------------------------------
console.log('\n== topshiriq xavfsizligi ==')

const A = '00000000-0000-4000-8000-00000000000a' // yuboruvchi
const B = '00000000-0000-4000-8000-00000000000b' // qabul qiluvchi
await db.exec(`
  insert into auth.users (id, email) values
    ('${A}', 'boshliq@sinov.uz'), ('${B}', 'xodim@sinov.uz')
  on conflict (id) do update set email = excluded.email;
`)

const yozsaBoladimi = async () =>
  (
    await db.query(
      `select public.topshiriq_yozsa_boladimi('${A}', 'xodim@sinov.uz') as j`
    )
  ).rows[0].j

async function tekshir(nom, kutilgan) {
  const natija = await yozsaBoladimi()
  const tugri = natija === kutilgan
  if (!tugri) xato += 1
  console.log(` ${tugri ? 'OK' : 'XATO'}: ${nom} -> ${natija}`)
}

const topshiriqQosh = (holat) =>
  db.exec(`
    insert into public.topshiriqlar
      (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, holat)
    values ('${A}', 'xodim@sinov.uz', 'Sinov', '${holat}');
  `)

await tekshir("boshida yozsa bo'ladi", true)

// Uch marta rad etilsa — to'xtaydi
for (let i = 0; i < 3; i += 1) await topshiriqQosh('rad')
await tekshir('3 ta raddan keyin bloklanadi', false)

// Qabul qiluvchi ruxsat bersa — yana ochiladi (email katta harfda
// yozilsa ham ishlashi kerak)
await db.exec(`
  insert into public.topshiriq_ruxsatlari (egasi_id, yuboruvchi_email, holat)
  values ('${B}', 'BOSHLIQ@sinov.uz', 'ruxsat');
`)
await tekshir('ruxsat berilsa yana ochiladi', true)

// Qo'lda blok — ruxsatdan ham kuchli
await db.exec(`
  update public.topshiriq_ruxsatlari set holat = 'blok' where egasi_id = '${B}';
`)
await tekshir("qo'lda blok to'xtatadi", false)

// Ruxsat olib tashlansa, javobsizlar chegarasi ishlaydi
await db.exec(`delete from public.topshiriq_ruxsatlari where egasi_id = '${B}';`)
await db.exec(`delete from public.topshiriqlar where yuboruvchi_id = '${A}';`)
for (let i = 0; i < 5; i += 1) await topshiriqQosh('kutilmoqda')
await tekshir("5 ta javobsizdan keyin to'xtaydi", false)

// Ro'yxatdan o'tmagan odamga yozish mumkin bo'lishi kerak
const notanish = (
  await db.query(
    `select public.topshiriq_yozsa_boladimi('${A}', 'yangi@sinov.uz') as j`
  )
).rows[0].j
if (notanish !== true) xato += 1
console.log(
  ` ${notanish ? 'OK' : 'XATO'}: ro'yxatdan o'tmagan emailga yozsa bo'ladi`
)

// Noto'g'ri email shakli rad etilsin
try {
  await db.exec(`
    insert into public.topshiriqlar (yuboruvchi_id, qabul_qiluvchi_email, sarlavha)
    values ('${A}', 'salom', 'Sinov');
  `)
  console.log(" XATO: noto'g'ri email o'tib ketdi")
  xato += 1
} catch {
  console.log(" OK: noto'g'ri email rad etildi")
}

// -------------------------------------------------------------
// Bajarishni bekor qilish — undo_complete_task
// -------------------------------------------------------------
console.log('\n== bajarishni bekor qilish ==')

const PAPKA = '11111111-0000-4000-8000-000000000001'

function belgi(nom, shart) {
  if (!shart) xato += 1
  console.log(` ${shart ? 'OK' : 'XATO'}: ${nom}`)
}

/** Taqqoslashlar SQL ichida: sana hisobi JS va Postgres orasida sirpanmasin */
const holatSorovi = (id, ifodalar) =>
  db.query(`
    select status,
           (select count(*)::int from public.task_events e
             where e.task_id = t.id and e.event = 'completed') as hodisa,
           ${ifodalar}
      from public.tasks t where t.id = '${id}'`)

// --- Takrorlanuvchi: bajarildi -> surildi -> bekor qilindi
const T1 = '22222222-0000-4000-8000-000000000001'
await db.exec(`
  insert into public.tasks
    (id, user_id, folder_id, title, due_date, deadline, rrule, rrule_start)
  values ('${T1}', '${uid}', '${PAPKA}', 'Har kuni',
          current_date, current_date + 5, 'FREQ=DAILY', current_date);
`)
await db.exec(`select public.complete_task('${T1}', false, (current_date + 1)::date, true);`)

let h = (
  await holatSorovi(
    T1,
    `due_date = current_date + 1 as sana,
     prev_due_date = current_date as oldingi,
     deadline = current_date + 6 as muddat`
  )
).rows[0]
belgi('keyingi kunga surildi', h.sana === true && h.status === 'planned')
belgi('oldingi sana saqlandi', h.oldingi === true)
belgi('muddat ham surildi', h.muddat === true)
belgi("'completed' hodisasi yozildi", h.hodisa === 1)

await db.exec(`select public.undo_complete_task('${T1}');`)
h = (
  await holatSorovi(
    T1,
    `due_date = current_date as sana,
     prev_due_date is null as oldingi,
     deadline = current_date + 5 as muddat`
  )
).rows[0]
belgi('sana orqaga qaytdi', h.sana === true && h.status === 'planned')
belgi('oldingi sana tozalandi', h.oldingi === true)
belgi('muddat ham qaytdi', h.muddat === true)
belgi('hisobotdagi yozuv olib tashlandi', h.hodisa === 0)

// --- Oddiy (takrorlanmaydigan) vazifa
const T2 = '22222222-0000-4000-8000-000000000002'
await db.exec(`
  insert into public.tasks (id, user_id, folder_id, title, due_date)
  values ('${T2}', '${uid}', '${PAPKA}', 'Bir martalik', current_date);
`)
await db.exec(`select public.complete_task('${T2}');`)
h = (await holatSorovi(T2, `true as x`)).rows[0]
belgi('oddiy vazifa bajarildi', h.status === 'done' && h.hodisa === 1)

await db.exec(`select public.undo_complete_task('${T2}');`)
h = (await holatSorovi(T2, `due_date = current_date as sana`)).rows[0]
belgi(
  'oddiy vazifa rejaga qaytdi',
  h.status === 'planned' && h.hodisa === 0 && h.sana === true
)

// --- Eski yozuv: prev_due_date yo'q, faqat hodisa kuni ma'lum
const T3 = '22222222-0000-4000-8000-000000000003'
await db.exec(`
  insert into public.tasks
    (id, user_id, folder_id, title, due_date, rrule, rrule_start)
  values ('${T3}', '${uid}', '${PAPKA}', 'Eski takror',
          current_date, 'FREQ=DAILY', current_date);
`)
await db.exec(`select public.complete_task('${T3}', false, (current_date + 2)::date, true);`)
// Migratsiyadan oldin bajarilgan vazifani taqlid qilamiz
await db.exec(`update public.tasks set prev_due_date = null where id = '${T3}';`)

await db.exec(`select public.undo_complete_task('${T3}');`)
h = (await holatSorovi(T3, `due_date = current_date as sana`)).rows[0]
belgi(
  'eski yozuv hodisa kuniga qaytdi',
  h.status === 'planned' && h.sana === true && h.hodisa === 0
)

// --- Ikkinchi marta chaqirilsa xato bermasin (offline navbat qayta yuborishi mumkin)
try {
  await db.exec(`select public.undo_complete_task('${T3}');`)
  h = (await holatSorovi(T3, `due_date = current_date as sana`)).rows[0]
  belgi('ikkinchi bekor qilish zararsiz', h.status === 'planned' && h.sana === true)
} catch (e) {
  xato += 1
  console.log(` XATO: ikkinchi bekor qilish xato berdi — ${e.message}`)
}

await db.close()
console.log(xato === 0 ? '\nHAMMASI JOYIDA' : `\n${xato} ta muammo`)
process.exit(xato === 0 ? 0 : 1)
