// =============================================================
// Vazifalar — Dockersiz lokal tekshiruv
// =============================================================
// Nima qiladi:
//   1. PGlite (WASM PostgreSQL 17) ichida Supabase'ning `auth` sxemasi
//      va rollarining soddalashtirilgan nusxasini yaratadi;
//   2. supabase/migrations/ dagi barcha migratsiyalarni tartib bilan qo'llaydi;
//   3. supabase/seed.sql ni yuklaydi;
//   4. RLS, triggerlar, RPC funksiyalar va get_report mantiqini sinaydi.
//
// Ishga tushirish:  cd tools && npm install && npm run verify
//
// MUHIM: bu pgTAP testlarining o'rnini bosmaydi. Haqiqiy Supabase muhitida
// `supabase test db` ni ishga tushirish kerak (Docker talab qiladi).

import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const migrationsDir = join(root, 'supabase', 'migrations');

const USER_A = '11111111-1111-1111-1111-111111111111'; // seed'dagi test user
const USER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const AUTH_STUB = readFileSync(join(here, 'auth-stub.sql'), 'utf8');


// -------------------------------------------------------------
// Kichik test yordamchilari
// -------------------------------------------------------------
let pass = 0;
const failures = [];

function ok(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  FAIL ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function eq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  ok(name, a === e, a === e ? '' : `kutilgan ${e}, olingan ${a}`);
}

const db = await PGlite.create();

async function one(sql, params) {
  const r = await db.query(sql, params);
  return r.rows[0];
}
async function val(sql, params) {
  const row = await one(sql, params);
  return row ? Object.values(row)[0] : undefined;
}
async function num(sql, params) {
  return Number(await val(sql, params));
}

async function asUser(uid, fn) {
  await db.exec(
    `set role authenticated;
     select set_config('request.jwt.claims', '{"sub":"${uid}","role":"authenticated"}', false);`
  );
  try {
    return await fn();
  } finally {
    await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
  }
}

async function expectError(name, fn, substr) {
  try {
    await fn();
    ok(name, false, 'xato kutilgan edi, lekin so’rov muvaffaqiyatli bajarildi');
  } catch (e) {
    const msg = String(e.message || e);
    ok(name, !substr || msg.includes(substr), substr ? `xato matni: ${msg}` : '');
  }
}

// =============================================================
// 1. Sxemani qurish
// =============================================================
console.log('\n== 1. Migratsiyalar ==');
await db.exec(AUTH_STUB);

const files = readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
for (const f of files) {
  try {
    await db.exec(readFileSync(join(migrationsDir, f), 'utf8'));
    console.log(`  ok   ${f}`);
    pass++;
  } catch (e) {
    failures.push(`${f}: ${e.message}`);
    console.log(`  FAIL ${f}\n       ${e.message}`);
    console.log('\nMigratsiya xatosi — tekshiruv to’xtatildi.');
    process.exit(1);
  }
}

// =============================================================
// 2. Yangi foydalanuvchi: profil + bitta Inbox
// =============================================================
console.log('\n== 2. Yangi foydalanuvchi triggeri ==');
await db.exec(`
  insert into auth.users (id, email, raw_user_meta_data)
  values ('${USER_B}', 'b@vazifalar.local', '{"full_name":"Bekzod Test"}'::jsonb);
`);
eq('profiles qatori yaratildi',
  await num(`select count(*) from public.profiles where id = '${USER_B}'`), 1);
eq('full_name metadatadan olindi',
  await val(`select full_name from public.profiles where id = '${USER_B}'`), 'Bekzod Test');
eq('timezone default = Asia/Tashkent',
  await val(`select timezone from public.profiles where id = '${USER_B}'`), 'Asia/Tashkent');
eq('daily_goal default = 5',
  await num(`select daily_goal from public.profiles where id = '${USER_B}'`), 5);
eq('aynan 1 ta papka yaratildi',
  await num(`select count(*) from public.folders where user_id = '${USER_B}'`), 1);
eq('yaratilgan papka — Inbox',
  await val(`select is_inbox from public.folders where user_id = '${USER_B}'`), true);

// =============================================================
// 3. Inbox himoyasi
// =============================================================
console.log('\n== 3. Inbox himoyasi ==');
const inboxB = await val(`select id from public.folders where user_id = '${USER_B}' and is_inbox`);

