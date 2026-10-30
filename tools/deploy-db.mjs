// =============================================================
// Migratsiyalarni bulutdagi Supabase bazasiga yuklash
// =============================================================
// Supabase Management API orqali ishlaydi — ma'lumotlar bazasi
// paroli kerak emas, faqat Personal Access Token.
//
// Ishga tushirish:
//   node tools/deploy-db.mjs <PROJECT_REF>
//
// Token .secrets/supabase-token.txt faylidan yoki
// SUPABASE_ACCESS_TOKEN muhit o'zgaruvchisidan olinadi.
//
// Skript takroriy ishga tushirishga chidamli: allaqachon qo'llangan
// migratsiyalarni o'tkazib yuboradi (supabase_migrations jadvali bo'yicha).

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const migrationsDir = join(root, 'supabase', 'migrations')

const REF = process.argv[2] ?? process.env.SUPABASE_PROJECT_REF
const tokenFile = join(root, '.secrets', 'supabase-token.txt')
const TOKEN =
  process.env.SUPABASE_ACCESS_TOKEN ??
  (existsSync(tokenFile) ? readFileSync(tokenFile, 'utf8').trim() : null)

if (!REF || !TOKEN) {
  console.error(
    'Foydalanish: node tools/deploy-db.mjs <PROJECT_REF>\n' +
      'Token .secrets/supabase-token.txt da yoki SUPABASE_ACCESS_TOKEN da bo‘lishi kerak.'
  )
  process.exit(2)
}

const API = `https://api.supabase.com/v1/projects/${REF}/database/query`

/** Bazada SQL bajarish */
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
      const j = JSON.parse(matn)
      xato = j.message ?? j.error ?? matn
    } catch {
      // matn o'z holicha qoladi
    }
    throw new Error(xato)
  }

  try {
    return JSON.parse(matn)
  } catch {
    return null
  }
}

// -------------------------------------------------------------
// 1. Migratsiya tarixi jadvali
// -------------------------------------------------------------
console.log(`Loyiha: ${REF}\n`)
console.log('Migratsiya tarixini tayyorlash...')

await sql(`
  create schema if not exists supabase_migrations;
  create table if not exists supabase_migrations.schema_migrations (
    version    text primary key,
    statements text[],
    name       text
  );
`)

const qollangan = new Set(
  (
    await sql(
      'select version from supabase_migrations.schema_migrations order by version'
    )
  )?.map((r) => r.version) ?? []
)

if (qollangan.size) {
  console.log(`  avval qo‘llangan: ${qollangan.size} ta`)
}

// -------------------------------------------------------------
// 2. Migratsiyalarni navbat bilan qo'llash
// -------------------------------------------------------------
const fayllar = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort()

console.log(`\nMigratsiyalar (${fayllar.length} ta):`)

let yangi = 0
for (const fayl of fayllar) {
  const version = fayl.split('_')[0]
  const nom = fayl.replace(/^\d+_/, '').replace(/\.sql$/, '')

  if (qollangan.has(version)) {
    console.log(`  o‘tkazildi  ${fayl}  (allaqachon qo‘llangan)`)
    continue
  }

  const mazmun = readFileSync(join(migrationsDir, fayl), 'utf8')

  try {
    await sql(mazmun)
    await sql(`
      insert into supabase_migrations.schema_migrations (version, name)
      values ('${version}', '${nom.replace(/'/g, "''")}')
      on conflict (version) do nothing;
    `)
    console.log(`  ok          ${fayl}`)
    yangi++
  } catch (e) {
    console.error(`  XATO        ${fayl}\n              ${e.message}`)
    process.exit(1)
  }
}

// -------------------------------------------------------------
// 3. Natijani tekshirish
// -------------------------------------------------------------
console.log(`\nYangi qo‘llangan: ${yangi} ta\n`)
console.log('Bazadagi holat:')

const jadvallar = await sql(`
  select table_name
  from information_schema.tables
  where table_schema = 'public' and table_type = 'BASE TABLE'
  order by table_name
`)
console.log(
  `  jadvallar (${jadvallar.length}): ${jadvallar.map((t) => t.table_name).join(', ')}`
)

const rls = await sql(`
  select count(*)::int as n
  from pg_tables
  where schemaname = 'public' and rowsecurity
`)
console.log(`  RLS yoqilgan jadvallar: ${rls[0].n}`)

const siyosat = await sql(`
  select count(*)::int as n from pg_policies where schemaname = 'public'
`)
console.log(`  RLS siyosatlari: ${siyosat[0].n}`)

const funksiya = await sql(`
  select p.proname
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind = 'f'
    and p.proname in ('start_task','move_back','complete_task',
                      'uncomplete_task','get_report','next_occurrence')
  order by p.proname
`)
console.log(
  `  RPC funksiyalar (${funksiya.length}): ${funksiya.map((f) => f.proname).join(', ')}`
)

const trigger = await sql(`
  select count(*)::int as n
  from pg_trigger
  where not tgisinternal
`)
console.log(`  triggerlar: ${trigger[0].n}`)

console.log('\nTayyor.')
