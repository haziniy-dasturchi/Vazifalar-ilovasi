-- =============================================================
-- Vazifalar — lokal test ma'lumotlari (supabase db reset bilan ishga tushadi)
-- =============================================================
-- Bitta test foydalanuvchi:
--   id    : 11111111-1111-1111-1111-111111111111
--   email : test@vazifalar.local
--
-- Papkalar:
--   Kiruvchi (Inbox) -> health = attention (oxirgi 7 kunda harakat yo'q)
--   Ish              -> health = good
--   O'qish           -> health = behind (ochiq vazifalar bor, 0 ta bajarilgan)
--
-- Barcha sanalar current_date ga nisbatan hisoblanadi, shuning uchun
-- get_report(current_date - 13, current_date) har doim ma'lumot qaytaradi.

begin;

-- -------------------------------------------------------------
-- 0. Avvalgi test ma'lumotlarini tozalash
-- -------------------------------------------------------------
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';

-- -------------------------------------------------------------
-- 1. Test foydalanuvchi (trigger profil + Inbox papkani yaratadi)
-- -------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated', 'test@vazifalar.local',
  '', now() - interval '60 days',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"full_name":"Test Foydalanuvchi","avatar_url":"https://example.com/avatar.png"}'::jsonb,
  now() - interval '60 days', now() - interval '60 days'
);

update public.profiles
   set timezone    = 'Asia/Tashkent',
       daily_goal  = 4,
       days_off    = '{0}'::integer[],
       theme       = 'system',
       created_at  = now() - interval '60 days'
 where id = '11111111-1111-1111-1111-111111111111';

-- Inbox papkani "eski" qilib qo'yamiz (attention holatini ko'rsatish uchun)
update public.folders
   set created_at = now() - interval '60 days',
       updated_at = now() - interval '60 days'
 where user_id = '11111111-1111-1111-1111-111111111111'
   and is_inbox;

-- -------------------------------------------------------------
-- 2. Papkalar
-- -------------------------------------------------------------
insert into public.folders (id, user_id, name, color, icon, sort_order, created_at, updated_at) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Ish',    '#0ea5e9', 'briefcase', 1, now() - interval '45 days', now() - interval '45 days'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'O''qish', '#f59e0b', 'book',      2, now() - interval '30 days', now() - interval '30 days');

-- -------------------------------------------------------------
-- 3. Bo'limlar
-- -------------------------------------------------------------
insert into public.sections (id, user_id, folder_id, name, sort_order, created_at) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', 'Rejada',    0, now() - interval '45 days'),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', 'Jarayonda', 1, now() - interval '45 days'),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', 'Darslar',   0, now() - interval '30 days'),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', 'Mustaqil',  1, now() - interval '30 days');

-- -------------------------------------------------------------
-- 4. Vazifalar (20 ta)
-- -------------------------------------------------------------
-- Inbox papkasining id si triggerdan kelgani uchun o'zgaruvchiga olamiz
create temporary table _seed_ctx on commit drop as
select f.id as inbox_id
from public.folders f
where f.user_id = '11111111-1111-1111-1111-111111111111'
  and f.is_inbox;

-- 4.1 Kiruvchi (Inbox): 2 ochiq + 1 bajarilgan (10 kun oldin)
insert into public.tasks (
  id, user_id, folder_id, title, description, status, priority,
  due_date, created_at, completed_at
)
select
  v.id, '11111111-1111-1111-1111-111111111111', c.inbox_id,
  v.title, v.description, v.status, v.priority,
  v.due_date, v.created_at, v.completed_at
from _seed_ctx c
cross join (values
  ('44444444-0000-0000-0000-000000000001'::uuid, 'Yangi kitob tanlash',
   'Kitob do''konidan ro''yxat olib kelish', 'planned', 4::smallint,
   null::date, now() - interval '40 days', null::timestamptz),
  ('44444444-0000-0000-0000-000000000002'::uuid, 'Telefon raqamlarni yangilash',
   null, 'planned', 4::smallint,
   null::date, now() - interval '38 days', null::timestamptz),
  ('44444444-0000-0000-0000-000000000003'::uuid, 'Pasport nusxasini skanerlash',
   null, 'done', 3::smallint,
   (current_date - 10), now() - interval '20 days',
   ((current_date - 10)::timestamp + time '11:20') at time zone 'Asia/Tashkent')
) as v(id, title, description, status, priority, due_date, created_at, completed_at);

