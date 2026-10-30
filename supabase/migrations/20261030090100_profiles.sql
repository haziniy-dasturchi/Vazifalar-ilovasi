-- =============================================================
-- Vazifalar — 02. profiles (foydalanuvchi sozlamalari)
-- =============================================================

create table public.profiles (
  id                          uuid primary key
                                references auth.users (id) on delete cascade,
  full_name                   text,
  avatar_url                  text,
  timezone                    text        not null default 'Asia/Tashkent',
  daily_goal                  smallint    not null default 5,
  evening_review_time         time        not null default '21:00',
  pomodoro_focus_min          smallint    not null default 25,
  pomodoro_short_break_min    smallint    not null default 5,
  pomodoro_long_break_min     smallint    not null default 15,
  pomodoro_cycles_before_long smallint    not null default 4,
  auto_start_break            boolean     not null default false,
  -- Dam olish kunlari: 0 = yakshanba ... 6 = shanba
  days_off                    integer[]   not null default '{}'::integer[],
  theme                       text        not null default 'system',
  created_at                  timestamptz not null default now(),

  constraint profiles_daily_goal_chk
    check (daily_goal between 1 and 100),
  constraint profiles_focus_chk
    check (pomodoro_focus_min between 1 and 180),
  constraint profiles_short_break_chk
    check (pomodoro_short_break_min between 1 and 60),
  constraint profiles_long_break_chk
    check (pomodoro_long_break_min between 1 and 120),
  constraint profiles_cycles_chk
    check (pomodoro_cycles_before_long between 1 and 12),
  constraint profiles_days_off_chk
    check (days_off <@ array[0,1,2,3,4,5,6]),
  constraint profiles_theme_chk
    check (theme in ('system', 'light', 'dark'))
);

comment on table  public.profiles is 'Foydalanuvchi profili va ilova sozlamalari.';
comment on column public.profiles.days_off is 'Dam olish kunlari, 0 = yakshanba ... 6 = shanba.';
comment on column public.profiles.timezone is 'IANA mintaqa nomi. Hisobotlar shu mintaqada hisoblanadi.';

-- timezone qiymati haqiqiy IANA nomi bo'lishini tekshirish
-- (CHECK ichida pg_timezone_names ishlatish mumkin emas — IMMUTABLE emas)
create or replace function public.tg_profiles_validate_timezone()
returns trigger
language plpgsql
as $$
begin
  if not exists (select 1 from pg_timezone_names z where z.name = new.timezone) then
    raise exception 'Noto''g''ri vaqt mintaqasi: %', new.timezone
      using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.tg_profiles_validate_timezone();

-- -------------------------------------------------------------
-- Foydalanuvchining vaqt mintaqasi (xato yoki yo'q bo'lsa — Asia/Tashkent)
-- -------------------------------------------------------------
create or replace function public.user_timezone(p_user_id uuid)
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select p.timezone
      from public.profiles p
      where p.id = p_user_id
        and exists (select 1 from pg_timezone_names z where z.name = p.timezone)
    ),
    'Asia/Tashkent'
  );
$$;

comment on function public.user_timezone(uuid) is
  'Profildagi timezone qiymatini qaytaradi; yo''q yoki yaroqsiz bo''lsa Asia/Tashkent.';

grant select, insert, update, delete on public.profiles to authenticated;
