-- =============================================================
-- Vazifalar — 03. folders (papkalar) va sections (bo'limlar)
-- =============================================================

create table public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users (id) on delete cascade,
  name        text        not null,
  color       text        not null default '#6366f1',
  icon        text,
  sort_order  integer     not null default 0,
  is_inbox    boolean     not null default false,
  is_archived boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint folders_name_chk
    check (char_length(btrim(name)) between 1 and 120),
  constraint folders_color_chk
    check (color ~ '^#[0-9a-fA-F]{6}$'),
  -- Inbox hech qachon arxivda bo'lmaydi
  constraint folders_inbox_not_archived_chk
    check (not (is_inbox and is_archived)),
  -- Bola jadvallardagi kompozit FK uchun kerak (egalik DB darajasida kafolatlanadi)
  constraint folders_id_user_uniq unique (id, user_id)
);

comment on table  public.folders is 'Papkalar. Har bir foydalanuvchida aynan bitta Inbox bo''ladi.';
comment on column public.folders.is_inbox is 'Kiruvchi papka. O''chirish/arxivlash taqiqlangan.';

-- Har bir foydalanuvchida faqat bitta Inbox
create unique index folders_one_inbox_per_user
  on public.folders (user_id)
  where is_inbox;

create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.tg_set_updated_at();

-- -------------------------------------------------------------

create table public.sections (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users (id) on delete cascade,
  folder_id    uuid        not null,
  name         text        not null,
  sort_order   integer     not null default 0,
  is_collapsed boolean     not null default false,
  created_at   timestamptz not null default now(),

  constraint sections_name_chk
    check (char_length(btrim(name)) between 1 and 120),
  -- Bo'lim doim o'z egasining papkasida bo'ladi; papka o'chsa bo'lim ham o'chadi
  constraint sections_folder_fk
    foreign key (folder_id, user_id)
    references public.folders (id, user_id) on delete cascade,
  -- tasks.section_id uchun kompozit FK
  constraint sections_id_folder_uniq unique (id, folder_id)
);

comment on table public.sections is 'Papka ichidagi bo''limlar.';

grant select, insert, update, delete on public.folders  to authenticated;
grant select, insert, update, delete on public.sections to authenticated;