-- 4.2 Ish papkasi: 11 ta (3 ta subtask bilan, 2 ta takrorlanuvchi)
insert into public.tasks (
  id, user_id, folder_id, section_id, parent_id, title, description,
  status, priority, due_date, due_time, deadline, recurrence,
  sort_order, created_at, completed_at
) values
  -- takrorlanuvchi: har hafta
  ('44444444-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', null,
   'Haftalik hisobotni yuborish', 'Rahbarga elektron pochta orqali',
   'planned', 2, current_date + 2, time '17:00', current_date + 3, 'weekly',
   0, now() - interval '35 days', null),
  -- takrorlanuvchi: har kuni
  ('44444444-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', null,
   'Kunlik ko''rik', 'Kun oxirida 10 daqiqa',
   'planned', 3, current_date, time '20:30', null, 'daily',
   1, now() - interval '30 days', null),
  -- bajarilgan, muddatida
  ('44444444-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', null,
   'Mijoz bilan uchrashuv', null,
   'done', 1, current_date - 1, time '10:00', null, null,
   2, now() - interval '12 days',
   ((current_date - 1)::timestamp + time '10:45') at time zone 'Asia/Tashkent'),
  -- bajarilgan, lekin kechikib (due 3 kun oldin, bajarilgani 2 kun oldin)
  ('44444444-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', null,
   'Shartnomani tekshirish', 'Yuridik bo''lim izohlari bilan',
   'done', 2, current_date - 3, null, current_date - 3, null,
   3, now() - interval '15 days',
   ((current_date - 2)::timestamp + time '14:10') at time zone 'Asia/Tashkent'),
  -- jarayonda, 3 subtask bilan
  ('44444444-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', null,
   'Prezentatsiya tayyorlash', 'Chorak natijalari uchun 12 slayd',
   'in_progress', 1, current_date + 1, null, current_date + 4, null,
   4, now() - interval '9 days', null),
  -- bajarilgan
  ('44444444-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', null,
   'Byudjet jadvalini to''ldirish', null,
   'done', 2, current_date - 5, null, null, null,
   5, now() - interval '18 days',
   ((current_date - 5)::timestamp + time '09:30') at time zone 'Asia/Tashkent'),
  -- bajarilgan
  ('44444444-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', null,
   'Jamoaga fikr-mulohaza yozish', null,
   'done', 3, current_date - 8, null, null, null,
   6, now() - interval '22 days',
   ((current_date - 8)::timestamp + time '16:05') at time zone 'Asia/Tashkent'),
  -- ochiq, kelajakda
  ('44444444-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', null,
   'Ofis jihozlari ro''yxatini yangilash', null,
   'planned', 4, current_date + 5, null, null, null,
   7, now() - interval '4 days', null);

-- Subtasklar (folder_id / section_id triggerda ota-vazifadan olinadi)
insert into public.tasks (
  id, user_id, folder_id, parent_id, title, status, priority,
  due_date, sort_order, created_at, completed_at
) values
  ('44444444-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008',
   'Slaydlar tuzilmasini chizish', 'done', 2,
   current_date - 2, 0, now() - interval '9 days',
   ((current_date - 2)::timestamp + time '11:00') at time zone 'Asia/Tashkent'),
  ('44444444-0000-0000-0000-00000000000d', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008',
   'Matnni yozish', 'in_progress', 2,
   current_date + 1, 1, now() - interval '9 days', null),
  ('44444444-0000-0000-0000-00000000000e', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000008',
   'Rasm va grafikalarni tanlash', 'planned', 3,
   current_date + 1, 2, now() - interval '9 days', null);

-- 4.3 O'qish papkasi: 6 ta (4 tasi kechikkan, 1 tasi takrorlanuvchi)
insert into public.tasks (
  id, user_id, folder_id, section_id, title, description,
  status, priority, due_date, deadline, recurrence, sort_order, created_at
) values
  ('44444444-0000-0000-0000-00000000000f', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003',
   'IELTS Listening mashqi', 'Cambridge 17, Test 2',
   'planned', 2, current_date - 5, null, null, 0, now() - interval '25 days'),
  ('44444444-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003',
   'Grammar unit 4', null,
   'planned', 3, current_date - 12, null, null, 1, now() - interval '25 days'),
  ('44444444-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   'Essay yozish (Task 2)', 'O''qituvchiga tekshirishga berish',
   'planned', 1, null, current_date - 3, null, 2, now() - interval '25 days'),
  ('44444444-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   'Yangi so''zlarni takrorlash', null,
   'planned', 3, current_date + 3, null, null, 3, now() - interval '25 days'),
  ('44444444-0000-0000-0000-000000000013', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000004',
   'Kitob o''qish (30 bet)', 'Ish kunlari',
   'planned', 2, current_date - 2, null, 'weekdays', 4, now() - interval '24 days'),
  ('44444444-0000-0000-0000-000000000014', '11111111-1111-1111-1111-111111111111',
   '22222222-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003',
   'Podkast tinglash', null,
   'planned', 4, null, null, null, 5, now() - interval '20 days');

