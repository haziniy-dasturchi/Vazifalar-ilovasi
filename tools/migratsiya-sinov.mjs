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

// Supabase'dagi kabi: public sxemadagi jadvallarga rollar sukut
// bo'yicha ruxsatga ega, himoyani RLS qiladi. Busiz "set role
// authenticated" bilan RLS'ni sinab bo'lmaydi.
await db.exec(`
  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on sequences to anon, authenticated, service_role;
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
    id text primary key, name text, public boolean default false,
    file_size_limit bigint, allowed_mime_types text[]
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

// Begonadan 20 ta ochiq topshiriq — to'xtaydi (qabul/rad bosqichi
// yo'q, topshiriq darhol ijrochiga tushadi — spamga qarshi chegara)
for (let i = 0; i < 20; i += 1) await topshiriqQosh('kutilmoqda')
await tekshir("20 ta ochiq topshiriqdan keyin to'xtaydi", false)
belgi("yuborilgan topshiriq darhol ijrochiga tushadi", (await db.query(
  `select count(*)::int n from public.topshiriqlar
    where yuboruvchi_id = '${A}' and holat = 'qabul' and vazifa_id is not null`)).rows[0].n === 20)

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

// Ruxsat olib tashlansa — yana chegara; topshiriqlar yopilsa — ochiladi
await db.exec(`delete from public.topshiriq_ruxsatlari where egasi_id = '${B}';`)
await tekshir('ruxsatsiz yana chegara ishlaydi', false)
await db.exec(`delete from public.topshiriqlar where yuboruvchi_id = '${A}';`)
await tekshir("ochiq topshiriqlar yo'q — yana yozsa bo'ladi", true)

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

// -------------------------------------------------------------
// Topshiriq: tekshiruv bosqichi
// -------------------------------------------------------------
console.log('\n== topshiriq tekshiruvi ==')

const kimBolib = (id, email) =>
  db.exec(
    `select set_config('request.jwt.claims', '{"sub":"${id}","email":"${email}","role":"authenticated"}', false);`
  )

await db.exec(`
  delete from public.topshiriqlar;
  insert into public.folders (user_id, name, color, sort_order, is_inbox)
  select '${B}', 'Kiruvchi', '#000000', 0, true
   where not exists (
     select 1 from public.folders where user_id = '${B}' and is_inbox);
`)

const tsh = (await db.query(`
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, izoh, muddat, muddat_vaqt)
  values ('${A}', 'xodim@sinov.uz', 'Hisobot', 'Batafsil izoh',
          current_date + 2, time '09:30')
  returning id, tekshirish`)).rows[0]
belgi('yangi topshiriqda tekshiruv yoqilgan', tsh.tekshirish === true)

const topshiriqHolati = async () =>
  (await db.query(`
    select t.holat, t.qaytarish_sababi, t.topshirish_izohi,
           v.status, v.description, v.due_time::text as vaqt
      from public.topshiriqlar t
      left join public.tasks v on v.id = t.vazifa_id
     where t.id = '${tsh.id}'`)).rows[0]

await kimBolib(B, 'xodim@sinov.uz')
let th = await topshiriqHolati()
belgi('izoh vazifaga ko\'chdi', th.description === 'Batafsil izoh')
belgi('soat vazifaga ko\'chdi', th.vaqt === '09:30:00')

// Yuboruvchi qabul qiluvchi o'rniga topshira olmasin
await kimBolib(A, 'boshliq@sinov.uz')
try {
  await db.exec(`select public.topshiriqni_topshirish('${tsh.id}', 'x');`)
  belgi('begona odam topshira olmaydi', false)
} catch {
  belgi('begona odam topshira olmaydi', true)
}

await kimBolib(B, 'xodim@sinov.uz')
await db.exec(`select public.topshiriqni_topshirish('${tsh.id}', 'Tayyor');`)
th = await topshiriqHolati()
belgi(
  'topshirilgach tekshiruvda',
  th.holat === 'tekshiruvda' && th.status === 'done' && th.topshirish_izohi === 'Tayyor'
)

// Ijrochi o'zi tasdiqlay olmasin
try {
  await db.exec(`select public.topshiriqni_tasdiqlash('${tsh.id}');`)
  belgi("ijrochi o'zi tasdiqlay olmaydi", false)
} catch {
  belgi("ijrochi o'zi tasdiqlay olmaydi", true)
}

await kimBolib(A, 'boshliq@sinov.uz')
await db.exec(`select public.topshiriqni_qaytarish('${tsh.id}', 'Jadval yetishmaydi');`)
th = await topshiriqHolati()
belgi(
  'qaytarilgach ish holatida, sabab saqlandi',
  th.holat === 'qabul' &&
    th.status === 'in_progress' &&
    th.qaytarish_sababi === 'Jadval yetishmaydi'
)

// Ijrochi vazifani o'z ro'yxatida tugatadi — yana tekshiruvga
await db.exec(`
  update public.tasks set status = 'done', progress = 100
   where id = (select vazifa_id from public.topshiriqlar where id = '${tsh.id}');`)
th = await topshiriqHolati()
belgi(
  "ro'yxatda tugatilsa ham tekshiruvga tushadi, sabab tozalanadi",
  th.holat === 'tekshiruvda' && th.qaytarish_sababi === null
)

await db.exec(`select public.topshiriqni_tasdiqlash('${tsh.id}');`)
th = await topshiriqHolati()
belgi('tasdiqlangach bajarildi', th.holat === 'bajarildi')

// Tekshiruvsiz topshiriq — eski oqim
const tsh2 = (await db.query(`
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, tekshirish)
  values ('${A}', 'xodim@sinov.uz', 'Oddiy', false)
  returning id`)).rows[0]
await kimBolib(B, 'xodim@sinov.uz')
await db.exec(`select public.topshiriqni_topshirish('${tsh2.id}', null);`)
const h2 = (await db.query(
  `select holat from public.topshiriqlar where id = '${tsh2.id}'`
)).rows[0]
belgi("tekshiruvsiz topshiriq darhol bajarildi", h2.holat === 'bajarildi')

// Soat sanasiz bo'lmasin
try {
  await db.exec(`
    insert into public.topshiriqlar
      (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, muddat_vaqt)
    values ('${A}', 'xodim@sinov.uz', 'Sanasiz', time '10:00');`)
  belgi('sanasiz soat rad etiladi', false)
} catch {
  belgi('sanasiz soat rad etiladi', true)
}

// Kontaktlar: ikkala tomonda ham bir-birini ko'radi
const kontakt = (await db.query(
  `select email from public.topshiriq_kontaktlari()`
)).rows.map((r) => r.email)
belgi('ijrochi kontaktlarida boshliq bor', kontakt.includes('boshliq@sinov.uz'))
await kimBolib(A, 'boshliq@sinov.uz')
const kontaktA = (await db.query(
  `select email from public.topshiriq_kontaktlari()`
)).rows.map((r) => r.email)
belgi('boshliq kontaktlarida xodim bor', kontaktA.includes('xodim@sinov.uz'))

// -------------------------------------------------------------
// Topshiriq: jamoa, izohlar, tarix, xabarlar, takror (2-3 bosqich)
// -------------------------------------------------------------
console.log('\n== topshiriq jamoasi va muloqot ==')

const C = '00000000-0000-4000-8000-00000000000c' // jamoadosh
const D = '00000000-0000-4000-8000-00000000000d' // begona
await db.exec(`
  insert into auth.users (id, email) values
    ('${C}', 'jamoadosh@sinov.uz'), ('${D}', 'begona@sinov.uz')
  on conflict (id) do nothing;
