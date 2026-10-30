-- =============================================================
-- Test 03 — Vazifa RPC funksiyalari, subtasklar va cascade
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(28);

-- -------------------------------------------------------------
-- Tayyorgarlik
-- -------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'ccccccc1-0000-4000-8000-000000000001',
        'authenticated', 'authenticated', 'tasks@test.local', '', now(), now());

insert into public.folders (id, user_id, name) values
  ('ccccccc1-1000-4000-8000-000000000001', 'ccccccc1-0000-4000-8000-000000000001', 'Loyiha'),
  ('ccccccc1-1000-4000-8000-000000000002', 'ccccccc1-0000-4000-8000-000000000001', 'Arxivga');

insert into public.sections (id, user_id, folder_id, name) values
  ('ccccccc1-3000-4000-8000-000000000001', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000001', 'Birinchi bo''lim');

insert into public.tasks (id, user_id, folder_id, section_id, title, due_date) values
  -- oddiy vazifa
  ('ccccccc1-2000-4000-8000-000000000001', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000001', 'ccccccc1-3000-4000-8000-000000000001',
   'Oddiy vazifa', current_date);

insert into public.tasks (id, user_id, folder_id, title, due_date, recurrence) values
  -- takrorlanuvchi (kunlik), kechikkan
  ('ccccccc1-2000-4000-8000-000000000002', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000001', 'Kunlik vazifa', current_date - 3, 'daily'),
  -- subtasklari bo'ladigan ota-vazifa
  ('ccccccc1-2000-4000-8000-000000000003', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000001', 'Ota-vazifa', current_date + 1, null);

insert into public.tasks (id, user_id, folder_id, parent_id, title) values
  ('ccccccc1-2000-4000-8000-000000000004', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000002', 'ccccccc1-2000-4000-8000-000000000003', 'Subtask 1'),
  ('ccccccc1-2000-4000-8000-000000000005', 'ccccccc1-0000-4000-8000-000000000001',
   'ccccccc1-1000-4000-8000-000000000002', 'ccccccc1-2000-4000-8000-000000000003', 'Subtask 2');

-- -------------------------------------------------------------
-- Subtask qoidalari
-- -------------------------------------------------------------
select is(
  (select folder_id from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000004'),
  'ccccccc1-1000-4000-8000-000000000001'::uuid,
  'Subtask boshqa papka berilsa ham ota-vazifa papkasiga tushadi');

select throws_ok(
  $$insert into public.tasks (user_id, folder_id, parent_id, title)
    values ('ccccccc1-0000-4000-8000-000000000001',
            'ccccccc1-1000-4000-8000-000000000001',
            'ccccccc1-2000-4000-8000-000000000004', 'Ikkinchi daraja')$$,
  'P0001',
  null,
  'Subtask faqat 1 daraja — 2-daraja taqiqlangan');

-- Ota-vazifani ko'chirsak, subtasklar ham ko'chadi
update public.tasks
   set folder_id = 'ccccccc1-1000-4000-8000-000000000002',
       section_id = null
 where id = 'ccccccc1-2000-4000-8000-000000000003';

select is(
  (select count(*) from public.tasks
    where parent_id = 'ccccccc1-2000-4000-8000-000000000003'
      and folder_id = 'ccccccc1-1000-4000-8000-000000000002')::int,
  2, 'Ota-vazifa ko''chirilsa subtasklar ham ko''chadi');

update public.tasks
   set folder_id = 'ccccccc1-1000-4000-8000-000000000001',
       section_id = 'ccccccc1-3000-4000-8000-000000000001'
 where id = 'ccccccc1-2000-4000-8000-000000000003';

select is(
  (select count(*) from public.tasks
    where parent_id = 'ccccccc1-2000-4000-8000-000000000003'
      and section_id = 'ccccccc1-3000-4000-8000-000000000001')::int,
  2, 'Subtasklar ota-vazifa bo''limiga ham ergashadi');

-- -------------------------------------------------------------
-- RPC: start_task / move_back / complete_task / uncomplete_task
-- -------------------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ccccccc1-0000-4000-8000-000000000001","role":"authenticated"}',
  true);

select is(
  (select status from public.start_task('ccccccc1-2000-4000-8000-000000000001')),
  'in_progress', 'start_task: planned -> in_progress');

select isnt(
  (select started_at from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000001'),
  null::timestamptz, 'start_task: started_at avtomatik to''ldi');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000001' and event = 'started')::int,
  1, 'start_task: ''started'' hodisasi yozildi');

select throws_ok(
  $$select public.start_task('ccccccc1-2000-4000-8000-000000000001')$$,
  'P0001', null, 'start_task: in_progress vazifani qayta boshlash xato');

select is(
  (select status from public.move_back('ccccccc1-2000-4000-8000-000000000001')),
  'planned', 'move_back: in_progress -> planned');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000001' and event = 'moved_back')::int,
  1, 'move_back: ''moved_back'' hodisasi yozildi');

select is(
  (select status from public.complete_task('ccccccc1-2000-4000-8000-000000000001', false)),
  'done', 'complete_task: -> done');

select isnt(
  (select completed_at from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000001'),
  null::timestamptz, 'complete_task: completed_at avtomatik to''ldi');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000001' and event = 'completed')::int,
  1, 'complete_task: ''completed'' hodisasi yozildi');

select is(
  (select status from public.uncomplete_task('ccccccc1-2000-4000-8000-000000000001')),
  'planned', 'uncomplete_task: done -> planned');

select is(
  (select completed_at from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000001'),
  null::timestamptz, 'uncomplete_task: completed_at tozalandi');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000001' and event = 'uncompleted')::int,
  1, 'uncomplete_task: ''uncompleted'' hodisasi yozildi');

-- -------------------------------------------------------------
-- include_subtasks
-- -------------------------------------------------------------
select is(
  (select status from public.complete_task('ccccccc1-2000-4000-8000-000000000003', true)),
  'done', 'complete_task(include_subtasks): ota-vazifa done');

select is(
  (select count(*) from public.tasks
    where parent_id = 'ccccccc1-2000-4000-8000-000000000003' and status = 'done')::int,
  2, 'complete_task(include_subtasks): ochiq subtasklar ham done');

-- -------------------------------------------------------------
-- Takrorlanuvchi vazifa
-- -------------------------------------------------------------
select is(
  (select status from public.complete_task('ccccccc1-2000-4000-8000-000000000002', false)),
  'planned', 'Takrorlanuvchi vazifa bajarilgach ''planned'' ga qaytadi');

select ok(
  (select due_date from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000002')
    > (now() at time zone 'Asia/Tashkent')::date,
  'Takrorlanuvchi vazifaning due_date i bugundan keyinga surildi');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000002' and event = 'completed')::int,
  1, 'Takrorlanuvchi vazifa uchun ''completed'' hodisasi yozildi');

select is(
  (select count(*) from public.task_events
    where task_id = 'ccccccc1-2000-4000-8000-000000000002' and event = 'uncompleted')::int,
  0, 'Takrorlanuvchi vazifani surish ''uncompleted'' hodisasi yozmaydi');

select is(
  (select completed_at from public.tasks where id = 'ccccccc1-2000-4000-8000-000000000002'),
  null::timestamptz, 'Yangi takrorlanish uchun completed_at bo''sh');

reset role;

-- -------------------------------------------------------------
-- next_occurrence
-- -------------------------------------------------------------
select is(
  public.next_occurrence('2026-03-13', 'weekdays', '2026-03-13'),
  '2026-03-16'::date,
  'next_occurrence: juma -> dushanba (dam olish kuni o''tkazib yuboriladi)');

select is(
  public.next_occurrence('2026-01-31', 'monthly', '2026-01-31'),
  '2026-02-28'::date,
  'next_occurrence: 31-yanvardan keyin 28-fevral');

select is(
  public.next_occurrence('2026-03-01', 'daily', '2026-03-20'),
  '2026-03-21'::date,
  'next_occurrence: o''tgan sana kelajakka sakraydi');

-- -------------------------------------------------------------
-- Cascade
-- -------------------------------------------------------------
delete from public.sections where id = 'ccccccc1-3000-4000-8000-000000000001';
select is(
  (select count(*) from public.tasks
    where id in ('ccccccc1-2000-4000-8000-000000000001',
                 'ccccccc1-2000-4000-8000-000000000003',
                 'ccccccc1-2000-4000-8000-000000000004'))::int,
  0, 'Bo''lim o''chirilsa undagi vazifalar va subtasklar ham o''chadi');

delete from public.folders where id = 'ccccccc1-1000-4000-8000-000000000001';
select is(
  (select count(*) from public.tasks
    where folder_id = 'ccccccc1-1000-4000-8000-000000000001')::int,
  0, 'Papka o''chirilsa vazifalari ham o''chadi');

select * from finish();
rollback;
