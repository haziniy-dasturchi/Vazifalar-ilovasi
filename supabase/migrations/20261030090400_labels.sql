-- =============================================================
-- Vazifalar — 05. labels (teglar) va task_labels (ko'pga-ko'p)
-- =============================================================

create table public.labels (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  name       text        not null,
  color      text        not null default '#64748b',
  sort_order integer     not null default 0,
  created_at timestamptz not null default now(),

  constraint labels_name_chk
    check (char_length(btrim(name)) between 1 and 60),
  constraint labels_color_chk
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  constraint labels_id_user_uniq unique (id, user_id)
);

comment on table public.labels is 'Foydalanuvchining teglari.';

-- Bitta foydalanuvchida bir xil nomli teg bo'lmasin (katta-kichik harf farqsiz)
create unique index labels_user_name_uniq
  on public.labels (user_id, lower(btrim(name)));

-- -------------------------------------------------------------

create table public.task_labels (
  task_id    uuid        not null,
  label_id   uuid        not null,
  user_id    uuid        not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),

  primary key (task_id, label_id),
  constraint task_labels_task_fk
    foreign key (task_id, user_id)
    references public.tasks (id, user_id) on delete cascade,
  constraint task_labels_label_fk
    foreign key (label_id, user_id)
    references public.labels (id, user_id) on delete cascade
);

comment on table  public.task_labels is 'Vazifa <-> teg bog''lanishi.';
comment on column public.task_labels.user_id is 'RLS uchun takrorlangan ega; kompozit FK vazifa va teg bir egada bo''lishini kafolatlaydi.';

grant select, insert, update, delete on public.labels      to authenticated;
grant select, insert, update, delete on public.task_labels to authenticated;