`)

/** Haqiqiy foydalanuvchi sifatida (RLS ishlaydi) bitta so'rov */
async function sifatida(id, email, sql) {
  await kimBolib(id, email)
  await db.exec('set role authenticated')
  try {
    return await db.query(sql)
  } finally {
    await db.exec('reset role')
  }
}
async function xatoBeradimi(id, email, sql) {
  try {
    await sifatida(id, email, sql)
    return false
  } catch {
    return true
  }
}
const birinchi = async (id, email, sql) =>
  (await sifatida(id, email, sql)).rows[0]

// Jamoa: A yaratadi, C havola orqali qo'shiladi
const jamoa = (await birinchi(A, 'boshliq@sinov.uz',
  `select public.jamoa_yaratish('Markaz') as id`)).id
const kod = (await db.query(
  `select taklif_kodi from public.jamoalar where id = '${jamoa}'`)).rows[0].taklif_kodi
const korinish = await birinchi(C, 'jamoadosh@sinov.uz',
  `select * from public.jamoa_taklifi('${kod}')`)
belgi("taklif sahifasida jamoa nomi ko'rinadi", korinish?.nom === 'Markaz' && korinish.azomi === false)
await sifatida(C, 'jamoadosh@sinov.uz', `select public.jamoaga_qoshilish('${kod}')`)

belgi("begona jamoani ko'rmaydi",
  (await sifatida(D, 'begona@sinov.uz', `select * from public.jamoalar`)).rows.length === 0)
belgi("begona a'zolar ro'yxatini ko'rmaydi",
  (await sifatida(D, 'begona@sinov.uz', `select * from public.jamoa_azolari_royxati()`)).rows.length === 0)
belgi("jamoadosh a'zolarni ko'radi",
  (await sifatida(C, 'jamoadosh@sinov.uz', `select * from public.jamoa_azolari_royxati()`)).rows.length === 2)
belgi("a'zo boshqani chiqara olmaydi",
  await xatoBeradimi(C, 'jamoadosh@sinov.uz', `select public.jamoadan_chiqarish('${jamoa}', '${A}')`))
belgi("rahbar jamoadan chiqib keta olmaydi",
  await xatoBeradimi(A, 'boshliq@sinov.uz', `select public.jamoadan_chiqish('${jamoa}')`))

// C bloklagan bo'lsa ham jamoa ichida yozish mumkin
await db.exec(`
  insert into public.topshiriq_ruxsatlari (egasi_id, yuboruvchi_email, holat)
  values ('${C}', 'boshliq@sinov.uz', 'blok');`)
belgi('jamoada blok yozishni to\'smaydi', (await db.query(
  `select public.topshiriq_yozsa_boladimi('${A}', 'jamoadosh@sinov.uz') as j`)).rows[0].j === true)

// Jamoada yuborilgan topshiriq darhol qabul qilinadi
const guruh = '33333333-0000-4000-8000-000000000001'
await sifatida(A, 'boshliq@sinov.uz', `
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, takror, guruh_id, muddat)
  values ('${A}', 'jamoadosh@sinov.uz', 'Haftalik hisobot', 'haftalik', '${guruh}', current_date)`)
const jt = (await db.query(`
  select t.id, t.holat, t.avto_qabul, v.user_id = '${C}' as vazifa_unda
    from public.topshiriqlar t left join public.tasks v on v.id = t.vazifa_id
   where t.sarlavha = 'Haftalik hisobot'`)).rows[0]
belgi('jamoada avtomatik qabul', jt.holat === 'qabul' && jt.avto_qabul === true && jt.vazifa_unda === true)
belgi('ijrochiga "yangi topshiriq" xabari navbatda', (await db.query(
  `select count(*)::int n from public.topshiriq_xabarlari
    where user_id = '${C}' and topshiriq_id = '${jt.id}'`)).rows[0].n === 1)

// Izohlar: ishtirokchi yozadi, begona yoza ham, o'qiy ham olmaydi
await sifatida(C, 'jamoadosh@sinov.uz', `
  insert into public.topshiriq_izohlari (topshiriq_id, muallif_id, matn)
  values ('${jt.id}', '${C}', 'Jadval qaysi formatda?')`)
belgi('begona izoh yoza olmaydi', await xatoBeradimi(D, 'begona@sinov.uz', `
  insert into public.topshiriq_izohlari (topshiriq_id, muallif_id, matn)
  values ('${jt.id}', '${D}', 'salom')`))
belgi("begona izohni o'qiy olmaydi", (await sifatida(D, 'begona@sinov.uz',
  `select * from public.topshiriq_izohlari`)).rows.length === 0)
belgi("boshqa nomidan izoh yozib bo'lmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz', `
  insert into public.topshiriq_izohlari (topshiriq_id, muallif_id, matn)
  values ('${jt.id}', '${A}', 'soxta')`))
belgi("begona topshiriq papkasidagi faylni ilib bo'lmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz', `
  insert into public.topshiriq_izohlari (topshiriq_id, muallif_id, fayl_yoli, fayl_nomi)
  values ('${jt.id}', '${C}', '${tsh.id}/x.pdf', 'x.pdf')`))
belgi('izoh xabari yuboruvchiga ketdi', (await db.query(
  `select count(*)::int n from public.topshiriq_xabarlari
    where user_id = '${A}' and sarlavha like 'Yangi izoh%'`)).rows[0].n === 1)
belgi('yuboruvchi izohni ko\'radi', (await sifatida(A, 'boshliq@sinov.uz',
  `select * from public.topshiriq_izohlari where topshiriq_id = '${jt.id}'`)).rows.length === 1)

// Topshirish -> tekshiruv -> baho bilan tasdiqlash -> keyingi takror
await sifatida(C, 'jamoadosh@sinov.uz', `select public.topshiriqni_topshirish('${jt.id}', 'Tayyor')`)
belgi('tekshiruv xabari yuboruvchiga', (await db.query(
  `select count(*)::int n from public.topshiriq_xabarlari
    where user_id = '${A}' and topshiriq_id = '${jt.id}'
      and sarlavha like 'Bajarildi, tekshiring%'`)).rows[0].n === 1)
belgi("noto'g'ri baho rad etiladi", await xatoBeradimi(A, 'boshliq@sinov.uz',
  `select public.topshiriqni_tasdiqlash('${jt.id}', 7::smallint)`))
await sifatida(A, 'boshliq@sinov.uz', `select public.topshiriqni_tasdiqlash('${jt.id}', 5::smallint)`)
const keyingi = (await db.query(`
  select holat, muddat = current_date + 7 as sana, guruh_id = '${guruh}' as guruh
    from public.topshiriqlar where oldingi_id = '${jt.id}'`)).rows
belgi('takror: keyingi hafta nusxasi yaratildi (va qabul qilindi)',
  keyingi.length === 1 && keyingi[0].sana && keyingi[0].guruh && keyingi[0].holat === 'qabul')
belgi('baho saqlandi', (await db.query(
  `select baho from public.topshiriqlar where id = '${jt.id}'`)).rows[0].baho === 5)

const tarix = (await sifatida(C, 'jamoadosh@sinov.uz', `
  select hodisa from public.topshiriq_tarixi
   where topshiriq_id = '${jt.id}' order by id`)).rows.map((r) => r.hodisa)
belgi(`tarix to'liq: ${tarix.join(' > ')}`,
  tarix.join(',') === 'yuborildi,tekshiruvda,tasdiqlandi')
