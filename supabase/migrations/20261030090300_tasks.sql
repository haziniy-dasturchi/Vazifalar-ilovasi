-- =============================================================
-- Vazifalar — 04. tasks (vazifalar va subtasklar)
-- =============================================================

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  folder_id    uuid        not null,
  section_id   uuid,
  parent_id    uuid,
  title        text        not null,
  description  text,
  status       text        not null default 'planned',
  -- 1 = eng muhim, 4 = eng past (default)
  priority     smallint    not null default 4,
  due_date     date,
  due_time     time,
  deadline     date,
  recurrence   text,
  sort_order   integer     not null default 0,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint tasks_title_chk
    check (char_length(btrim(title)) between 1 and 500),
  constraint tasks_status_chk
    check (status in ('planned', 'in_progress', 'done')),
  constraint tasks_priority_chk
    check (priority between 1 and 4),
  constraint tasks_recurrence_chk
    check (recurrence is null or recurrence in ('daily', 'weekdays', 'weekly', 'monthly')),
  constraint tasks_not_self_parent_chk
    check (parent_id is null or parent_id <> id),
  -- Vaqt belgisi faqat sana bilan ma'noga ega
  constraint tasks_due_time_needs_date_chk
    check (due_time is null or due_date is not null),
  -- done holatida completed_at to'lgan bo'lishi shart va aksincha
  constraint tasks_done_has_completed_at_chk
    check ((status = 'done') = (completed_at is not null)),

  -- Papka o'chsa — vazifalar ham o'chadi (egalik ham tekshiriladi)
  constraint tasks_folder_fk
    foreign key (folder_id, user_id)
    references public.folders (id, user_id) on delete cascade,
  -- Bo'lim o'chsa — undagi vazifalar o'chadi; bo'lim doim vazifa papkasida
  constraint tasks_section_fk
    foreign key (section_id, folder_id)
    references public.sections (id, folder_id) on delete cascade,
  -- Ota-vazifa o'chsa — subtasklar ham o'chadi
  constraint tasks_parent_fk
    foreign key (parent_id, user_id)
    references public.tasks (id, user_id) on delete cascade,

  -- Bola jadvallar uchun kompozit FK
  constraint tasks_id_user_uniq unique (id, user_id)
);

comment on table  public.tasks is 'Vazifalar. parent_id to''lgan qator — subtask (faqat 1 daraja).';
comment on column public.tasks.priority is '1 = eng muhim ... 4 = eng past (default).';
comment on column public.tasks.deadline is 'Qat''iy muddat (sana). due_date rejalashtirilgan kun, deadline — kechiktirilmas chegara.';
comment on column public.tasks.recurrence is 'daily | weekdays (du-ju) | weekly | monthly | null.';

grant select, insert, update, delete on public.tasks to authenticated;
