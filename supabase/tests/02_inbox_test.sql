-- =============================================================
-- Test 02 — Yangi foydalanuvchi va Inbox himoyasi
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(12);

-- -------------------------------------------------------------
-- Yangi foydalanuvchi ro'yxatdan o'tadi
-- -------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  'bbbbbbb1-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'inbox@test.local', '',
  '{"full_name":"Inbox Test","avatar_url":"https://example.com/a.png"}'::jsonb,
  now(), now()
);

select is(
  (select count(*) from public.profiles
    where id = 'bbbbbbb1-0000-4000-8000-000000000001')::int,
  1, 'profiles qatori avtomatik yaratildi');

select is(
  (select full_name from public.profiles
    where id = 'bbbbbbb1-0000-4000-8000-000000000001'),
  'Inbox Test', 'full_name Google metadatasidan olindi');

select is(
  (select timezone from public.profiles
    where id = 'bbbbbbb1-0000-4000-8000-000000000001'),
  'Asia/Tashkent', 'timezone default qiymati Asia/Tashkent');

select is(
  (select count(*) from public.folders
    where user_id = 'bbbbbbb1-0000-4000-8000-000000000001')::int,
  1, 'aynan bitta papka yaratildi (boshqa papka yo''q)');

select is(
  (select name from public.folders
    where user_id = 'bbbbbbb1-0000-4000-8000-000000000001'),
  'Kiruvchi', 'yaratilgan papka nomi — Kiruvchi');

select ok(
  (select is_inbox from public.folders
    where user_id = 'bbbbbbb1-0000-4000-8000-000000000001'),
  'yaratilgan papka is_inbox = true');

-- -------------------------------------------------------------
-- Inbox himoyasi
-- -------------------------------------------------------------
select throws_ok(
  $$delete from public.folders
     where user_id = 'bbbbbbb1-0000-4000-8000-000000000001' and is_inbox$$,
  'P0001',
  'Kiruvchi (Inbox) papkani o''chirish mumkin emas',
  'Inbox papkani o''chirish taqiqlangan');

select throws_ok(
  $$update public.folders set is_archived = true
     where user_id = 'bbbbbbb1-0000-4000-8000-000000000001' and is_inbox$$,
  'P0001',
  'Kiruvchi (Inbox) papkani arxivlash mumkin emas',
  'Inbox papkani arxivlash taqiqlangan');

select throws_ok(
  $$update public.folders set is_inbox = false
     where user_id = 'bbbbbbb1-0000-4000-8000-000000000001' and is_inbox$$,
  'P0001',
  'is_inbox belgisini o''zgartirish mumkin emas',
  'is_inbox belgisini olib tashlash taqiqlangan');

-- Ikkinchi Inbox bo'lishi mumkin emas
select throws_ok(
  $$insert into public.folders (user_id, name, is_inbox)
    values ('bbbbbbb1-0000-4000-8000-000000000001', 'Ikkinchi inbox', true)$$,
  '23505',
  null,
  'Bir foydalanuvchida ikkita Inbox bo''lishi mumkin emas');

-- Oddiy papkani o'chirish mumkin
insert into public.folders (id, user_id, name)
values ('bbbbbbb1-1000-4000-8000-000000000001',
        'bbbbbbb1-0000-4000-8000-000000000001', 'Oddiy papka');
select lives_ok(
  $$delete from public.folders where id = 'bbbbbbb1-1000-4000-8000-000000000001'$$,
  'Oddiy (Inbox bo''lmagan) papkani o''chirish mumkin');

-- Akkauntni o'chirish Inbox himoyasiga urilmasligi kerak
select lives_ok(
  $$delete from auth.users where id = 'bbbbbbb1-0000-4000-8000-000000000001'$$,
  'Foydalanuvchini o''chirganda Inbox cascade orqali o''chadi');

select * from finish();
rollback;