await expectError('Inbox o’chirilmaydi',
  () => db.exec(`delete from public.folders where id = '${inboxB}'`),
  "o'chirish mumkin emas");
await expectError('Inbox arxivlanmaydi',
  () => db.exec(`update public.folders set is_archived = true where id = '${inboxB}'`),
  'arxivlash mumkin emas');
await expectError('is_inbox o’zgartirilmaydi',
  () => db.exec(`update public.folders set is_inbox = false where id = '${inboxB}'`),
  'is_inbox');
eq('Inbox hali ham joyida',
  await num(`select count(*) from public.folders where id = '${inboxB}'`), 1);

// Oddiy papkani o'chirish mumkin
await db.exec(`
  insert into public.folders (id, user_id, name)
  values ('cccccccc-0000-0000-0000-000000000001', '${USER_B}', 'Vaqtinchalik');
  delete from public.folders where id = 'cccccccc-0000-0000-0000-000000000001';
`);
ok('oddiy papka o’chiriladi', true);

// =============================================================
// 5. Seed
// =============================================================
console.log('\n== 4. seed.sql ==');
try {
  await db.exec(readFileSync(join(root, 'supabase', 'seed.sql'), 'utf8'));
  ok('seed.sql xatosiz bajarildi', true);
} catch (e) {
  ok('seed.sql xatosiz bajarildi', false, e.message);
  console.log('\nSeed xatosi — qolgan testlar ma’noga ega emas.');
  process.exit(1);
}

eq('20 ta vazifa yuklandi',
  await num(`select count(*) from public.tasks where user_id = '${USER_A}'`), 20);
eq('3 ta papka (Inbox + 2)',
  await num(`select count(*) from public.folders where user_id = '${USER_A}'`), 3);
eq('4 ta bo’lim',
  await num(`select count(*) from public.sections where user_id = '${USER_A}'`), 4);
eq('3 ta subtask',
  await num(`select count(*) from public.tasks where user_id = '${USER_A}' and parent_id is not null`), 3);
eq('2 ta teg',
  await num(`select count(*) from public.labels where user_id = '${USER_A}'`), 2);
eq('8 ta pomodoro sessiya',
  await num(`select count(*) from public.pomodoro_sessions where user_id = '${USER_A}'`), 8);
ok('kechikkan ochiq vazifalar bor',
  (await num(`select count(*) from public.tasks
              where user_id = '${USER_A}' and status <> 'done'
                and least(due_date, deadline) < current_date`)) >= 4);
eq('3 ta takrorlanuvchi vazifa',
  await num(`select count(*) from public.tasks
             where user_id = '${USER_A}' and recurrence is not null`), 3);

// =============================================================
// 4. RLS
// =============================================================
console.log('\n== 5. Row Level Security ==');
await db.exec(`insert into public.folders (user_id, name) values ('${USER_B}', 'B papkasi');`);

await asUser(USER_A, async () => {
  const foldersSeen = await num(`select count(*) from public.folders`);
  const ownFolders = await num(`select count(*) from public.folders where user_id = '${USER_A}'`);
  eq('A faqat o’z papkalarini ko’radi', foldersSeen, ownFolders);
  eq('A da B ning papkasi ko’rinmaydi',
    await num(`select count(*) from public.folders where user_id = '${USER_B}'`), 0);
  eq('A da B ning vazifalari ko’rinmaydi',
    await num(`select count(*) from public.tasks where user_id = '${USER_B}'`), 0);
  eq('A o’z profilini ko’radi', await num(`select count(*) from public.profiles`), 1);
});

await asUser(USER_B, async () => {
  eq('B da A ning vazifalari ko’rinmaydi',
    await num(`select count(*) from public.tasks where user_id = '${USER_A}'`), 0);
  eq('B 20 ta A vazifasini emas, 0 ta ko’radi',
    await num(`select count(*) from public.tasks`), 0);

  const inboxA = await val(
    `select id from public.folders where is_inbox limit 1`); // faqat o'zining Inbox'i
  ok('B ga faqat o’z Inbox id si ko’rinadi', inboxA === inboxB, `olingan ${inboxA}`);

  await expectError('B boshqa user_id bilan papka qo’sha olmaydi',
    () => db.exec(`insert into public.folders (user_id, name) values ('${USER_A}', 'Buzg’unchi')`),
    'row-level security');

  await expectError('B A ning vazifasini o’zgartira olmaydi (0 qator -> RPC xatosi)',
    () => db.query(`select public.start_task($1)`, ['44444444-0000-0000-0000-000000000001']),
    'Vazifa topilmadi');
});

