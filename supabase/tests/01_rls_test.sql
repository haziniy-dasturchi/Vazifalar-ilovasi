-- =============================================================
-- Test 01 — Row Level Security
-- Ishga tushirish: supabase test db
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

-- -------------------------------------------------------------
-- Tayyorgarlik: ikki foydalanuvchi (triggerlar Inbox yaratadi)
-- -------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa1-0000-4000-8000-000000000001',
   'authenticated', 'authenticated', 'rls-a@test.local', '', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'aaaaaaa2-0000-4000-8000-000000000002',
   'authenticated', 'authenticated', 'rls-b@test.local', '', now(), now());

insert into public.folders (id, user_id, name) values
  ('aaaaaaa1-1000-4000-8000-000000000001', 'aaaaaaa1-0000-4000-8000-000000000001', 'A papkasi'),
  ('aaaaaaa2-1000-4000-8000-000000000002', 'aaaaaaa2-0000-4000-8000-000000000002', 'B papkasi');

insert into public.tasks (id, user_id, folder_id, title) values
  ('aaaaaaa1-2000-4000-8000-000000000001', 'aaaaaaa1-0000-4000-8000-000000000001',
   'aaaaaaa1-1000-4000-8000-000000000001', 'A ning vazifasi'),
  ('aaaaaaa2-2000-4000-8000-000000000002', 'aaaaaaa2-0000-4000-8000-000000000002',
   'aaaaaaa2-1000-4000-8000-000000000002', 'B ning vazifasi');

-- -------------------------------------------------------------
-- A foydalanuvchi sifatida
-- -------------------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaa1-0000-4000-8000-000000000001","role":"authenticated"}',
  true);

select is(
  (select count(*) from public.folders
    where user_id = 'aaaaaaa2-0000-4000-8000-000000000002')::int,
  0,
  'A foydalanuvchi B ning papkalarini ko''rmaydi');

select is(
  (select count(*) from public.tasks
    where user_id = 'aaaaaaa2-0000-4000-8000-000000000002')::int,
  0,
  'A foydalanuvchi B ning vazifalarini ko''rmaydi');

select is(
  (select count(*) from public.folders)::int,
  2,
  'A faqat o''zining 2 papkasini ko''radi (Inbox + A papkasi)');

select is(
  (select count(*) from public.tasks)::int,
  1,
  'A faqat o''zining 1 vazifasini ko''radi');

select is(
  (select count(*) from public.profiles)::int,
  1,
  'A faqat o''z profilini ko''radi');

-- Begona user_id bilan yozish taqiqlangan
select throws_ok(
  $$insert into public.folders (user_id, name)
    values ('aaaaaaa2-0000-4000-8000-000000000002', 'Buzg''unchi papka')$$,
  '42501',
  null,
  'A boshqa foydalanuvchi nomidan papka qo''sha olmaydi');

select throws_ok(
  $$insert into public.tasks (user_id, folder_id, title)
    values ('aaaaaaa2-0000-4000-8000-000000000002',
            'aaaaaaa2-1000-4000-8000-000000000002', 'Buzg''unchi vazifa')$$,
  '42501',
  null,
  'A boshqa foydalanuvchi nomidan vazifa qo''sha olmaydi');

-- B ning qatorlarini o'zgartirish/o'chirish — 0 qator tegadi
update public.tasks set title = 'O''zgardi'
 where id = 'aaaaaaa2-2000-4000-8000-000000000002';
select is(
  (select count(*) from public.tasks)::int, 1,
  'B ning vazifasini UPDATE qilish hech narsani o''zgartirmaydi');

delete from public.folders where id = 'aaaaaaa2-1000-4000-8000-000000000002';
select ok(true, 'B ning papkasini DELETE qilish xato bermaydi (lekin 0 qator)');

-- RPC ham RLS ga bo'ysunadi
select throws_ok(
  $$select public.start_task('aaaaaaa2-2000-4000-8000-000000000002')$$,
  'P0002',
  'Vazifa topilmadi',
  'start_task boshqa foydalanuvchi vazifasini ko''rmaydi');

reset role;

-- B ning ma'lumotlari buzilmaganini tekshiramiz (RLS dan tashqarida)
select is(
  (select title from public.tasks where id = 'aaaaaaa2-2000-4000-8000-000000000002'),
  'B ning vazifasi',
  'B ning vazifasi o''zgarmagan');

select is(
  (select count(*) from public.folders
    where id = 'aaaaaaa2-1000-4000-8000-000000000002')::int,
  1,
  'B ning papkasi o''chirilmagan');

-- -------------------------------------------------------------
-- anon roli
-- -------------------------------------------------------------
set local role anon;
select throws_ok(
  $$select count(*) from public.tasks$$,
  '42501',
  null,
  'anon roli vazifalar jadvaliga umuman kira olmaydi');
reset role;

select * from finish();
rollback;
