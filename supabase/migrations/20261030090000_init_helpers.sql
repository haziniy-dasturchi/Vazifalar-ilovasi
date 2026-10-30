-- =============================================================
-- Vazifalar — 01. Yordamchi funksiyalar va umumiy huquqlar
-- =============================================================
-- Bu migratsiya keyingi barcha migratsiyalar tayanadigan umumiy
-- funksiyalarni yaratadi. gen_random_uuid() PostgreSQL 13+ da
-- yadroga kirgani uchun qo'shimcha kengaytma talab qilinmaydi.

-- authenticated roli public sxemadan foydalanishi uchun
grant usage on schema public to authenticated;

-- -------------------------------------------------------------
-- updated_at ustunini avtomatik yangilash
-- -------------------------------------------------------------
create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at() is
  'BEFORE UPDATE trigger: updated_at ustunini now() ga tenglashtiradi.';

-- -------------------------------------------------------------
-- timestamptz -> foydalanuvchi mintaqasidagi kalendar sana
-- -------------------------------------------------------------
create or replace function public.local_date(p_ts timestamptz, p_tz text)
returns date
language sql
immutable
as $$
  select (p_ts at time zone p_tz)::date;
$$;

comment on function public.local_date(timestamptz, text) is
  'UTC vaqtni berilgan mintaqadagi kalendar sanaga aylantiradi.';