// anon hech narsa ko'rmaydi: yo huquq yo'q, yo 0 qator
async function anonSeesNothing(name, table) {
  await db.exec(`set role anon;`);
  let verdict, detail;
  try {
    const n = await num(`select count(*) from public.${table}`);
    verdict = n === 0;
    detail = `qator soni ${n}`;
  } catch (e) {
    verdict = String(e.message).includes('permission denied');
    detail = e.message;
  } finally {
    await db.exec(`reset role;`);
  }
  ok(name, verdict, detail);
}
await anonSeesNothing('anon papkalarga kira olmaydi', 'folders');
await anonSeesNothing('anon vazifalarga kira olmaydi', 'tasks');
await expectError('anon get_report ni chaqira olmaydi', async () => {
  await db.exec(`set role anon;`);
  try {
    await db.query(`select public.get_report(current_date - 7, current_date)`);
  } finally {
    await db.exec(`reset role;`);
  }
}, 'permission denied');

// =============================================================
// 12. get_report
// =============================================================
console.log('\n== 6. get_report (seed holatidagi aniq qiymatlar) ==');
await asUser(USER_A, async () => {
  const report = await val(
    `select public.get_report((current_date - 13), current_date)`);
  const r = typeof report === 'string' ? JSON.parse(report) : report;

  ok('summary mavjud', r.summary && typeof r.summary === 'object');
  eq('by_day uzunligi 14', r.by_day.length, 14);
  eq('by_folder uzunligi 3', r.by_folder.length, 3);

  // Seed ma'lumotlari aniq, shuning uchun qiymatlar ham aniq tekshiriladi.
  // 12 = Inbox 1 + Ish 5 bajarilgan vazifa + 6 ta takrorlanuvchi bajarilish
  eq('summary.completed = 12', r.summary.completed, 12);
  eq('summary.completed_prev = 8', r.summary.completed_prev, 8);
  eq('summary.focus_minutes = 125', r.summary.focus_minutes, 125);
  // 6 ta bajarilgan vazifadan 5 tasi muddatida -> 83.3%
  eq('summary.on_time_rate = 83.3', Number(r.summary.on_time_rate), 83.3);
  eq('summary.overdue_open = 4', r.summary.overdue_open, 4);

  const byDaySum = r.by_day.reduce((s, d) => s + d.completed, 0);
  eq('by_day yig’indisi summary.completed ga teng', byDaySum, r.summary.completed);
  ok('by_day birinchi kun to’g’ri formatda', /^\d{4}-\d{2}-\d{2}/.test(r.by_day[0].date));

  const byName = Object.fromEntries(r.by_folder.map((f) => [f.name, f]));
  ok('Kiruvchi papkasi bor', !!byName['Kiruvchi']);
  ok('Ish papkasi bor', !!byName['Ish']);
  ok("O'qish papkasi bor", !!byName["O'qish"]);

  eq('O’qish health = behind', byName["O'qish"].health, 'behind');
  eq('O’qish sababi', byName["O'qish"].reason, 'Bu davrda 0 ta vazifa bajarilmagan');
  eq('O’qish completed = 0', byName["O'qish"].completed, 0);
  eq('O’qish open = 6', byName["O'qish"].open, 6);
  eq('O’qish overdue = 4', byName["O'qish"].overdue, 4);

  eq('Ish health = good', byName['Ish'].health, 'good');
  eq('Ish completed = 11', byName['Ish'].completed, 11);
  eq('Ish open = 6', byName['Ish'].open, 6);
  eq('Ish overdue = 0', byName['Ish'].overdue, 0);
  eq('Ish focus_minutes = 125', byName['Ish'].focus_minutes, 125);
  ok('Ish last_activity_at to’lgan', byName['Ish'].last_activity_at !== null);

  eq('Kiruvchi completed = 1', byName['Kiruvchi'].completed, 1);
  eq('Kiruvchi open = 2', byName['Kiruvchi'].open, 2);
  eq('Kiruvchi focus_minutes = 0', byName['Kiruvchi'].focus_minutes, 0);

  eq('Kiruvchi health = attention', byName['Kiruvchi'].health, 'attention');
  eq('Kiruvchi sababi', byName['Kiruvchi'].reason,
    "Oxirgi 7 kunda hech qanday harakat bo'lmagan");

  await expectError('teskari davr xato beradi',
    () => db.query(`select public.get_report(current_date, current_date - 5)`),
    'Noto');

  console.log('\n  --- get_report (seed ma’lumotlari) ---');
  console.log('  summary:', JSON.stringify(r.summary));
  for (const f of r.by_folder) {
    console.log(
      `  ${f.name.padEnd(10)} health=${String(f.health).padEnd(9)} ` +
      `completed=${f.completed} open=${f.open} overdue=${f.overdue} ` +
      `focus=${f.focus_minutes}  "${f.reason}"`
    );
  }
});

