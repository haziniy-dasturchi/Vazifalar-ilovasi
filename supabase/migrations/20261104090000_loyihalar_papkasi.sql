-- =============================================================
-- Samara — "Loyihalar" papkasi: har bir foydalanuvchida standart
-- =============================================================
-- Kiruvchi (Inbox) kabi, "Loyihalar" ham har bir foydalanuvchida
-- avtomatik bo'ladi va o'chirib/arxivlab bo'lmaydi. Foydalanuvchining
-- har bir loyihasi shu papka ICHIDA bo'lim (section) sifatida ochiladi.

alter table public.folders
  add column is_projects boolean not null default false;

comment on column public.folders.is_projects is
  'Standart "Loyihalar" papkasi. O''chirish/arxivlash taqiqlangan; har bir loyiha shu papka ichida bo''lim bo''ladi.';

-- Har bir foydalanuvchida faqat bitta "Loyihalar"
create unique index folders_one_projects_per_user
  on public.folders (user_id)
  where is_projects;

-- Bitta papka bir vaqtda ham Inbox, ham Loyihalar bo'la olmaydi
alter table public.folders
  add constraint folders_inbox_xor_projects_chk
  check (not (is_inbox and is_projects));

-- Loyihalar papkasi ham arxivlanmaydi
alter table public.folders
  add constraint folders_projects_not_archived_chk
  check (not (is_projects and is_archived));

-- -------------------------------------------------------------
-- Mavjud foydalanuvchilar uchun to'ldirish
-- -------------------------------------------------------------
-- MUHIM: bu blok himoya triggeri YANGILANISHIDAN OLDIN turadi —
-- yangi trigger is_projects o'zgarishini taqiqlaydi, shu sababli
-- to'ldirishni undan keyin bajarib bo'lmaydi.

-- 1) Allaqachon qo'lda "Loyihalar" deb nomlangan papka bo'lsa, uni
--    standart deb belgilaymiz (yangisini yaratib, ikkilantirmaymiz).
with nomzod as (
  select distinct on (f.user_id) f.id
  from public.folders f
  where not f.is_inbox
    and not f.is_projects
    and lower(btrim(f.name)) = 'loyihalar'
  order by f.user_id, f.created_at
)
update public.folders f
set is_projects = true,
    is_archived = false
from nomzod n
where f.id = n.id;

-- 2) Qolganlariga yangi "Loyihalar" papkasini yaratamiz
insert into public.folders (user_id, name, color, icon, sort_order, is_projects)
select u.id, 'Loyihalar', '#10b981', 'papka', 1, true
from auth.users u
where not exists (
  select 1 from public.folders f
  where f.user_id = u.id and f.is_projects
);

-- -------------------------------------------------------------
-- Himoya: Inbox bilan bir xil qoidalar Loyihalar uchun ham
-- -------------------------------------------------------------
create or replace function public.tg_folders_protect_inbox()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    -- Foydalanuvchining o'zi o'chirilayotganda (auth.users -> cascade)
    -- standart papkalar ham o'chishi kerak, aks holda akkauntni
    -- o'chirish imkonsiz bo'ladi.
    if (old.is_inbox or old.is_projects)
       and exists (select 1 from auth.users u where u.id = old.user_id) then
      raise exception '"%" papkasini o''chirish mumkin emas', old.name
        using errcode = 'P0001';
    end if;
    return old;
  end if;

  -- UPDATE
  if old.is_inbox is distinct from new.is_inbox then
    raise exception 'is_inbox belgisini o''zgartirish mumkin emas'
      using errcode = 'P0001';
  end if;

  if old.is_projects is distinct from new.is_projects then
    raise exception 'is_projects belgisini o''zgartirish mumkin emas'
      using errcode = 'P0001';
  end if;

  if (old.is_inbox or old.is_projects) and new.is_archived then
    raise exception '"%" papkasini arxivlash mumkin emas', old.name
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- -------------------------------------------------------------
-- Yangi foydalanuvchi: profil + Inbox + Loyihalar
-- -------------------------------------------------------------
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

  if not exists (
    select 1 from public.folders f
    where f.user_id = new.id and f.is_inbox
  ) then
    insert into public.folders (user_id, name, color, icon, sort_order, is_inbox)
    values (new.id, 'Kiruvchi', '#6366f1', 'inbox', 0, true);
  end if;

  if not exists (
    select 1 from public.folders f
    where f.user_id = new.id and f.is_projects
  ) then
    insert into public.folders (user_id, name, color, icon, sort_order, is_projects)
    values (new.id, 'Loyihalar', '#10b981', 'papka', 1, true);
  end if;

  return new;
end;
$$;