belgi("begona tarixni ko'rmaydi", (await sifatida(D, 'begona@sinov.uz',
  `select * from public.topshiriq_tarixi`)).rows.length === 0)
belgi("foydalanuvchi xabarlar navbatini o'qiy olmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz',
  `select * from public.topshiriq_xabarlari`) || (await sifatida(C, 'jamoadosh@sinov.uz',
  `select * from public.topshiriq_xabarlari`)).rows.length === 0)

// Takrorni to'xtatish: faqat yuboruvchi
const keyingiId = (await db.query(
  `select id from public.topshiriqlar where oldingi_id = '${jt.id}'`)).rows[0].id
belgi("ijrochi takrorni to'xtata olmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz',
  `select public.takrorni_toxtatish('${keyingiId}')`))
await sifatida(A, 'boshliq@sinov.uz', `select public.takrorni_toxtatish('${keyingiId}')`)
belgi("yuboruvchi takrorni to'xtatdi", (await db.query(
  `select takror from public.topshiriqlar where id = '${keyingiId}'`)).rows[0].takror === null)

// Muddat eslatmalari: o'tib ketgan muddat -> ikkala tomonga bir marta
await db.exec(`
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, muddat, muddat_vaqt, holat)
  values ('${A}', 'jamoadosh@sinov.uz', 'Kechikkan ish', current_date - 1, time '09:00', 'kutilmoqda');`)