// =============================================================
// 6. Subtask qoidalari
// =============================================================
console.log('\n== 7. Subtask iyerarxiyasi ==');
const PARENT = '44444444-0000-0000-0000-000000000008'; // Prezentatsiya tayyorlash
const CHILD = '44444444-0000-0000-0000-00000000000d';  // Matnni yozish

eq('subtask ota-vazifa papkasida',
  await val(`select (c.folder_id = p.folder_id) from public.tasks c
             join public.tasks p on p.id = c.parent_id where c.id = '${CHILD}'`), true);

await expectError('2-daraja subtask taqiqlangan',
  () => db.exec(`insert into public.tasks (user_id, folder_id, parent_id, title)
                 values ('${USER_A}',
                         '22222222-0000-0000-0000-000000000001',
                         '${CHILD}', 'Ikkinchi daraja')`),
  'faqat 1 daraja');

// Ota-vazifani boshqa papkaga ko'chiramiz -> subtasklar ham ko'chadi
await db.exec(`update public.tasks
                  set folder_id = '22222222-0000-0000-0000-000000000002',
                      section_id = null
                where id = '${PARENT}'`);
eq('ota ko’chdi -> 3 subtask ham ko’chdi',
  await num(`select count(*) from public.tasks
             where parent_id = '${PARENT}'
               and folder_id = '22222222-0000-0000-0000-000000000002'`), 3);
// Orqaga qaytaramiz
await db.exec(`update public.tasks
                  set folder_id = '22222222-0000-0000-0000-000000000001',
                      section_id = '33333333-0000-0000-0000-000000000002'
                where id = '${PARENT}'`);
eq('subtasklar bo’lim bilan birga qaytdi',
  await num(`select count(*) from public.tasks
             where parent_id = '${PARENT}'
               and section_id = '33333333-0000-0000-0000-000000000002'`), 3);

// =============================================================
// 7. status -> timestamp + task_events
// =============================================================
console.log('\n== 8. Holat ozgarishi va hodisalar ==');
const T_OPEN = '44444444-0000-0000-0000-00000000000b'; // Ofis jihozlari (planned)

await asUser(USER_A, async () => {
  const r1 = await one(`select status, started_at from public.start_task($1)`, [T_OPEN]);
  eq('start_task -> in_progress', r1.status, 'in_progress');
  ok('started_at to’ldirildi', r1.started_at !== null);
  eq("'started' hodisasi yozildi",
    await num(`select count(*) from public.task_events
               where task_id = '${T_OPEN}' and event = 'started'`), 1);

  const r2 = await one(`select status from public.move_back($1)`, [T_OPEN]);
  eq('move_back -> planned', r2.status, 'planned');
  eq("'moved_back' hodisasi yozildi",
    await num(`select count(*) from public.task_events
               where task_id = '${T_OPEN}' and event = 'moved_back'`), 1);

  await expectError('tugallanmagan vazifani uncomplete qilish xato',
    () => db.query(`select public.uncomplete_task($1)`, [T_OPEN]), 'done');

  const r3 = await one(`select status, completed_at from public.complete_task($1, false)`, [T_OPEN]);
  eq('complete_task -> done', r3.status, 'done');
  ok('completed_at to’ldirildi', r3.completed_at !== null);
  eq("'completed' hodisasi yozildi",
    await num(`select count(*) from public.task_events
               where task_id = '${T_OPEN}' and event = 'completed'`), 1);

  const r4 = await one(`select status, completed_at from public.uncomplete_task($1)`, [T_OPEN]);
  eq('uncomplete_task -> planned', r4.status, 'planned');
  eq('completed_at tozalandi', r4.completed_at, null);
  eq("'uncompleted' hodisasi yozildi",
    await num(`select count(*) from public.task_events
               where task_id = '${T_OPEN}' and event = 'uncompleted'`), 1);

  await expectError('planned vazifani move_back qilish xato',
    () => db.query(`select public.move_back($1)`, [T_OPEN]), 'in_progress');
});

