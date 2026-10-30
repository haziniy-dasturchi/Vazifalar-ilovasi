import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const db = await PGlite.create();
await db.exec(readFileSync(join(here, 'auth-stub.sql'), 'utf8'));
for (const f of readdirSync(join(root,'supabase','migrations')).filter(x=>x.endsWith('.sql')).sort())
  await db.exec(readFileSync(join(root,'supabase','migrations',f),'utf8'));
const cols = await db.query(`
  select table_name, ordinal_position, column_name, data_type, udt_name,
         is_nullable, column_default is not null as has_default
  from information_schema.columns
  where table_schema='public'
  order by table_name, ordinal_position`);
let cur='';
for (const c of cols.rows) {
  if (c.table_name !== cur) { cur = c.table_name; console.log('\n## '+cur); }
  console.log(`  ${c.column_name} | ${c.udt_name} | null=${c.is_nullable} | default=${c.has_default}`);
}
const fns = await db.query(`
  select p.proname, pg_get_function_arguments(p.oid) as args,
         pg_get_function_result(p.oid) as result
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.prokind='f' order by p.proname`);
console.log('\n## FUNCTIONS');
for (const f of fns.rows) console.log(`  ${f.proname}(${f.args}) -> ${f.result}`);
await db.close();
