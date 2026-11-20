-- =============================================================
-- Topshiriqlar xavfsizligi: blok, ruxsat va cheklovlar
-- =============================================================
-- Topshiriq emailga yuboriladi. Bu qulay (odam ro'yxatdan o'tmagan
-- bo'lsa ham yuborib qo'yish mumkin), lekin emailingizni bilgan
-- HAR KIM sizga cheksiz topshiriq yuborishi mumkin degani ham.
-- Ilova "chat" ga aylanib ketmasligi va bezor qilishning oldini
-- olish uchun quyidagi himoya qo'yiladi.
--
-- Mantiq ataylab oddiy va kechirimli: begona odam ham birinchi
-- marta yoza oladi (boshliq bo'lishi mumkin), lekin javobsiz
-- yoki rad etilgan topshiriqlar to'planib qolsa — to'xtatiladi.
-- Qabul qiluvchi esa istalgan vaqtda ruxsat berib yoki olib
-- qo'yishi mumkin: oxirgi so'z DOIM qabul qiluvchida.
--
-- Uchta qoida:
--   1. Rad etilganlar soni 3 ga yetsa — bloklanadi;
--   2. Javobsiz (kutilmoqda) topshiriqlar 5 tadan oshmasin;
--   3. Qabul qiluvchi qo'lda bloklasa — darhol to'xtaydi.
-- Har uchalasini qabul qiluvchining ochiq RUXSATI bekor qiladi.

-- -------------------------------------------------------------
-- 1. Qanchaga ruxsat
-- -------------------------------------------------------------
-- Raqamlar bitta joyda: keyin o'zgartirish oson va kod bilan
-- hujjat bir-biridan ajralib ketmaydi.
create or replace function public.topshiriq_rad_chegarasi()
returns integer language sql immutable as $$ select 3 $$;

create or replace function public.topshiriq_kutish_chegarasi()
returns integer language sql immutable as $$ select 5 $$;

-- -------------------------------------------------------------
-- 2. Ruxsat va bloklar jadvali
-- -------------------------------------------------------------
-- Qator DOIM qabul qiluvchi nomidan yaratiladi: egasi — o'zini
-- himoya qilayotgan odam. Yuboruvchi email bo'yicha belgilanadi,
-- chunki topshiriq ham email bo'yicha yuboriladi.
create table if not exists public.topshiriq_ruxsatlari (
  id               uuid        primary key default gen_random_uuid(),
  -- Kim himoyalanmoqda (qabul qiluvchi)
  egasi_id         uuid        not null references auth.users (id) on delete cascade,
  -- Kimga nisbatan (yuboruvchi emaili, doim kichik harfda)
  yuboruvchi_email text        not null,
  -- 'ruxsat' — chegaralardan qat'i nazar yoza oladi
  -- 'blok'   — umuman yoza olmaydi
  holat            text        not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint topshiriq_ruxsat_holat_chk
    check (holat in ('ruxsat', 'blok')),
  constraint topshiriq_ruxsat_uniq
    unique (egasi_id, yuboruvchi_email)
);

comment on table public.topshiriq_ruxsatlari is
  'Kim menga topshiriq yuborishi mumkin. Egasi — qabul qiluvchi.';

create index if not exists topshiriq_ruxsat_egasi_idx
  on public.topshiriq_ruxsatlari (egasi_id);

-- Email doim kichik harfda saqlansin — taqqoslash shunga tayanadi
create or replace function public.tg_topshiriq_ruxsat_email()
returns trigger language plpgsql as $$
begin
  new.yuboruvchi_email := lower(btrim(new.yuboruvchi_email));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists topshiriq_ruxsat_email on public.topshiriq_ruxsatlari;
create trigger topshiriq_ruxsat_email
  before insert or update on public.topshiriq_ruxsatlari
  for each row execute function public.tg_topshiriq_ruxsat_email();

alter table public.topshiriq_ruxsatlari enable row level security;

-- Faqat o'z ro'yxatini ko'radi va boshqaradi
drop policy if exists topshiriq_ruxsat_select on public.topshiriq_ruxsatlari;
create policy topshiriq_ruxsat_select on public.topshiriq_ruxsatlari
  for select to authenticated
  using (egasi_id = (select auth.uid()));

drop policy if exists topshiriq_ruxsat_insert on public.topshiriq_ruxsatlari;
create policy topshiriq_ruxsat_insert on public.topshiriq_ruxsatlari
  for insert to authenticated
  with check (egasi_id = (select auth.uid()));

drop policy if exists topshiriq_ruxsat_update on public.topshiriq_ruxsatlari;
create policy topshiriq_ruxsat_update on public.topshiriq_ruxsatlari
  for update to authenticated
  using (egasi_id = (select auth.uid()))
  with check (egasi_id = (select auth.uid()));

drop policy if exists topshiriq_ruxsat_delete on public.topshiriq_ruxsatlari;
create policy topshiriq_ruxsat_delete on public.topshiriq_ruxsatlari
  for delete to authenticated
  using (egasi_id = (select auth.uid()));

grant select, insert, update, delete
  on public.topshiriq_ruxsatlari to authenticated;

-- -------------------------------------------------------------
-- 3. "Men bu odamga yoza olamanmi?"
-- -------------------------------------------------------------
-- SECURITY DEFINER: qaror qabul qiluvchining ma'lumotiga tayanadi,
-- yuboruvchi esa uni ko'ra olmaydi. Natija faqat ha/yo'q —
-- shuning uchun bu yerdan hech qanday shaxsiy ma'lumot sizib
-- chiqmaydi.
create or replace function public.topshiriq_yozsa_boladimi(
  p_yuboruvchi_id uuid,
  p_email         text
)
returns boolean
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email    text := lower(btrim(p_email));
  v_yuborchi text;
  v_qabul    uuid;
  v_holat    text;
  v_rad      integer;
  v_kutish   integer;
begin
  select lower(u.email) into v_yuborchi
    from auth.users u where u.id = p_yuboruvchi_id;
  if v_yuborchi is null then
    return false;
  end if;

  -- Qabul qiluvchi hali ro'yxatdan o'tmagan bo'lishi mumkin —
  -- bunda cheklovni qo'llaydigan "egasi" yo'q, ruxsat beriladi
  select u.id into v_qabul from auth.users u where lower(u.email) = v_email;
  if v_qabul is null then
    return true;
  end if;

  -- Ochiq qaror hamma narsadan ustun
  select r.holat into v_holat
    from public.topshiriq_ruxsatlari r
   where r.egasi_id = v_qabul
     and r.yuboruvchi_email = v_yuborchi;

  if v_holat = 'ruxsat' then return true;  end if;
  if v_holat = 'blok'   then return false; end if;

  select count(*) into v_rad
    from public.topshiriqlar t
   where t.yuboruvchi_id = p_yuboruvchi_id
     and t.qabul_qiluvchi_email = v_email
     and t.holat = 'rad';

  if v_rad >= public.topshiriq_rad_chegarasi() then
    return false;
  end if;

  select count(*) into v_kutish
    from public.topshiriqlar t
   where t.yuboruvchi_id = p_yuboruvchi_id
     and t.qabul_qiluvchi_email = v_email
     and t.holat = 'kutilmoqda';

  return v_kutish < public.topshiriq_kutish_chegarasi();
end;
$$;

comment on function public.topshiriq_yozsa_boladimi(uuid, text) is
  'Shu yuboruvchi shu emailga topshiriq yoza oladimi (blok/limit tekshiruvi).';

grant execute on function public.topshiriq_yozsa_boladimi(uuid, text)
  to authenticated;

-- -------------------------------------------------------------
-- 4. Yuborish siyosatiga cheklovni qo'shish
-- -------------------------------------------------------------
-- Nega RLS ichida: tekshiruv faqat interfeysda bo'lsa, to'g'ridan-
-- to'g'ri API ga murojaat qilib chetlab o'tish mumkin edi.
drop policy if exists topshiriqlar_insert on public.topshiriqlar;
create policy topshiriqlar_insert on public.topshiriqlar
  for insert to authenticated
  with check (
    yuboruvchi_id = (select auth.uid())
    and lower(btrim(qabul_qiluvchi_email)) <> (select public.joriy_email())
    and public.topshiriq_yozsa_boladimi(
          (select auth.uid()),
          qabul_qiluvchi_email)
  );

-- -------------------------------------------------------------
-- 5. Email shakli
-- -------------------------------------------------------------
-- To'liq tekshiruv emas (RFC bo'yicha email grammatikasi juda
-- murakkab), lekin "salom" kabi qiymat o'tib ketmaydi.
alter table public.topshiriqlar
  drop constraint if exists topshiriq_email_chk;

alter table public.topshiriqlar
  add constraint topshiriq_email_chk
  check (qabul_qiluvchi_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');
