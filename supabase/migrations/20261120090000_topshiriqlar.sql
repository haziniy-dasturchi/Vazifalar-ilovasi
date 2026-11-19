-- Topshiriqlar: bir foydalanuvchidan ikkinchisiga
--
-- MUHIM QAROR: bu Samara'ni bir kishilik ilovadan ko'p kishilik
-- ilovaga aylantiradi. Shuning uchun xavfsizlik qoidalari alohida
-- diqqat bilan yozilgan.
--
-- Nega `tasks` ga ustun qo'shilmadi: u yerdagi himoya qoidasi
-- qat'iy — "faqat user_id = auth.uid() bo'lgan qatorlar". Ikki
-- kishiga ko'rinadigan qator bu qoidani buzadi va butun jadval
-- himoyasini bo'shashtirardi. Topshiriqning hayot sikli ham
-- boshqacha (kutilmoqda → qabul/rad), shuning uchun alohida jadval.
--
-- QABUL QILUVCHI EMAIL BO'YICHA TOPILADI, id bo'yicha emas.
-- Sababi ikkita:
--   1. Yuborish paytida "bu email ro'yxatdan o'tganmi" deb
--      tekshirish kerak emas — aks holda kimning hisobi borligini
--      tekshirib olish mumkin bo'lardi (account enumeration).
--   2. Odam keyinroq ro'yxatdan o'tsa, topshiriq o'zi paydo bo'ladi.

-- -------------------------------------------------------------
-- 0. Joriy foydalanuvchining emaili
-- -------------------------------------------------------------
-- `auth.users` oddiy foydalanuvchiga ko'rinmaydi, lekin o'z emaili
-- tokenning ichida bor — uni o'qish xavfsiz.
create or replace function public.joriy_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

comment on function public.joriy_email() is
  'Joriy foydalanuvchining emaili (kichik harflarda), tokendan olinadi.';