const n1 = (await db.query(`select public.topshiriq_muddat_xabarlari() n`)).rows[0].n
const n2 = (await db.query(`select public.topshiriq_muddat_xabarlari() n`)).rows[0].n
const kechXabar = (await db.query(`
  select count(*)::int n from public.topshiriq_xabarlari x
    join public.topshiriqlar t on t.id = x.topshiriq_id
   where t.sarlavha = 'Kechikkan ish'`)).rows[0].n
belgi('kechikish ikkala tomonga, faqat bir marta', n1 >= 1 && n2 === 0 && kechXabar === 2)

// Shaxsiy taklif havolasi
const taklifKodi = (await db.query(
  `select taklif_kodi from public.profiles where id = '${A}'`)).rows[0].taklif_kodi
belgi('har profilda taklif kodi bor', typeof taklifKodi === 'string' && taklifKodi.length === 10)
await sifatida(D, 'begona@sinov.uz', `select public.taklif_orqali_ulanish('${taklifKodi}')`)
belgi('taklif orqali ulangan kontaktda ism bilan chiqadi', (await sifatida(D, 'begona@sinov.uz',
  `select ism from public.topshiriq_kontaktlari() where email = 'boshliq@sinov.uz'`)).rows[0]?.ism != null)
belgi('taklif egasi ham yangi odamni ko\'radi', (await sifatida(A, 'boshliq@sinov.uz',
  `select 1 from public.topshiriq_kontaktlari() where email = 'begona@sinov.uz'`)).rows.length === 1)