// =============================================================
// 8. include_subtasks
// =============================================================
console.log('\n== 9. complete_task(include_subtasks) ==');
await asUser(USER_A, async () => {
  await db.query(`select public.complete_task($1, $2)`, [PARENT, true]);
  eq('ota-vazifa done',
    await val(`select status from public.tasks where id = '${PARENT}'`), 'done');
  eq('barcha subtasklar done',
    await num(`select count(*) from public.tasks
               where parent_id = '${PARENT}' and status = 'done'`), 3);

  await db.query(`select public.uncomplete_task($1)`, [PARENT]);
  // subtasklar done holatida qoladi — faqat ota qaytadi
  eq('ota qaytdi, subtasklar o’zgarmadi',
    await val(`select status from public.tasks where id = '${PARENT}'`), 'planned');
});

// =============================================================
// 9. Takrorlanuvchi vazifa
// =============================================================
console.log('\n== 10. Takrorlanuvchi vazifa ==');
const T_DAILY = '44444444-0000-0000-0000-000000000005'; // Kunlik ko'rik (daily)
const T_WEEKDAYS = '44444444-0000-0000-0000-000000000013'; // Kitob o'qish (weekdays, kechikkan)

await asUser(USER_A, async () => {
  const before = await num(`select count(*) from public.task_events
                            where task_id = '${T_DAILY}' and event = 'completed'`);
  const r = await one(`select status, due_date, completed_at, started_at
                       from public.complete_task($1, false)`, [T_DAILY]);
  eq('daily: status planned ga qaytdi', r.status, 'planned');
  eq('daily: completed_at tozalandi', r.completed_at, null);
  eq('daily: started_at tozalandi', r.started_at, null);

  const dueDate = new Date(r.due_date).toISOString().slice(0, 10);
  const today = await val(`select (now() at time zone 'Asia/Tashkent')::date::text`);
  ok('daily: due_date bugundan keyinga surildi', dueDate > today, `${dueDate} > ${today}`);

  eq("daily: aynan 1 ta yangi 'completed' hodisasi",
    await num(`select count(*) from public.task_events
               where task_id = '${T_DAILY}' and event = 'completed'`), before + 1);
  eq("daily: ortiqcha 'uncompleted' hodisasi yo’q",
    await num(`select count(*) from public.task_events
               where task_id = '${T_DAILY}' and event = 'uncompleted'`), 0);

  // Kechikkan weekdays vazifasi — kelajakdagi ish kuniga sakraydi
  const r2 = await one(`select due_date from public.complete_task($1, false)`, [T_WEEKDAYS]);
  const d2 = new Date(r2.due_date).toISOString().slice(0, 10);
  ok('weekdays: kelajakka surildi', d2 > today, `${d2} > ${today}`);
  const isodow = await num(`select extract(isodow from $1::date)`, [d2]);
  ok('weekdays: dam olish kuniga tushmadi', isodow >= 1 && isodow <= 5, `isodow=${isodow}`);
});

// next_occurrence to'g'ridan-to'g'ri
console.log('\n== 10b. next_occurrence ==');
eq('daily: +1 kun',
  String(await val(`select public.next_occurrence('2026-03-10', 'daily', '2026-03-10')::text`)),
  '2026-03-11');
eq('weekdays: juma -> dushanba',
  String(await val(`select public.next_occurrence('2026-03-13', 'weekdays', '2026-03-13')::text`)),
  '2026-03-16');
eq('weekly: +7 kun',
  String(await val(`select public.next_occurrence('2026-03-10', 'weekly', '2026-03-10')::text`)),
  '2026-03-17');
eq('monthly: 31-yanvar -> 28-fevral (2026)',
  String(await val(`select public.next_occurrence('2026-01-31', 'monthly', '2026-01-31')::text`)),
  '2026-02-28');
eq('monthly: oyning kuni saqlanadi (31 -> mart)',
  String(await val(`select public.next_occurrence('2026-01-31', 'monthly', '2026-02-28')::text`)),
  '2026-03-31');
eq('o’tgan sana bo’lsa kelajakka sakraydi',
  String(await val(`select public.next_occurrence('2026-03-01', 'daily', '2026-03-20')::text`)),
  '2026-03-21');

