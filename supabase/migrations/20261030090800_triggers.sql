-- =============================================================
-- Vazifalar — 09. Avtomatika: triggerlar
-- =============================================================

-- -------------------------------------------------------------
-- Hodisa yozishni vaqtincha o'chirish (takrorlanuvchi vazifani
-- surish paytida ortiqcha 'uncompleted' hodisasi yozilmasligi uchun)
-- -------------------------------------------------------------
create or replace function public.events_suppressed()
returns boolean
language sql
stable
as $$
  select coalesce(current_setting('vazifalar.skip_events', true), 'off') = 'on';
$$;

-- =============================================================
-- Inbox himoyasi
-- =============================================================
create or replace function public.tg_folders_protect_inbox()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    -- Foydalanuvchining o'zi o'chirilayotganda (auth.users -> cascade)
    -- Inbox ham o'chishi kerak, aks holda akkauntni o'chirish imkonsiz bo'ladi.
    if old.is_inbox
       and exists (select 1 from auth.users u where u.id = old.user_id) then
      raise exception 'Kiruvchi (Inbox) papkani o''chirish mumkin emas'
        using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.is_inbox is distinct from new.is_inbox then
    raise exception 'is_inbox belgisini o''zgartirish mumkin emas'
      using errcode = 'P0001';
  end if;

  if old.is_inbox and new.is_archived then
    raise exception 'Kiruvchi (Inbox) papkani arxivlash mumkin emas'
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger folders_protect_inbox_delete
  before delete on public.folders
  for each row execute function public.tg_folders_protect_inbox();

create trigger folders_protect_inbox_update
  before update on public.folders
  for each row execute function public.tg_folders_protect_inbox();

-- =============================================================
-- Subtask iyerarxiyasi: faqat 1 daraja + ota bilan bir papkada
-- =============================================================
create or replace function public.tg_tasks_hierarchy()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_parent public.tasks;
begin
  if new.parent_id is null then
    return new;
  end if;

  select * into v_parent
  from public.tasks t
  where t.id = new.parent_id;

  if not found then
    raise exception 'Ota-vazifa topilmadi: %', new.parent_id
      using errcode = 'P0002';
  end if;

  if v_parent.user_id <> new.user_id then
    raise exception 'Subtask ota-vazifa bilan bir foydalanuvchiga tegishli bo''lishi kerak'
      using errcode = 'P0001';
  end if;

  -- Faqat 1 daraja: ota-vazifaning o'zi subtask bo'lmasligi kerak
  if v_parent.parent_id is not null then
    raise exception 'Subtask faqat 1 daraja bo''ladi: "%" allaqachon subtask', v_parent.title
      using errcode = 'P0001';
  end if;

  -- O'zida bolasi bor vazifani subtask qilib qo'yish ham 2 daraja hosil qiladi
  if exists (select 1 from public.tasks c where c.parent_id = new.id) then
    raise exception 'Subtasklari bor vazifani boshqa vazifaga subtask qilib qo''yish mumkin emas'
      using errcode = 'P0001';
  end if;

  -- Subtask doim ota-vazifa papkasi va bo'limida bo'ladi
  new.folder_id  := v_parent.folder_id;
  new.section_id := v_parent.section_id;

  return new;
end;
$$;

create trigger tasks_hierarchy
  before insert or update of parent_id, folder_id, section_id, user_id on public.tasks
  for each row execute function public.tg_tasks_hierarchy();

-- -------------------------------------------------------------
-- Ota-vazifa ko'chirilsa — subtasklari ham ko'chadi
-- -------------------------------------------------------------
create or replace function public.tg_tasks_sync_children()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Rekursiya bo'lmaydi: subtask qatorlari uchun darhol chiqamiz
  if new.parent_id is not null then
    return null;
  end if;

  update public.tasks c
     set folder_id  = new.folder_id,
         section_id = new.section_id
   where c.parent_id = new.id
     and (c.folder_id, c.section_id) is distinct from (new.folder_id, new.section_id);

  return null;
end;
$$;

create trigger tasks_sync_children
  after update of folder_id, section_id on public.tasks
  for each row
  when (
    old.folder_id is distinct from new.folder_id
    or old.section_id is distinct from new.section_id
  )
  execute function public.tg_tasks_sync_children();

-- =============================================================
-- status -> started_at / completed_at + task_events
-- =============================================================
create or replace function public.tg_tasks_touch_timestamps()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'done' then
      new.completed_at := coalesce(new.completed_at, now());
      new.started_at   := coalesce(new.started_at, new.completed_at);
    else
      new.completed_at := null;
      if new.status = 'in_progress' then
        new.started_at := coalesce(new.started_at, now());
      end if;
    end if;
    return new;
  end if;

  -- UPDATE
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'done' then
    new.completed_at := coalesce(nullif(new.completed_at, old.completed_at), now());
    new.started_at   := coalesce(new.started_at, new.completed_at);
  elsif new.status = 'in_progress' then
    new.completed_at := null;
    new.started_at   := coalesce(new.started_at, now());
  else -- planned
    new.completed_at := null;
    -- started_at tarix sifatida saqlanadi (vazifa qachon boshlangani bilinadi)
  end if;

  return new;
end;
$$;

create trigger tasks_touch_timestamps
  before insert or update on public.tasks
  for each row execute function public.tg_tasks_touch_timestamps();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.tg_set_updated_at();

-- -------------------------------------------------------------
-- Hodisalar jurnali
-- -------------------------------------------------------------
create or replace function public.tg_tasks_log_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event text;
begin
  if public.events_suppressed() then
    return null;
  end if;

  if tg_op = 'INSERT' then
    v_event := 'created';
  elsif new.status is distinct from old.status then
    v_event := case
      when new.status = 'done'        then 'completed'
      when old.status = 'done'        then 'uncompleted'
      when new.status = 'in_progress' then 'started'
      else 'moved_back'
    end;
  else
    return null;
  end if;

  insert into public.task_events (user_id, task_id, folder_id, event)
  values (new.user_id, new.id, new.folder_id, v_event);

  return null;
end;
$$;

create trigger tasks_log_event
  after insert or update of status on public.tasks
  for each row execute function public.tg_tasks_log_event();

-- =============================================================
-- Yangi foydalanuvchi: profil + bitta Inbox papka
-- =============================================================
create or replace function public.tg_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, ''), '@', 1)
    )), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  -- Boshqa papka yaratilmaydi — faqat Inbox
  if not exists (
    select 1 from public.folders f
    where f.user_id = new.id and f.is_inbox
  ) then
    insert into public.folders (user_id, name, color, icon, sort_order, is_inbox)
    values (new.id, 'Kiruvchi', '#6366f1', 'inbox', 0, true);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_handle_new_user();