belgi("begona hali ham jamoani ko'rmaydi", (await sifatida(D, 'begona@sinov.uz',
  `select * from public.jamoa_azolari`)).rows.length === 0)

// Jamoani o'chirish: faqat rahbar
belgi("a'zo jamoani o'chira olmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz',
  `select public.jamoani_ochirish('${jamoa}')`))
await sifatida(C, 'jamoadosh@sinov.uz', `select public.jamoadan_chiqish('${jamoa}')`)
belgi("a'zo jamoadan chiqdi", (await db.query(
  `select count(*)::int n from public.jamoa_azolari where jamoa_id = '${jamoa}'`)).rows[0].n === 1)

// -------------------------------------------------------------
// Soddalashtirish: boshlanish, tahrirlash, o'qilmaganlar
// -------------------------------------------------------------
console.log('\n== topshiriq: boshlanish, tahrir, yangiliklar ==')

// Avvalgi sinovdagi blok olib tashlanadi (C endi jamoada emas)
await db.exec(`delete from public.topshiriq_ruxsatlari where egasi_id = '${C}';`)

const yangiTsh = (await sifatida(A, 'boshliq@sinov.uz', `
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, izoh, boshlanish, muddat, muddat_vaqt)
  values ('${A}', 'jamoadosh@sinov.uz', 'Kassani topshirish', 'Naqd va karta',
          current_date + 1, current_date + 3, time '11:00')
  returning id`)).rows[0].id
let vz = (await db.query(`
  select t.holat, v.due_date = current_date + 1 as reja, v.deadline = current_date + 3 as dedlayn,
         v.due_time is null as soatsiz
    from public.topshiriqlar t join public.tasks v on v.id = t.vazifa_id
   where t.id = '${yangiTsh}'`)).rows[0]
belgi('jamoasiz ham darhol qabul: boshlanish -> reja kuni, muddat -> dedlayn',
  vz?.holat === 'qabul' && vz.reja && vz.dedlayn && vz.soatsiz)

belgi("ijrochi tahrirlay olmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz',
  `select public.topshiriqni_tahrirlash('${yangiTsh}', 'x', null, null, null, null, null, 2::smallint, null)`))
await sifatida(A, 'boshliq@sinov.uz',
  `select public.topshiriqni_tahrirlash('${yangiTsh}', 'Kassani bugun topshirish', 'Yangi izoh',
     null, null, current_date, time '18:00', 1::smallint, null)`)
vz = (await db.query(`
  select v.title, v.description, v.priority, v.due_date = current_date as reja,
         v.due_time = time '18:00' as soat, v.deadline = current_date as dedlayn
    from public.topshiriqlar t join public.tasks v on v.id = t.vazifa_id
   where t.id = '${yangiTsh}'`)).rows[0]
