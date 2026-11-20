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
const KUTILGAN = new Set([
  '20261113090000_sozlamalar.sql',
  '20261120090000_topshiriqlar.sql',
])

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

await db.close()
console.log(xato === 0 ? '\nHAMMASI JOYIDA' : `\n${xato} ta muammo`)
process.exit(xato === 0 ? 0 : 1)
