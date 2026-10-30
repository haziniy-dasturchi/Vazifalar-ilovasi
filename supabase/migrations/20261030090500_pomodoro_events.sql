-- =============================================================
-- Vazifalar — 06. pomodoro_sessions va task_events
-- =============================================================

create table public.pomodoro_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users (id) on delete cascade,
  task_id         uuid,
  kind            text        not null,
  planned_minutes smallint    not null,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  completed       boolean     not null default false,

  constraint pomodoro_kind_chk
    check (kind in ('focus', 'short_break', 'long_break')),
  constraint pomodoro_planned_chk
    check (planned_minutes between 1 and 240),
  constraint pomodoro_period_chk
    check (ended_at is null or ended_at >= started_at),
  constraint pomodoro_completed_needs_end_chk
    check (not completed or ended_at is not null),
  -- Vazifa o'chsa sessiya tarixi saqlanadi, faqat bog'lanish uziladi
  constraint pomodoro_task_fk
    foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete set null (task_id)
);

comment on table  public.pomodoro_sessions is 'Pomodoro sessiyalari (fokus va tanaffuslar).';
comment on column public.pomodoro_sessions.completed is 'Sessiya oxirigacha yetkazildimi (yarmida to''xtatilmadimi).';

-- -------------------------------------------------------------

create table public.task_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  task_id    uuid,
  folder_id  uuid,
  event      text        not null,
  created_at timestamptz not null default now(),

  constraint task_events_event_chk
    check (event in ('created', 'started', 'moved_back', 'completed', 'uncompleted')),
  -- Hisobot tarixi vazifa/papka o'chgandan keyin ham qolsin
  constraint task_events_task_fk
    foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete set null (task_id),
  constraint task_events_folder_fk
    foreign key (folder_id, user_id)
    references public.folders (id, user_id) on delete set null (folder_id)
);

comment on table public.task_events is
  'Hisobotlar uchun hodisalar jurnali. Vazifa yoki papka o''chsa yozuv saqlanadi (FK null bo''ladi).';

grant select, insert, update, delete on public.pomodoro_sessions to authenticated;
grant select, insert, update, delete on public.task_events       to authenticated;