belgi('tahrir ijrochi vazifasiga ham tushdi',
  vz.title === 'Kassani bugun topshirish' && vz.description === 'Yangi izoh' &&
  vz.priority === 1 && vz.reja && vz.soat && vz.dedlayn)

// O'qilmaganlar: ijrochi hali ochmagan, yuboruvchi 2 ta xabar yozdi
for (const m of ['Salom', 'Tezroq bo‘lsin']) {
  await sifatida(A, 'boshliq@sinov.uz', `
    insert into public.topshiriq_izohlari (topshiriq_id, muallif_id, matn)
    values ('${yangiTsh}', '${A}', '${m}')`)
}
let yang = await birinchi(C, 'jamoadosh@sinov.uz',
  `select * from public.topshiriq_yangiliklari() where topshiriq_id = '${yangiTsh}'`)
belgi('ijrochida 2 ta yangi xabar va ochilmagan belgisi',
  yang?.yangi_xabarlar === 2 && yang.ochilmagan === true)
belgi("yuboruvchida o'z xabarlari yangi emas", (await birinchi(A, 'boshliq@sinov.uz',
  `select yangi_xabarlar from public.topshiriq_yangiliklari() where topshiriq_id = '${yangiTsh}'`))
  ?.yangi_xabarlar === 0)
await sifatida(C, 'jamoadosh@sinov.uz', `select public.topshiriq_korildi('${yangiTsh}')`)
yang = await birinchi(C, 'jamoadosh@sinov.uz',
  `select * from public.topshiriq_yangiliklari() where topshiriq_id = '${yangiTsh}'`)
belgi("ochilgach hammasi o'qilgan", yang?.yangi_xabarlar === 0 && yang.ochilmagan === false)
belgi("begona hech narsani ko'rmaydi", (await sifatida(D, 'begona@sinov.uz',
  `select * from public.topshiriq_yangiliklari() where topshiriq_id = '${yangiTsh}'`)).rows.length === 0)

// Hali ro'yxatdan o'tmagan odamga — kirishi bilan qabul qilinadi
await db.exec(`
  insert into public.topshiriqlar (yuboruvchi_id, qabul_qiluvchi_email, sarlavha)
  values ('${A}', 'kelajak@sinov.uz', 'Kutib turadi');`)
belgi("ro'yxatdan o'tmaganga — kutib turadi", (await db.query(
  `select holat from public.topshiriqlar where sarlavha = 'Kutib turadi'`)).rows[0].holat === 'kutilmoqda')
await db.exec(`
  insert into auth.users (id, email)
  values ('00000000-0000-4000-8000-0000000000ee', 'Kelajak@sinov.uz');`)
belgi("ro'yxatdan o'tishi bilan qabul qilindi", (await db.query(`
  select t.holat, v.user_id = '00000000-0000-4000-8000-0000000000ee' as unda
    from public.topshiriqlar t join public.tasks v on v.id = t.vazifa_id
   where t.sarlavha = 'Kutib turadi'`)).rows[0]?.unda === true)

// -------------------------------------------------------------
// Boshlanish soati va istalgan takror
// -------------------------------------------------------------
console.log('\n== topshiriq: boshlanish soati, takror ==')

const soatli = (await sifatida(A, 'boshliq@sinov.uz', `
  insert into public.topshiriqlar
    (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, boshlanish, boshlanish_vaqt,
     muddat, muddat_vaqt, takror)
  values ('${A}', 'jamoadosh@sinov.uz', 'Har 3 kunda', current_date, time '09:00',
          current_date + 1, time '17:00', 'har:3:kun')
  returning id`)).rows[0].id
const sv = (await db.query(`
  select v.due_time = time '09:00' as boshlash, v.deadline = current_date + 1 as dedlayn
    from public.topshiriqlar t join public.tasks v on v.id = t.vazifa_id
   where t.id = '${soatli}'`)).rows[0]
belgi("boshlanish soati — vazifa vaqti, tugash — dedlayn", sv?.boshlash && sv.dedlayn)

