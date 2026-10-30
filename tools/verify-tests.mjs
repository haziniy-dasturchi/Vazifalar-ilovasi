// =============================================================
// supabase/tests/*.sql (pgTAP) fayllarini Dockersiz tekshirish
// =============================================================
// PGlite ichida auth sxemasi stubi + migratsiyalar + pgTAP shim
// yaratiladi, so'ng har bir test fayli alohida ishga tushiriladi.
// Shim har bir buzilgan tasdiqda exception ko'taradi, shuning uchun
// faylning xatosiz o'tishi barcha tasdiqlar bajarilganini bildiradi.
//
// Ishga tushirish:  cd tools && npm run verify:tests

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const migrationsDir = join(root, 'supabase', 'migrations');
const testsDir = join(root, 'supabase', 'tests');

const AUTH_STUB = readFileSync(join(here, 'auth-stub.sql'), 'utf8');
const TAP_SHIM = readFileSync(join(here, 'pgtap-shim.sql'), 'utf8');

const db = await PGlite.create();
await db.exec(AUTH_STUB);

for (const f of readdirSync(migrationsDir).filter((x) => x.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
}
await db.exec(TAP_SHIM);
console.log('Sxema tayyor (auth stub + migratsiyalar + pgTAP shim).\n');

let failed = 0;
for (const f of readdirSync(testsDir).filter((x) => x.endsWith('.sql')).sort()) {
  // pgtap kengaytmasi PGlite'da yo'q — shim uni almashtiradi
  const sql = readFileSync(join(testsDir, f), 'utf8')
    .split('\n')
    .filter((line) => !/create extension .*pgtap/i.test(line))
    .join('\n');

  const planned = Number((sql.match(/select plan\((\d+)\)/i) || [])[1] || 0);

  try {
    await db.exec(sql);
    console.log(`  ok   ${f}  (${planned} ta tasdiq)`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${f}\n       ${e.message}`);
    // Tranzaksiya yarim qolgan bo'lishi mumkin
    try {
      await db.exec('rollback;');
    } catch {}
  }
}

console.log(
  failed
    ? `\nXato: ${failed} ta test fayli o'tmadi.\n`
    : `\nBarcha test fayllari o'tdi.\n`
);
await db.close();
process.exit(failed ? 1 : 0);