-- -------------------------------------------------------------
-- 1. Jadval
-- -------------------------------------------------------------
create table if not exists public.topshiriqlar (
  id                   uuid        primary key default gen_random_uuid(),
  yuboruvchi_id        uuid        not null references auth.users (id) on delete cascade,
  -- Doim kichik harflarda saqlanadi (quyidagi trigger)
  qabul_qiluvchi_email text        not null,
  sarlavha             text        not null,
  izoh                 text,
  muddat               date,
  muhimlik             smallint    not null default 4,
  holat                text        not null default 'kutilmoqda',
  rad_sababi           text,
  -- Qabul qilinganda qabul qiluvchining hisobida yaratilgan vazifa
  vazifa_id            uuid        references public.tasks (id) on delete set null,
  -- Push bildirishnoma yuborilgan vaqt (null = hali yuborilmagan)
  bildirildi_at        timestamptz,
  created_at           timestamptz not null default now(),
  javob_at             timestamptz,

  constraint topshiriq_holat_chk
    check (holat in ('kutilmoqda', 'qabul', 'rad', 'bajarildi')),
  constraint topshiriq_muhimlik_chk
    check (muhimlik between 1 and 4),
  constraint topshiriq_sarlavha_chk
    check (length(btrim(sarlavha)) between 1 and 500),
  constraint topshiriq_izoh_chk
    check (izoh is null or length(izoh) <= 2000),
  constraint topshiriq_sabab_chk
    check (rad_sababi is null or length(rad_sababi) <= 1000),
  -- Oddiy shakl tekshiruvi; to'liq tasdiqlash baribir imkonsiz
  constraint topshiriq_email_chk
    check (qabul_qiluvchi_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

comment on table public.topshiriqlar is
  'Foydalanuvchidan foydalanuvchiga topshiriq. Qabul qiluvchi email bo''yicha topiladi.';

create index if not exists topshiriqlar_yuboruvchi_idx
  on public.topshiriqlar (yuboruvchi_id, created_at desc);

create index if not exists topshiriqlar_qabul_email_idx
  on public.topshiriqlar (qabul_qiluvchi_email, created_at desc);

-- Email har doim bir xil shaklda saqlansin — aks holda "Ali@..." va
-- "ali@..." ikki xil odam bo'lib qolardi
create or replace function public.tg_topshiriq_email_kichik()
returns trigger
language plpgsql
as $$
begin
  new.qabul_qiluvchi_email := lower(btrim(new.qabul_qiluvchi_email));
  return new;
end;
$$;

drop trigger if exists topshiriq_email_kichik on public.topshiriqlar;
create trigger topshiriq_email_kichik
  before insert or update of qabul_qiluvchi_email on public.topshiriqlar
  for each row execute function public.tg_topshiriq_email_kichik();

-- -------------------------------------------------------------
-- 2. Himoya qoidalari
-- -------------------------------------------------------------
alter table public.topshiriqlar enable row level security;

-- Ko'rish: yuboruvchi ham, qabul qiluvchi ham
drop policy if exists topshiriqlar_select on public.topshiriqlar;
create policy topshiriqlar_select on public.topshiriqlar
  for select to authenticated
  using (
    yuboruvchi_id = (select auth.uid())
    or qabul_qiluvchi_email = (select public.joriy_email())
  );

-- Yuborish: faqat o'z nomidan va o'ziga emas
drop policy if exists topshiriqlar_insert on public.topshiriqlar;
create policy topshiriqlar_insert on public.topshiriqlar
  for insert to authenticated
  with check (
    yuboruvchi_id = (select auth.uid())
    and lower(btrim(qabul_qiluvchi_email)) <> (select public.joriy_email())
  );

-- Bekor qilish: faqat yuboruvchi va faqat javob berilmagan bo'lsa
drop policy if exists topshiriqlar_delete on public.topshiriqlar;
create policy topshiriqlar_delete on public.topshiriqlar
  for delete to authenticated
  using (
    yuboruvchi_id = (select auth.uid())
    and holat = 'kutilmoqda'
  );

-- UPDATE siyosati ATAYLAB YO'Q. Holat o'zgarishi faqat quyidagi
-- funksiyalar orqali bo'ladi — shunda qabul qiluvchi, masalan,
-- sarlavhani o'zgartirib qo'ya olmaydi.

-- -------------------------------------------------------------
-- 3. Qabul qilish
-- -------------------------------------------------------------
-- SECURITY DEFINER: qabul qiluvchining Kiruvchi papkasida vazifa
-- yaratiladi va topshiriq yangilanadi. Huquq qo'lda tekshiriladi.
create or replace function public.topshiriqni_qabul_qilish(p_id uuid)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t      public.topshiriqlar;
  v_uid    uuid := auth.uid();
  v_email  text := public.joriy_email();
  v_papka  uuid;
  v_vazifa uuid;
begin
  -- Bitta xato xabari: "topilmadi" va "sizga emas" ni ajratish
  -- begona topshiriq mavjudligini oshkor qilardi
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.qabul_qiluvchi_email <> v_email then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
  if v_t.holat <> 'kutilmoqda' then
    raise exception 'Topshiriqqa allaqachon javob berilgan' using errcode = 'P0001';
  end if;

  select f.id into v_papka
    from public.folders f
   where f.user_id = v_uid and f.is_inbox
   limit 1;

  if v_papka is null then
    raise exception 'Kiruvchi papka topilmadi' using errcode = 'P0002';
  end if;

  insert into public.tasks (user_id, folder_id, title, due_date, priority)
  values (v_uid, v_papka, v_t.sarlavha, v_t.muddat, v_t.muhimlik)
  returning id into v_vazifa;

  update public.topshiriqlar
     set holat     = 'qabul',
         vazifa_id = v_vazifa,
         javob_at  = now()
   where id = p_id
  returning * into v_t;

  return v_t;
end;
$$;

-- -------------------------------------------------------------
-- 4. Rad etish
-- -------------------------------------------------------------
create or replace function public.topshiriqni_rad_etish(
  p_id     uuid,
  p_sabab  text
)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t     public.topshiriqlar;
  v_email text := public.joriy_email();
begin
  -- Bitta xato xabari: "topilmadi" va "sizga emas" ni ajratish
  -- begona topshiriq mavjudligini oshkor qilardi
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.qabul_qiluvchi_email <> v_email then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
  if v_t.holat <> 'kutilmoqda' then
    raise exception 'Topshiriqqa allaqachon javob berilgan' using errcode = 'P0001';
  end if;

  update public.topshiriqlar
     set holat      = 'rad',
         rad_sababi = nullif(btrim(coalesce(p_sabab, '')), ''),
         javob_at   = now()
   where id = p_id
  returning * into v_t;

  return v_t;
end;
$$;

-- -------------------------------------------------------------
-- 5. Bajarilganda holat o'zi yangilanadi
-- -------------------------------------------------------------
-- Yuboruvchi "bajarildimi?" deb so'rab turmasligi uchun: qabul
-- qiluvchi vazifani tugatganda topshiriq ham 'bajarildi' bo'ladi.
create or replace function public.tg_topshiriq_holatini_kuzat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'done' and coalesce(old.status, '') <> 'done' then
    update public.topshiriqlar
       set holat = 'bajarildi'
     where vazifa_id = new.id and holat = 'qabul';
  elsif new.status <> 'done' and coalesce(old.status, '') = 'done' then
    -- Qaytarilsa topshiriq ham qabul holatiga qaytadi
    update public.topshiriqlar
       set holat = 'qabul'
     where vazifa_id = new.id and holat = 'bajarildi';
  end if;
  return new;
end;
$$;

drop trigger if exists topshiriq_holatini_kuzat on public.tasks;
create trigger topshiriq_holatini_kuzat
  after update of status on public.tasks
  for each row execute function public.tg_topshiriq_holatini_kuzat();

-- -------------------------------------------------------------
-- 6. Push bildirishnoma uchun navbat
-- -------------------------------------------------------------
-- MUHIM: mavjud `kutilayotgan_eslatmalar()` ga TEGILMAYDI. Agar
-- uning shakli o'zgartirilsa, Edge Function qayta joylanmaguncha
-- oddiy eslatmalar ham ishlamay qolardi. Shuning uchun yangi,
-- mustaqil funksiya.
create or replace function public.kutilayotgan_topshiriqlar()
returns table (
  topshiriq_id uuid,
  sarlavha     text,
  yuboruvchi   text,
  endpoint     text,
  p256dh       text,
  auth         text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select t.id,
         t.sarlavha,
         coalesce(p.full_name, u.email, '') as yuboruvchi,
         s.endpoint,
         s.p256dh,
         s.auth
    from public.topshiriqlar t
    join auth.users qab
      on lower(qab.email) = t.qabul_qiluvchi_email
    join public.push_subscriptions s
      on s.user_id = qab.id
    left join auth.users u on u.id = t.yuboruvchi_id
    left join public.profiles p on p.id = t.yuboruvchi_id
   where t.holat = 'kutilmoqda'
     and t.bildirildi_at is null
     -- Juda eski topshiriq uchun bildirishnoma yuborish ma'nosiz
     and t.created_at > now() - interval '3 days';
$$;

-- Parametr nomi ATAYLAB `p_idlar`: agar u `topshiriqlar` deb
-- nomlansa, Postgres `any(topshiriqlar)` da uni parametr emas,
-- SHU NOMDAGI JADVAL deb o'qiydi va "op ANY/ALL (array) requires
-- array on right side" xatosini beradi.
create or replace function public.topshiriq_bildirildi(p_idlar uuid[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.topshiriqlar
     set bildirildi_at = now()
   where id = any(p_idlar);
$$;

-- Bu funksiyalarni faqat server chaqiradi.
-- DIQQAT: `revoke ... from public` service_role'ni ham huquqdan mahrum
-- qiladi (u huquqni PUBLIC orqali oladi), shuning uchun keyin unga
-- alohida ruxsat beriladi. Busiz Edge Function "permission denied"
-- olardi va topshiriq bildirishnomalari umuman kelmasdi.
revoke all on function public.kutilayotgan_topshiriqlar() from public, anon, authenticated;
revoke all on function public.topshiriq_bildirildi(uuid[]) from public, anon, authenticated;
grant execute on function public.kutilayotgan_topshiriqlar() to service_role;
grant execute on function public.topshiriq_bildirildi(uuid[]) to service_role;

-- -------------------------------------------------------------
-- 7. Hisobni o'chirishda topshiriqlar ham ketadi
-- -------------------------------------------------------------
-- `yuboruvchi_id` cascade bilan bog'langan, lekin qabul qiluvchi
-- email bo'yicha topiladi — uning topshiriqlari qolib ketardi.
create or replace function public.tg_topshiriqlarni_tozala()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.topshiriqlar
   where qabul_qiluvchi_email = lower(old.email);
  return old;
end;
$$;

drop trigger if exists topshiriqlarni_tozala on auth.users;
create trigger topshiriqlarni_tozala
  before delete on auth.users
  for each row execute function public.tg_topshiriqlarni_tozala();
