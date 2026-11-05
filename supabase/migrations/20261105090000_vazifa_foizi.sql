-- =============================================================
-- Samara — vazifa bajarilish foizi va uning kunlik tarixi
-- =============================================================
-- Ba'zi vazifalar bir kunda tugamaydi. Foydalanuvchi bugun ishning
-- 50% ini qilib, qolganini ertaga qoldirishi mumkin. Shunda:
--   * vazifaning joriy holati   -> tasks.progress
--   * "bugun qancha ish qilindi" -> task_progress_log (o'zgarmas tarix)
-- Vazifa ertangi kunga ko'chirilsa ham, bugungi 50% jurnalda qoladi.

-- -------------------------------------------------------------
-- 1. Joriy foiz (avval ustun, keyin to'ldirish, keyin cheklovlar —
--    aks holda mavjud "done" qatorlar cheklovni buzardi)
-- -------------------------------------------------------------
alter table public.tasks
  add column progress smallint not null default 0;

comment on column public.tasks.progress is
  'Bajarilish foizi: 0, 10, 20 ... 100. 100 bo''lsa vazifa "done" holatiga o''tadi.';

update public.tasks set progress = 100 where status = 'done';

alter table public.tasks
  add constraint tasks_progress_chk
  check (progress between 0 and 100 and progress % 10 = 0);

-- Bajarilgan vazifa doim 100%
alter table public.tasks
  add constraint tasks_done_is_full_chk
  check (status <> 'done' or progress = 100);

-- -------------------------------------------------------------
-- 2. O'zgarishlar jurnali — faqat qo'shiladi, hech qachon o'chmaydi
-- -------------------------------------------------------------
create table public.task_progress_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  task_id    uuid        not null references public.tasks (id) on delete cascade,
  oldingi    smallint    not null,
  yangi      smallint    not null,
  created_at timestamptz not null default now(),

  constraint tpl_oldingi_chk  check (oldingi between 0 and 100),
  constraint tpl_yangi_chk    check (yangi   between 0 and 100),
  constraint tpl_ozgarish_chk check (oldingi <> yangi)
);

comment on table public.task_progress_log is
  'Vazifa foizi har o''zgarganda bitta qator. Hisobotda "qaysi kuni qancha ish qilindi" shundan hisoblanadi.';

-- Hisobot doim "foydalanuvchi + davr" kesimida so'raydi
create index task_progress_log_user_vaqt_idx
  on public.task_progress_log (user_id, created_at desc);

create index task_progress_log_task_idx
  on public.task_progress_log (task_id);

-- -------------------------------------------------------------
-- 3. RLS — boshqa jadvallar bilan bir xil qoida
-- -------------------------------------------------------------
alter table public.task_progress_log enable row level security;

create policy task_progress_log_select_own
  on public.task_progress_log for select
  using (user_id = (select auth.uid()));

create policy task_progress_log_insert_own
  on public.task_progress_log for insert
  with check (user_id = (select auth.uid()));

-- Tarix o'zgarmas: update/delete siyosati ataylab berilmagan.

-- -------------------------------------------------------------
-- 4. Foiz va holatni bir-biriga moslovchi trigger
-- -------------------------------------------------------------
-- MUHIM: triggerlar nom bo'yicha alifbo tartibida ishlaydi, shuning
-- uchun "tasks_progress_sync" < "tasks_touch_timestamps". Ya'ni biz
-- bu yerda faqat status/progress ni moslashtiramiz, completed_at ni
-- esa o'z egasi — touch_timestamps — keyin to'g'ri yozadi.
create or replace function public.tg_tasks_progress_sync()
returns trigger
language plpgsql
as $$
begin
  -- 100% belgilansa — vazifa bajarilgan hisoblanadi
  if new.progress = 100 and new.status <> 'done' then
    new.status := 'done';
  end if;

  -- Bajarilgan deb belgilansa — foiz to'liq bo'ladi
  if new.status = 'done' and new.progress <> 100 then
    new.progress := 100;
  end if;

  -- Bajarilgandan qaytarilsa — doira to'la suvli ko'rinib qolmasligi
  -- uchun foiz nolga tushadi (tarix jurnalda saqlanib qoladi)
  if tg_op = 'UPDATE'
     and old.status = 'done'
     and new.status <> 'done'
     and new.progress = 100 then
    new.progress := 0;
  end if;

  return new;
end;
$$;

create trigger tasks_progress_sync
  before insert or update on public.tasks
  for each row execute function public.tg_tasks_progress_sync();

-- -------------------------------------------------------------
-- 5. Jurnalga yozuvchi trigger
-- -------------------------------------------------------------
create or replace function public.tg_tasks_log_progress()
returns trigger
language plpgsql
as $$
begin
  if new.progress is distinct from old.progress then
    insert into public.task_progress_log (user_id, task_id, oldingi, yangi)
    values (new.user_id, new.id, old.progress, new.progress);
  end if;
  return null;
end;
$$;

create trigger tasks_log_progress
  after update on public.tasks
  for each row execute function public.tg_tasks_log_progress();