// =============================================================
// 10. Cascade
// =============================================================
console.log('\n== 11. Cascade ochirish ==');
await db.exec(`
  insert into auth.users (id, email) values ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'd@vazifalar.local');
  insert into public.folders (id, user_id, name)
    values ('dddddddd-0000-0000-0000-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'Sinov');
  insert into public.sections (id, user_id, folder_id, name)
    values ('dddddddd-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'dddddddd-0000-0000-0000-000000000001', 'Bo’lim');
  insert into public.tasks (id, user_id, folder_id, section_id, title)
    values ('dddddddd-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'dddddddd-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000002', 'Ota');
  insert into public.tasks (id, user_id, folder_id, parent_id, title)
    values ('dddddddd-0000-0000-0000-000000000004', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'dddddddd-0000-0000-0000-000000000001', 'dddddddd-0000-0000-0000-000000000003', 'Bola');
`);

await db.exec(`delete from public.sections where id = 'dddddddd-0000-0000-0000-000000000002'`);
eq("bo’lim o’chdi -> undagi vazifa va subtask ham o’chdi",
  await num(`select count(*) from public.tasks
             where user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'`), 0);
eq('hodisalar jurnali saqlandi (task_id null)',
  await num(`select count(*) from public.task_events
             where user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd' and task_id is null`), 2);

await db.exec(`
  insert into public.tasks (id, user_id, folder_id, title)
    values ('dddddddd-0000-0000-0000-000000000005', 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            'dddddddd-0000-0000-0000-000000000001', 'Yana bitta');
  delete from public.folders where id = 'dddddddd-0000-0000-0000-000000000001';
`);
eq('papka o’chdi -> vazifalari ham o’chdi',
  await num(`select count(*) from public.tasks
             where user_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'`), 0);

// Foydalanuvchini o'chirish Inbox himoyasiga urilmasligi kerak
await db.exec(`delete from auth.users where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'`);
eq('foydalanuvchi o’chdi (Inbox himoyasi to’sqinlik qilmadi)',
  await num(`select count(*) from public.profiles
             where id = 'dddddddd-dddd-dddd-dddd-dddddddddddd'`), 0);

// =============================================================
// 11. updated_at
// =============================================================
console.log('\n== 12. updated_at ==');
const beforeUpd = await val(`select updated_at from public.tasks where id = '${T_OPEN}'`);
await db.exec(`update public.tasks set title = title || ' (tahrir)' where id = '${T_OPEN}'`);
const afterUpd = await val(`select updated_at from public.tasks where id = '${T_OPEN}'`);
ok('tasks.updated_at yangilandi', new Date(afterUpd) > new Date(beforeUpd));

// =============================================================
// 13. health qoidalarini bevosita sinash
// =============================================================
console.log('\n== 13. folder_health qoidalari ==');
const H = async (open, completed, overdue, lastActivity) =>
  JSON.parse(await val(
    `select public.folder_health($1, $2, $3, $4)::text`,
    [open, completed, overdue, lastActivity]));

eq('ochiq bor + 0 bajarilgan -> behind',
  (await H(5, 0, 0, new Date().toISOString())).health, 'behind');
eq('kechikkanlar 40% -> behind',
  (await H(10, 3, 4, new Date().toISOString())).health, 'behind');
eq('harakat 10 kun oldin -> attention',
  (await H(5, 2, 0, new Date(Date.now() - 10 * 864e5).toISOString())).health, 'attention');
eq('kechikkanlar 20% -> attention',
  (await H(10, 3, 2, new Date().toISOString())).health, 'attention');
eq('kechikkanlar 30% (chegara) -> attention',
  (await H(10, 3, 3, new Date().toISOString())).health, 'attention');
eq('kechikkanlar 31% -> behind',
  (await H(100, 3, 31, new Date().toISOString())).health, 'behind');
eq('sog’lom papka -> good',
  (await H(10, 5, 0, new Date().toISOString())).health, 'good');
eq('bo’sh papka + yangi -> good',
  (await H(0, 0, 0, new Date().toISOString())).health, 'good');

// =============================================================
// Natija
// =============================================================
console.log('\n=============================================');
console.log(`  O’tdi: ${pass}   Xato: ${failures.length}`);
if (failures.length) {
  console.log('\n  Xatolar:');
  for (const f of failures) console.log('   - ' + f);
}
console.log('=============================================\n');
await db.close();
process.exit(failures.length ? 1 : 0);
