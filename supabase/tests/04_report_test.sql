-- =============================================================
-- Test 04 — get_report va folder_health
-- =============================================================
begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

-- -------------------------------------------------------------
-- Tayyorgarlik: 3 xil holatdagi papka
--   Yaxshi  -> good       (bajarilgan ish bor, kechikkan yo'q)
--   Diqqat  -> attention  (oxirgi harakat 10 kun oldin)
--   Orqada  -> behind     (ochiq vazifa bor, 0 ta bajarilgan)
-- -------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', 'ddddddd1-0000-4000-8000-000000000001',
        'authenticated', 'authenticated', 'report@test.local', '',
        now() - interval '60 days', now());

insert into public.folders (id, user_id, name, color, sort_order, created_at) values
  ('ddddddd1-1000-4000-8000-000000000001', 'ddddddd1-0000-4000-8000-000000000001',
   'Yaxshi', '#10b981', 1, now() - interval '40 days'),
  ('ddddddd1-1000-4000-8000-000000000002', 'ddddddd1-0000-4000-8000-000000000001',
   'Diqqat', '#f59e0b', 2, now() - interval '40 days'),
  ('ddddddd1-1000-4000-8000-000000000003', 'ddddddd1-0000-4000-8000-000000000001',
   'Orqada', '#ef4444', 3, now() - interval '40 days');

-- Yaxshi: 3 bajarilgan + 2 ochiq (kelajakdagi muddat)
insert into public.tasks (id, user_id, folder_id, title, status, due_date, completed_at) values
  ('ddddddd1-2000-4000-8000-000000000001', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000001', 'Muddatida bajarilgan 1', 'done',
   current_date - 3, ((current_date - 3)::timestamp + time '12:00') at time zone 'Asia/Tashkent'),
  ('ddddddd1-2000-4000-8000-000000000002', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000001', 'Muddatida bajarilgan 2', 'done',
   current_date - 5, ((current_date - 5)::timestamp + time '12:00') at time zone 'Asia/Tashkent'),
  ('ddddddd1-2000-4000-8000-000000000003', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000001', 'Kechikib bajarilgan', 'done',
   current_date - 8, ((current_date - 6)::timestamp + time '12:00') at time zone 'Asia/Tashkent');