-- -------------------------------------------------------------
-- 5. Teglar
-- -------------------------------------------------------------
insert into public.labels (id, user_id, name, color, sort_order, created_at) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'shoshilinch', '#ef4444', 0, now() - interval '40 days'),
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'uy', '#22c55e', 1, now() - interval '40 days');

insert into public.task_labels (task_id, label_id, user_id) values
  ('44444444-0000-0000-0000-000000000008', '55555555-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111'),
  ('44444444-0000-0000-0000-000000000011', '55555555-0000-0000-0000-000000000001',
   '11111111-1111-1111-1111-111111111111'),
  ('44444444-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002',
   '11111111-1111-1111-1111-111111111111');

-- -------------------------------------------------------------
-- 6. Hodisalar jurnalini realistik qilish
-- -------------------------------------------------------------
-- 6.1 'created' hodisalarini vazifa yaratilgan vaqtga moslash
update public.task_events e
   set created_at = t.created_at
  from public.tasks t
 where e.task_id = t.id
   and e.event = 'created';

-- 6.2 'started' va 'completed' hodisalarini qo'lda qo'shish
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select t.user_id, t.id, t.folder_id, 'started',
       t.completed_at - interval '90 minutes'
from public.tasks t
where t.user_id = '11111111-1111-1111-1111-111111111111'
  and t.status = 'done';

insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select t.user_id, t.id, t.folder_id, 'completed', t.completed_at
from public.tasks t
where t.user_id = '11111111-1111-1111-1111-111111111111'
  and t.status = 'done';

-- 6.3 Jarayondagi vazifalar uchun 'started'
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select t.user_id, t.id, t.folder_id, 'started',
       ((current_date - 1)::timestamp + time '09:00') at time zone 'Asia/Tashkent'
from public.tasks t
where t.user_id = '11111111-1111-1111-1111-111111111111'
  and t.status = 'in_progress';

-- 6.4 Takrorlanuvchi vazifaning o'tgan bajarilishlari (Ish papkasi — "Kunlik ko'rik")
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select '11111111-1111-1111-1111-111111111111',
       '44444444-0000-0000-0000-000000000005',
       '22222222-0000-0000-0000-000000000001',
       'completed',
       ((current_date - g)::timestamp + time '20:40') at time zone 'Asia/Tashkent'
from generate_series(1, 6) g;

-- 6.5 Oldingi davr (completed_prev ni ko'rsatish uchun): 14..27 kun oldin
insert into public.task_events (user_id, task_id, folder_id, event, created_at)
select '11111111-1111-1111-1111-111111111111',
       '44444444-0000-0000-0000-000000000005',
       '22222222-0000-0000-0000-000000000001',
       'completed',
       ((current_date - g)::timestamp + time '20:40') at time zone 'Asia/Tashkent'
from generate_series(15, 22) g;

-- -------------------------------------------------------------
-- 7. Pomodoro sessiyalari
-- -------------------------------------------------------------
insert into public.pomodoro_sessions
  (user_id, task_id, kind, planned_minutes, started_at, ended_at, completed)
values
  -- Prezentatsiya (Ish): 3 ta tugallangan fokus
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000008',
   'focus', 25,
   ((current_date - 1)::timestamp + time '09:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '09:25') at time zone 'Asia/Tashkent', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000008',
   'short_break', 5,
   ((current_date - 1)::timestamp + time '09:25') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '09:30') at time zone 'Asia/Tashkent', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000008',
   'focus', 25,
   ((current_date - 1)::timestamp + time '09:30') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '09:55') at time zone 'Asia/Tashkent', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-00000000000c',
   'focus', 25,
   ((current_date - 2)::timestamp + time '10:30') at time zone 'Asia/Tashkent',
   ((current_date - 2)::timestamp + time '10:55') at time zone 'Asia/Tashkent', true),
  -- Mijoz bilan uchrashuv (Ish)
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000006',
   'focus', 25,
   ((current_date - 1)::timestamp + time '11:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '11:25') at time zone 'Asia/Tashkent', true),
  -- Yarmida to'xtatilgan fokus — hisobotga kirmaydi
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-00000000000f',
   'focus', 25,
   ((current_date - 3)::timestamp + time '19:00') at time zone 'Asia/Tashkent',
   ((current_date - 3)::timestamp + time '19:08') at time zone 'Asia/Tashkent', false),
  -- Uzun tanaffus
  ('11111111-1111-1111-1111-111111111111', null,
   'long_break', 15,
   ((current_date - 1)::timestamp + time '12:00') at time zone 'Asia/Tashkent',
   ((current_date - 1)::timestamp + time '12:15') at time zone 'Asia/Tashkent', true),
  -- Bugungi fokus
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-00000000000d',
   'focus', 25,
   now() - interval '3 hours',
   now() - interval '2 hours 35 minutes', true);

commit;