await sifatida(C, 'jamoadosh@sinov.uz', `select public.topshiriqni_topshirish('${soatli}', 'ok')`)
await sifatida(A, 'boshliq@sinov.uz', `select public.topshiriqni_tasdiqlash('${soatli}')`)
const kn = (await db.query(`
  select muddat = current_date + 4 as muddat, boshlanish = current_date + 3 as boshi,
         boshlanish_vaqt = time '09:00' as soat
    from public.topshiriqlar where oldingi_id = '${soatli}'`)).rows[0]
belgi("har 3 kunda: keyingisi 3 kun keyin, oraliq saqlandi", kn?.muddat && kn.boshi && kn.soat)

let yomon = false
try {
  await db.exec(`update public.topshiriqlar set takror = 'har:0:kun' where id = '${soatli}'`)
} catch {
  yomon = true
}
belgi("noto'g'ri takror rad etiladi", yomon)


// Reaksiyalar: ishtirokchilar qo'yadi, bitta odam — bitta reaksiya, begona yo'q
const rIzoh = (await db.query(
  `select id from public.topshiriq_izohlari where topshiriq_id = '${jt.id}' limit 1`)).rows[0].id
await sifatida(A, 'boshliq@sinov.uz', `
  insert into public.topshiriq_reaksiyalari (izoh_id, reaksiya) values ('${rIzoh}', 'zor')`)
await sifatida(A, 'boshliq@sinov.uz', `
  insert into public.topshiriq_reaksiyalari (izoh_id, reaksiya) values ('${rIzoh}', 'qarsak')
  on conflict (izoh_id, foydalanuvchi_id) do update set reaksiya = excluded.reaksiya`)
await sifatida(C, 'jamoadosh@sinov.uz', `
  insert into public.topshiriq_reaksiyalari (izoh_id, reaksiya) values ('${rIzoh}', 'kelishuv')`)
const rlar = (await sifatida(C, 'jamoadosh@sinov.uz',
  `select reaksiya from public.topshiriq_reaksiyalari where izoh_id = '${rIzoh}' order by reaksiya`)).rows.map((r) => r.reaksiya)
belgi("reaksiya almashtirildi, ikkinchi tomon ko'radi", rlar.join() === 'kelishuv,qarsak')
belgi("begona reaksiya qo'ya olmaydi", await xatoBeradimi(D, 'begona@sinov.uz', `
  insert into public.topshiriq_reaksiyalari (izoh_id, reaksiya) values ('${rIzoh}', 'zor')`))
belgi("begona reaksiyani ko'rmaydi", (await sifatida(D, 'begona@sinov.uz',
  `select * from public.topshiriq_reaksiyalari`)).rows.length === 0)
belgi("boshqa nomidan reaksiya qo'yib bo'lmaydi", await xatoBeradimi(C, 'jamoadosh@sinov.uz', `
  insert into public.topshiriq_reaksiyalari (izoh_id, foydalanuvchi_id, reaksiya)
  values ('${rIzoh}', '${A}', 'xafa')`))
belgi("noma'lum reaksiya rad etiladi", await xatoBeradimi(C, 'jamoadosh@sinov.uz', `
  update public.topshiriq_reaksiyalari set reaksiya = 'yurak' where izoh_id = '${rIzoh}'`))
await sifatida(C, 'jamoadosh@sinov.uz', `
  update public.topshiriq_reaksiyalari set reaksiya = 'qahqah' where izoh_id = '${rIzoh}'`)
belgi("qah-qah reaksiyasi qabul qilinadi", (await db.query(
  `select count(*)::int n from public.topshiriq_reaksiyalari where reaksiya = 'qahqah'`)).rows[0].n === 1)
await sifatida(C, 'jamoadosh@sinov.uz', `delete from public.topshiriq_reaksiyalari where izoh_id = '${rIzoh}'`)
belgi("faqat o'zinikini o'chiradi", (await db.query(
  `select count(*)::int n from public.topshiriq_reaksiyalari where izoh_id = '${rIzoh}'`)).rows[0].n === 1)

await db.close()
console.log(xato === 0 ? '\nHAMMASI JOYIDA' : `\n${xato} ta muammo`)
process.exit(xato === 0 ? 0 : 1)