insert into public.tasks (id, user_id, folder_id, title, status, due_date) values
  ('ddddddd1-2000-4000-8000-000000000004', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000001', 'Ochiq 1', 'planned', current_date + 2),
  ('ddddddd1-2000-4000-8000-000000000005', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000001', 'Ochiq 2', 'planned', current_date + 5);

-- Diqqat: 1 bajarilgan (10 kun oldin) + 1 ochiq (muddatsiz)
insert into public.tasks (id, user_id, folder_id, title, status, due_date, completed_at) values
  ('ddddddd1-2000-4000-8000-000000000006', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000002', 'Eski bajarilgan', 'done',
   current_date - 10, ((current_date - 10)::timestamp + time '12:00') at time zone 'Asia/Tashkent');

insert into public.tasks (id, user_id, folder_id, title, status) values
  ('ddddddd1-2000-4000-8000-000000000007', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000002', 'Muddatsiz ochiq', 'planned');

-- Orqada: 4 ochiq, 2 tasi kechikkan
insert into public.tasks (id, user_id, folder_id, title, status, due_date, deadline) values
  ('ddddddd1-2000-4000-8000-000000000008', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000003', 'Kechikkan 1', 'planned', current_date - 4, null),
  ('ddddddd1-2000-4000-8000-000000000009', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000003', 'Kechikkan 2', 'planned', null, current_date - 1),
  ('ddddddd1-2000-4000-8000-00000000000a', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000003', 'Hali vaqti bor', 'planned', current_date + 7, null),
  ('ddddddd1-2000-4000-8000-00000000000b', 'ddddddd1-0000-4000-8000-000000000001',
   'ddddddd1-1000-4000-8000-000000000003', 'Muddatsiz', 'in_progress', null, null);

-- -------------------------------------------------------------
-- Hodisalar jurnali
-- -------------------------------------------------------------
-- Bajarilgan vazifalar uchun 'completed' hodisalari
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select t.user_id, t.id, t.folder_id, 'completed', t.completed_at
from public.tasks t
where t.user_id = 'ddddddd1-0000-4000-8000-000000000001'
  and t.status = 'done';

-- Oldingi davrda (20 kun oldin) bitta bajarilish — completed_prev uchun
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
values ('ddddddd1-0000-4000-8000-000000000001',
        'ddddddd1-2000-4000-8000-000000000001',
        'ddddddd1-1000-4000-8000-000000000001',
        'completed',
        ((current_date - 20)::timestamp + time '12:00') at time zone 'Asia/Tashkent');

-- "Diqqat" papkasidagi barcha hodisalarni 10 kun oldinga surib qo'yamiz
update public.task_events
   set created_at = ((current_date - 10)::timestamp + time '12:00') at time zone 'Asia/Tashkent'
 where user_id = 'ddddddd1-0000-4000-8000-000000000001'
   and folder_id = 'ddddddd1-1000-4000-8000-000000000002';

-- -------------------------------------------------------------
-- Pomodoro: 2 ta tugallangan fokus (25 + 25 = 50 daqiqa)
-- -------------------------------------------------------------
insert into public.pomodoro_sessions
  (user_id, task_id, kind, planned_minutes, started_at, ended_at, completed)
values
  ('ddddddd1-0000-4000-8000-000000000001', 'ddddddd1-2000-4000-8000-000000000004',
   'focus', 25,
   ((current_date - 1)::timestamp + time '09:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '09:25') at time zone 'Asia/Tashkent', true),
  ('ddddddd1-0000-4000-8000-000000000001', 'ddddddd1-2000-4000-8000-000000000004',
   'focus', 25,
   ((current_date - 1)::timestamp + time '10:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '10:25') at time zone 'Asia/Tashkent', true),
  -- yarmida to'xtatilgan — hisobga olinmaydi
  ('ddddddd1-0000-4000-8000-000000000001', 'ddddddd1-2000-4000-8000-000000000004',
   'focus', 25,
   ((current_date - 1)::timestamp + time '11:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '11:07') at time zone 'Asia/Tashkent', false),
  -- tanaffus — fokus daqiqalariga kirmaydi
  ('ddddddd1-0000-4000-8000-000000000001', 'ddddddd1-2000-4000-8000-000000000004',
   'short_break', 5,
   ((current_date - 1)::timestamp + time '09:25') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '09:30') at time zone 'Asia/Tashkent', true);

-- -------------------------------------------------------------
-- Hisobotni foydalanuvchi nomidan olamiz
-- -------------------------------------------------------------
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"ddddddd1-0000-4000-8000-000000000001","role":"authenticated"}',
  true);

create temporary table _rep as
select public.get_report(current_date - 13, current_date) as r;

-- summary
select is(
  (select (r -> 'summary' ->> 'completed')::int from _rep),
  4, 'summary.completed = 4 (Yaxshi 3 + Diqqat 1)');

select is(
  (select (r -> 'summary' ->> 'completed_prev')::int from _rep),
  1, 'summary.completed_prev = 1 (oldingi 14 kunlik davr)');

select is(
  (select (r -> 'summary' ->> 'focus_minutes')::int from _rep),
  50, 'summary.focus_minutes = 50 (faqat tugallangan fokus sessiyalari)');

select is(
  (select (r -> 'summary' ->> 'on_time_rate')::numeric from _rep),
  75.0::numeric, 'summary.on_time_rate = 75.0 (4 tadan 3 tasi muddatida)');

select is(
  (select (r -> 'summary' ->> 'overdue_open')::int from _rep),
  2, 'summary.overdue_open = 2');

-- by_day
select is(
  (select jsonb_array_length(r -> 'by_day') from _rep),
  14, 'by_day 14 kunni qaytaradi (bo''sh kunlar ham)');

select is(
  (select sum((d ->> 'completed')::int)::int
     from _rep, jsonb_array_elements(r -> 'by_day') d),
  4, 'by_day yig''indisi summary.completed ga teng');

select is(
  (select (d ->> 'date') from _rep, jsonb_array_elements(r -> 'by_day') d limit 1),
  (current_date - 13)::text, 'by_day birinchi kuni p_from ga teng');

-- by_folder
select is(
  (select jsonb_array_length(r -> 'by_folder') from _rep),
  4, 'by_folder 4 papkani qaytaradi (Inbox + 3 ta)');

create temporary table _folders as
select f ->> 'name'             as name,
       f ->> 'health'           as health,
       f ->> 'reason'           as reason,
       (f ->> 'completed')::int as completed,
       (f ->> 'open')::int      as open_cnt,
       (f ->> 'overdue')::int   as overdue,
       (f ->> 'focus_minutes')::int as focus_minutes,
       f ->> 'last_activity_at' as last_activity_at,
       f ->> 'color'            as color
from _rep, jsonb_array_elements(r -> 'by_folder') f;

select is(
  (select health from _folders where name = 'Yaxshi'),
  'good', 'Yaxshi papkasi health = good');

select is(
  (select completed from _folders where name = 'Yaxshi'),
  3, 'Yaxshi papkasida 3 ta bajarilgan');

select is(
  (select open_cnt from _folders where name = 'Yaxshi'),
  2, 'Yaxshi papkasida 2 ta ochiq vazifa');

select is(
  (select focus_minutes from _folders where name = 'Yaxshi'),
  50, 'Yaxshi papkasida 50 daqiqa fokus');

select is(
  (select color from _folders where name = 'Yaxshi'),
  '#10b981', 'by_folder papka rangini qaytaradi');

select is(
  (select health from _folders where name = 'Diqqat'),
  'attention', 'Diqqat papkasi health = attention');

select is(
  (select reason from _folders where name = 'Diqqat'),
  'Oxirgi 7 kunda hech qanday harakat bo''lmagan',
  'Diqqat papkasining sababi — 7 kunlik jimlik');

select is(
  (select health from _folders where name = 'Orqada'),
  'behind', 'Orqada papkasi health = behind');

select is(
  (select reason from _folders where name = 'Orqada'),
  'Bu davrda 0 ta vazifa bajarilmagan',
  'Orqada papkasining sababi — 0 ta bajarilgan');

select is(
  (select overdue from _folders where name = 'Orqada'),
  2, 'Orqada papkasida 2 ta kechikkan vazifa');

select isnt(
  (select last_activity_at from _folders where name = 'Yaxshi'),
  null::text, 'last_activity_at to''ldirilgan');

-- Noto'g'ri davr
select throws_ok(
  $$select public.get_report(current_date, current_date - 5)$$,
  '22023', null, 'p_to < p_from bo''lsa xato qaytadi');

reset role;

-- -------------------------------------------------------------
-- folder_health qoidalarining chegaralari
-- -------------------------------------------------------------
select is(
  (select public.folder_health(10, 3, 4, now()) ->> 'health'),
  'behind', 'folder_health: kechikkanlar 30% dan ko''p -> behind');

select * from finish();
rollback;
