-- =============================================================
-- Topshiriqlar, 2- va 3-bosqich
-- =============================================================
-- SWOT'dagi zaif tomonlar va tahdidlarga javob:
--   * Email noqulay, jamoa yo'q  -> JAMOA (havola bilan qo'shilish,
--     jamoa ichida avtomatik qabul) va SHAXSIY TAKLIF havolasi
--     (bosgan odam kontaktga o'zi qo'shiladi).
--   * Izoh, fayl yo'q            -> IZOHLAR ZANJIRI + FAYL (Storage).
--   * Kim nima qilgani noma'lum  -> O'ZGARISHLAR TARIXI (trigger).
--   * Push kechikadi / unutiladi -> umumiy XABARLAR NAVBATI: holat
--     o'zgarishi, izoh, muddat yaqinlashishi va kechikish.
--   * Faqat bitta odamga         -> `guruh_id` (bir nechta nusxa).
--   * Takroriy ishlar            -> `takror` (bajarilgach keyingisi).
--   * Rahbar bahosi              -> `baho` (1-5, tasdiqlashda).
--   * RLS xatosi qimmat          -> hamma yozish SECURITY DEFINER
--     funksiyalar orqali, har birida huquq qo'lda tekshiriladi;
--     to'g'ridan-to'g'ri jadvalga yozish faqat izohlarga (RLS bilan).

-- -------------------------------------------------------------
-- 0. Yordamchi funksiyalar
-- -------------------------------------------------------------
create or replace function public.tasodifiy_kod(p_uzunlik int default 10)
returns text
language sql
volatile
as $$
  select substr(
    translate(encode(decode(md5(random()::text || clock_timestamp()::text), 'hex'), 'base64'),
              '+/=', 'xyz'),
    1, p_uzunlik);
$$;

-- Ism ko'rinishi: profil ismi, bo'lmasa email
create or replace function public.foydalanuvchi_ismi(p_uid uuid)
returns text
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select coalesce(nullif(btrim(p.full_name), ''), u.email, '')
    from auth.users u
    left join public.profiles p on p.id = u.id
   where u.id = p_uid;
$$;
revoke all on function public.foydalanuvchi_ismi(uuid) from public, anon, authenticated;

create or replace function public.email_egasi(p_email text)
returns uuid
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select u.id from auth.users u where lower(u.email) = lower(btrim(p_email)) limit 1;
$$;
revoke all on function public.email_egasi(text) from public, anon, authenticated;

-- -------------------------------------------------------------
-- 1. Jamoalar
-- -------------------------------------------------------------
create table if not exists public.jamoalar (
  id          uuid        primary key default gen_random_uuid(),
  nom         text        not null,
  egasi_id    uuid        not null references auth.users (id) on delete cascade,
  taklif_kodi text        not null unique default public.tasodifiy_kod(10),
  created_at  timestamptz not null default now(),
  constraint jamoa_nom_chk check (length(btrim(nom)) between 1 and 80)
);

create table if not exists public.jamoa_azolari (
  jamoa_id     uuid        not null references public.jamoalar (id) on delete cascade,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  rol          text        not null default 'azo',
  qoshilgan_at timestamptz not null default now(),
  primary key (jamoa_id, user_id),
  constraint jamoa_rol_chk check (rol in ('rahbar', 'azo'))
);
create index if not exists jamoa_azolari_user_idx on public.jamoa_azolari (user_id);

-- Rekursiyasiz tekshiruv (RLS ichida o'z jadvaliga murojaat qilmaslik uchun)
create or replace function public.jamoa_azosimi(p_jamoa uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.jamoa_azolari
     where jamoa_id = p_jamoa and user_id = auth.uid());
$$;

create or replace function public.jamoa_rahbarimi(p_jamoa uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.jamoa_azolari
     where jamoa_id = p_jamoa and user_id = auth.uid() and rol = 'rahbar');
$$;

-- Ikki odam kamida bitta umumiy jamoadami
create or replace function public.bir_jamoadami(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_a is not null and p_b is not null and exists (
    select 1
      from public.jamoa_azolari a
      join public.jamoa_azolari b on b.jamoa_id = a.jamoa_id
     where a.user_id = p_a and b.user_id = p_b);
$$;
revoke all on function public.bir_jamoadami(uuid, uuid) from public, anon, authenticated;

alter table public.jamoalar      enable row level security;
alter table public.jamoa_azolari enable row level security;

-- Faqat o'qish. Yozish — pastdagi funksiyalar orqali.
drop policy if exists jamoalar_select on public.jamoalar;
create policy jamoalar_select on public.jamoalar
  for select to authenticated
  using (public.jamoa_azosimi(id));

drop policy if exists jamoa_azolari_select on public.jamoa_azolari;
create policy jamoa_azolari_select on public.jamoa_azolari
  for select to authenticated
  using (public.jamoa_azosimi(jamoa_id));

grant select on public.jamoalar, public.jamoa_azolari to authenticated;

create or replace function public.jamoa_yaratish(p_nom text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Avtorizatsiya talab qilinadi' using errcode = '42501';
  end if;
  -- Suiiste'molga qarshi: bir odam ko'pi bilan 10 ta jamoa ochadi
  if (select count(*) from public.jamoalar where egasi_id = v_uid) >= 10 then
    raise exception 'Jamoalar soni chegarasi' using errcode = 'P0001';
  end if;
  insert into public.jamoalar (nom, egasi_id) values (btrim(p_nom), v_uid)
  returning id into v_id;
  insert into public.jamoa_azolari (jamoa_id, user_id, rol)
  values (v_id, v_uid, 'rahbar');
  return v_id;
end;
$$;

create or replace function public.jamoaga_qoshilish(p_kod text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_id  uuid;
begin
  if v_uid is null then
    raise exception 'Avtorizatsiya talab qilinadi' using errcode = '42501';
  end if;
  select id into v_id from public.jamoalar where taklif_kodi = btrim(p_kod);
  if v_id is null then
    raise exception 'Taklif havolasi eskirgan yoki noto''g''ri' using errcode = 'P0002';
  end if;
  if (select count(*) from public.jamoa_azolari where jamoa_id = v_id) >= 200 then
    raise exception 'Jamoa to''lgan' using errcode = 'P0001';
  end if;
  insert into public.jamoa_azolari (jamoa_id, user_id, rol)
  values (v_id, v_uid, 'azo')
  on conflict do nothing;
  return v_id;
end;
$$;

create or replace function public.jamoadan_chiqish(p_jamoa uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
begin
  if public.jamoa_rahbarimi(p_jamoa) then
    raise exception 'Rahbar jamoadan chiqa olmaydi — jamoani o''chiring' using errcode = 'P0001';
  end if;
  delete from public.jamoa_azolari where jamoa_id = p_jamoa and user_id = v_uid;
end;
$$;

create or replace function public.jamoadan_chiqarish(p_jamoa uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.jamoa_rahbarimi(p_jamoa) then
    raise exception 'Faqat rahbar' using errcode = '42501';
  end if;
  delete from public.jamoa_azolari
   where jamoa_id = p_jamoa and user_id = p_user and rol <> 'rahbar';
end;
$$;

create or replace function public.jamoani_ochirish(p_jamoa uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.jamoa_rahbarimi(p_jamoa) then
    raise exception 'Faqat rahbar' using errcode = '42501';
  end if;
  delete from public.jamoalar where id = p_jamoa;
end;
$$;

-- Havola tarqalib ketgan bo'lsa — eskisini bekor qilish
create or replace function public.jamoa_kodini_yangilash(p_jamoa uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_kod text;
begin
  if not public.jamoa_rahbarimi(p_jamoa) then
    raise exception 'Faqat rahbar' using errcode = '42501';
  end if;
  update public.jamoalar set taklif_kodi = public.tasodifiy_kod(10)
   where id = p_jamoa
  returning taklif_kodi into v_kod;
  return v_kod;
end;
$$;

-- Mening jamoalarim a'zolari (ism va email bilan). Jamoaga ixtiyoriy
-- qo'shilgan odam jamoadoshlariga ko'rinishga rozi bo'lgan.
create or replace function public.jamoa_azolari_royxati()
returns table (
  jamoa_id uuid,
  user_id  uuid,
  email    text,
  ism      text,
  rol      text
)
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select a.jamoa_id, a.user_id, lower(u.email),
         nullif(btrim(coalesce(p.full_name, '')), ''), a.rol
    from public.jamoa_azolari a
    join auth.users u on u.id = a.user_id
    left join public.profiles p on p.id = a.user_id
   where public.jamoa_azosimi(a.jamoa_id)
   order by a.rol desc, a.qoshilgan_at;
$$;

-- Havola ochilganda: qaysi jamoa ekanini qo'shilmasdan oldin ko'rish
create or replace function public.jamoa_taklifi(p_kod text)
returns table (nom text, azolar integer, azomi boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select j.nom,
         (select count(*)::int from public.jamoa_azolari a where a.jamoa_id = j.id),
         public.jamoa_azosimi(j.id)
    from public.jamoalar j
   where j.taklif_kodi = btrim(p_kod);
$$;

-- -------------------------------------------------------------
-- 2. Shaxsiy taklif havolasi va kontaktlar
-- -------------------------------------------------------------
alter table public.profiles
  add column if not exists taklif_kodi text unique default public.tasodifiy_kod(10);
update public.profiles set taklif_kodi = public.tasodifiy_kod(10) where taklif_kodi is null;

create table if not exists public.kontaktlar (
  egasi_id   uuid        not null references auth.users (id) on delete cascade,
  email      text        not null,
  created_at timestamptz not null default now(),
  primary key (egasi_id, email)
);
alter table public.kontaktlar enable row level security;

drop policy if exists kontaktlar_select on public.kontaktlar;
create policy kontaktlar_select on public.kontaktlar
  for select to authenticated using (egasi_id = (select auth.uid()));
drop policy if exists kontaktlar_delete on public.kontaktlar;
create policy kontaktlar_delete on public.kontaktlar
  for delete to authenticated using (egasi_id = (select auth.uid()));
grant select, delete on public.kontaktlar to authenticated;

-- Taklif havolasini bosgan odam: ikkalasi bir-birining kontaktiga
-- tushadi va bir-biriga topshiriq yuborishga ruxsat oladi.
create or replace function public.taklif_orqali_ulanish(p_kod text)
returns text
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_uid    uuid := auth.uid();
  v_email  text := public.joriy_email();
  v_egasi  uuid;
  v_eemail text;
begin
  if v_uid is null then
    raise exception 'Avtorizatsiya talab qilinadi' using errcode = '42501';
  end if;
  select p.id, lower(u.email) into v_egasi, v_eemail
    from public.profiles p join auth.users u on u.id = p.id
   where p.taklif_kodi = btrim(p_kod);
  if v_egasi is null then
    raise exception 'Taklif havolasi noto''g''ri' using errcode = 'P0002';
  end if;
  if v_egasi = v_uid then
    return null;
  end if;

  insert into public.kontaktlar (egasi_id, email) values
    (v_uid, v_eemail), (v_egasi, v_email)
  on conflict do nothing;

  insert into public.topshiriq_ruxsatlari (egasi_id, yuboruvchi_email, holat) values
    (v_uid, v_eemail, 'ruxsat'), (v_egasi, v_email, 'ruxsat')
  on conflict (egasi_id, yuboruvchi_email) do update set holat = 'ruxsat';

  return public.foydalanuvchi_ismi(v_egasi);
end;
$$;

-- Kontaktlar: topshiriq almashganlar + jamoadoshlar + taklif orqali
-- ulanganlar. Ism qoidasi: menga yozgan, jamoadosh yoki taklif orqali
-- ulangan odamning ismi ochiq; men yozganniki — u qabul qilgandan keyin.
create or replace function public.topshiriq_kontaktlari()
returns table (
  email  text,
  ism    text,
  oxirgi timestamptz
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  with men as (
    select auth.uid() as id, public.joriy_email() as email
  ),
  aloqalar as (
    select t.qabul_qiluvchi_email as email,
           bool_or(t.holat in ('qabul', 'tekshiruvda', 'bajarildi')) as ism_ochiq,
           max(t.created_at) as oxirgi
      from public.topshiriqlar t, men
     where t.yuboruvchi_id = men.id
     group by t.qabul_qiluvchi_email
    union all
    select lower(u.email), true, max(t.created_at)
      from public.topshiriqlar t
      join men on t.qabul_qiluvchi_email = men.email
      join auth.users u on u.id = t.yuboruvchi_id
     group by lower(u.email)
    union all
    select lower(u.email), true, max(b.qoshilgan_at)
      from public.jamoa_azolari a
      join men on a.user_id = men.id
      join public.jamoa_azolari b on b.jamoa_id = a.jamoa_id
      join auth.users u on u.id = b.user_id
     group by lower(u.email)
    union all
    select k.email, true, k.created_at
      from public.kontaktlar k, men
     where k.egasi_id = men.id
  ),
  yigma as (
    select a.email, bool_or(a.ism_ochiq) as ism_ochiq, max(a.oxirgi) as oxirgi
      from aloqalar a, men
     where a.email is not null and a.email <> men.email
     group by a.email
  )
  select y.email,
         case when y.ism_ochiq
              then nullif(btrim(coalesce(p.full_name, '')), '')
         end as ism,
         y.oxirgi
    from yigma y
    left join auth.users u on lower(u.email) = y.email
    left join public.profiles p on p.id = u.id
   order by y.oxirgi desc
   limit 200;
$$;

-- Jamoadoshga yozish chegaralarsiz (bloklash ham kerak emas)
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

  select u.id into v_qabul from auth.users u where lower(u.email) = v_email;
  if v_qabul is null then
    return true;
  end if;

  if public.bir_jamoadami(p_yuboruvchi_id, v_qabul) then
    return true;
  end if;

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

-- -------------------------------------------------------------
-- 3. Topshiriq ustunlari: guruh, takror, baho, avtomatik qabul
-- -------------------------------------------------------------
alter table public.topshiriqlar
  add column if not exists guruh_id              uuid,
  add column if not exists takror                text,
  add column if not exists oldingi_id            uuid,
  add column if not exists baho                  smallint,
  add column if not exists avto_qabul            boolean not null default false,
  add column if not exists muddat_eslatildi_at   timestamptz,
  add column if not exists kechikish_bildirildi_at timestamptz;

alter table public.topshiriqlar drop constraint if exists topshiriq_takror_chk;
alter table public.topshiriqlar add constraint topshiriq_takror_chk
  check (takror is null or takror in ('kunlik', 'haftalik', 'oylik'));
alter table public.topshiriqlar drop constraint if exists topshiriq_baho_chk;
alter table public.topshiriqlar add constraint topshiriq_baho_chk
  check (baho is null or baho between 1 and 5);

create index if not exists topshiriqlar_guruh_idx on public.topshiriqlar (guruh_id)
  where guruh_id is not null;

-- -------------------------------------------------------------
-- 4. Qabul qilish — umumiy ichki funksiya
-- -------------------------------------------------------------
-- Qo'lda qabul ham, jamoadagi avtomatik qabul ham shu yerdan o'tadi:
-- ikkalasining natijasi bir xil bo'lishi kafolatlanadi.
create or replace function public._topshiriqni_qabul_et(p_id uuid, p_uid uuid, p_avto boolean)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t      public.topshiriqlar;
  v_papka  uuid;
  v_vazifa uuid;
begin
  select * into v_t from public.topshiriqlar where id = p_id;

  select f.id into v_papka
    from public.folders f
   where f.user_id = p_uid and f.is_inbox
   limit 1;
  if v_papka is null then
    if p_avto then
      return v_t; -- avtomatik qabul bo'lmasa, oddiy "kutilmoqda" qoladi
    end if;
    raise exception 'Kiruvchi papka topilmadi' using errcode = 'P0002';
  end if;

  insert into public.tasks
    (user_id, folder_id, title, description, due_date, due_time, priority)
  values
    (p_uid, v_papka, v_t.sarlavha, v_t.izoh, v_t.muddat, v_t.muddat_vaqt,
     v_t.muhimlik)
  returning id into v_vazifa;

  update public.topshiriqlar
     set holat      = 'qabul',
         vazifa_id  = v_vazifa,
         javob_at   = now(),
         avto_qabul = p_avto
   where id = p_id
  returning * into v_t;
  return v_t;
end;
$$;
revoke all on function public._topshiriqni_qabul_et(uuid, uuid, boolean) from public, anon, authenticated;

create or replace function public.topshiriqni_qabul_qilish(p_id uuid)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t public.topshiriqlar;
begin
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.qabul_qiluvchi_email <> public.joriy_email() then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
  if v_t.holat <> 'kutilmoqda' then
    raise exception 'Topshiriqqa allaqachon javob berilgan' using errcode = 'P0001';
  end if;
  return public._topshiriqni_qabul_et(p_id, auth.uid(), false);
end;
$$;

-- Jamoa ichida: yuborilgan zahoti qabul qilinadi
create or replace function public.tg_topshiriq_avto_qabul()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qabul uuid := public.email_egasi(new.qabul_qiluvchi_email);
begin
  if new.holat = 'kutilmoqda'
     and v_qabul is not null
     and public.bir_jamoadami(new.yuboruvchi_id, v_qabul) then
    perform public._topshiriqni_qabul_et(new.id, v_qabul, true);
  end if;
  return null;
end;
$$;

drop trigger if exists topshiriq_avto_qabul on public.topshiriqlar;
create trigger topshiriq_avto_qabul
  after insert on public.topshiriqlar
  for each row execute function public.tg_topshiriq_avto_qabul();

-- -------------------------------------------------------------
-- 5. Tasdiqlash — baho bilan
-- -------------------------------------------------------------
drop function if exists public.topshiriqni_tasdiqlash(uuid);
create or replace function public.topshiriqni_tasdiqlash(p_id uuid, p_baho smallint default null)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t public.topshiriqlar;
begin
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.yuboruvchi_id <> auth.uid() then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
  if v_t.holat <> 'tekshiruvda' then
    raise exception 'Topshiriq tekshiruvda emas' using errcode = 'P0001';
  end if;
  if p_baho is not null and p_baho not between 1 and 5 then
    raise exception 'Baho 1 dan 5 gacha' using errcode = '22023';
  end if;

  update public.topshiriqlar
     set holat           = 'bajarildi',
         tasdiqlangan_at = now(),
         baho            = p_baho
   where id = p_id
  returning * into v_t;
  return v_t;
end;
$$;
revoke all on function public.topshiriqni_tasdiqlash(uuid, smallint) from public, anon;
grant execute on function public.topshiriqni_tasdiqlash(uuid, smallint) to authenticated;

-- -------------------------------------------------------------
-- 6. Takrorlanuvchi topshiriq
-- -------------------------------------------------------------
-- Bajarilgach (tasdiqlangach) keyingi nusxa o'zi yaratiladi. Jamoada
-- u ham avtomatik qabul qilinadi (insert triggeri).
create or replace function public.tg_topshiriq_takror()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qadam interval;
  v_asos  date;
begin
  if new.holat = 'bajarildi' and old.holat <> 'bajarildi'
     and new.takror is not null
     and new.yuboruvchi_ochirgan_at is null
     -- Shu nusxadan keyingisi allaqachon yaratilgan bo'lsa (masalan,
     -- ijrochi qaytarib, yana bajarsa) — ikkinchisi kerak emas
     and not exists (select 1 from public.topshiriqlar x where x.oldingi_id = new.id)
  then
    v_qadam := case new.takror
                 when 'kunlik'   then interval '1 day'
                 when 'haftalik' then interval '7 days'
                 else interval '1 month' end;
    v_asos := coalesce(new.muddat, current_date);
    -- Kechikib bajarilgan bo'lsa, keyingi muddat o'tmishda qolmasin
    while (v_asos + v_qadam)::date < current_date loop
      v_asos := (v_asos + v_qadam)::date;
    end loop;

    insert into public.topshiriqlar
      (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, izoh, muddat,
       muddat_vaqt, muhimlik, tekshirish, takror, guruh_id, oldingi_id)
    values
      (new.yuboruvchi_id, new.qabul_qiluvchi_email, new.sarlavha, new.izoh,
       (v_asos + v_qadam)::date,
       case when new.muddat is null then null else new.muddat_vaqt end,
       new.muhimlik, new.tekshirish, new.takror, new.guruh_id, new.id);
  end if;
  return null;
end;
$$;

drop trigger if exists topshiriq_takror on public.topshiriqlar;
create trigger topshiriq_takror
  after update of holat on public.topshiriqlar
  for each row execute function public.tg_topshiriq_takror();

create or replace function public.takrorni_toxtatish(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Faqat shu nusxa: u bajarilganda keyingisi yaratilmaydi
  update public.topshiriqlar set takror = null
   where id = p_id and yuboruvchi_id = auth.uid();
  if not found then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
end;
$$;

-- -------------------------------------------------------------
-- 7. Ishtirokchi tekshiruvi (izoh, fayl, tarix uchun)
-- -------------------------------------------------------------
create or replace function public.topshiriq_ishtirokchisimi(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.topshiriqlar t
     where t.id = p_id
       and (t.yuboruvchi_id = auth.uid()
            or t.qabul_qiluvchi_email = public.joriy_email()));
$$;

-- Storage yo'lidan (matn) xavfsiz o'qish: noto'g'ri yo'l — false
create or replace function public.topshiriq_yoli_ishtirokchisimi(p_papka text)
returns boolean
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return public.topshiriq_ishtirokchisimi(p_papka::uuid);
exception when others then
  return false;
end;
$$;

-- -------------------------------------------------------------
-- 8. Izohlar zanjiri
-- -------------------------------------------------------------
create table if not exists public.topshiriq_izohlari (
  id           uuid        primary key default gen_random_uuid(),
  topshiriq_id uuid        not null references public.topshiriqlar (id) on delete cascade,
  muallif_id   uuid        not null references auth.users (id) on delete cascade,
  matn         text,
  fayl_yoli    text,
  fayl_nomi    text,
  fayl_hajmi   integer,
  fayl_turi    text,
  created_at   timestamptz not null default now(),
  constraint izoh_matn_chk check (matn is null or length(matn) <= 4000),
  constraint izoh_bosh_emas_chk check (
    nullif(btrim(coalesce(matn, '')), '') is not null or fayl_yoli is not null),
  -- Fayl faqat shu topshiriqning papkasida bo'lishi shart: boshqa
  -- topshiriqning faylini "izoh" qilib ilib olish mumkin bo'lmasin
  constraint izoh_fayl_yoli_chk check (
    fayl_yoli is null or fayl_yoli like topshiriq_id::text || '/%')
);
create index if not exists topshiriq_izohlari_idx
  on public.topshiriq_izohlari (topshiriq_id, created_at);

alter table public.topshiriq_izohlari enable row level security;

drop policy if exists izohlar_select on public.topshiriq_izohlari;
create policy izohlar_select on public.topshiriq_izohlari
  for select to authenticated
  using (public.topshiriq_ishtirokchisimi(topshiriq_id));

drop policy if exists izohlar_insert on public.topshiriq_izohlari;
create policy izohlar_insert on public.topshiriq_izohlari
  for insert to authenticated
  with check (
    muallif_id = (select auth.uid())
    and public.topshiriq_ishtirokchisimi(topshiriq_id));

drop policy if exists izohlar_delete on public.topshiriq_izohlari;
create policy izohlar_delete on public.topshiriq_izohlari
  for delete to authenticated
  using (muallif_id = (select auth.uid()));

grant select, insert, delete on public.topshiriq_izohlari to authenticated;

-- -------------------------------------------------------------
-- 9. Fayllar (Storage)
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('topshiriq-fayllar', 'topshiriq-fayllar', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

drop policy if exists "topshiriq_fayl_oqish" on storage.objects;
create policy "topshiriq_fayl_oqish" on storage.objects
  for select to authenticated
  using (bucket_id = 'topshiriq-fayllar'
         and public.topshiriq_yoli_ishtirokchisimi((storage.foldername(name))[1]));

drop policy if exists "topshiriq_fayl_yuklash" on storage.objects;
create policy "topshiriq_fayl_yuklash" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'topshiriq-fayllar'
              and public.topshiriq_yoli_ishtirokchisimi((storage.foldername(name))[1]));

drop policy if exists "topshiriq_fayl_ochirish" on storage.objects;
create policy "topshiriq_fayl_ochirish" on storage.objects
  for delete to authenticated
  using (bucket_id = 'topshiriq-fayllar' and owner = auth.uid());

-- -------------------------------------------------------------
-- 10. O'zgarishlar tarixi
-- -------------------------------------------------------------
create table if not exists public.topshiriq_tarixi (
  id           bigint      generated always as identity primary key,
  topshiriq_id uuid        not null references public.topshiriqlar (id) on delete cascade,
  kim_id       uuid,
  hodisa       text        not null,
  izoh         text,
  created_at   timestamptz not null default now()
);
create index if not exists topshiriq_tarixi_idx
  on public.topshiriq_tarixi (topshiriq_id, created_at);

alter table public.topshiriq_tarixi enable row level security;
drop policy if exists tarix_select on public.topshiriq_tarixi;
create policy tarix_select on public.topshiriq_tarixi
  for select to authenticated
  using (public.topshiriq_ishtirokchisimi(topshiriq_id));
grant select on public.topshiriq_tarixi to authenticated;

-- -------------------------------------------------------------
-- 11. Bildirishnomalar navbati
-- -------------------------------------------------------------
create table if not exists public.topshiriq_xabarlari (
  id           bigint      generated always as identity primary key,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  topshiriq_id uuid        references public.topshiriqlar (id) on delete cascade,
  sarlavha     text        not null,
  matn         text        not null,
  yuborildi_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists topshiriq_xabarlari_navbat_idx
  on public.topshiriq_xabarlari (created_at) where yuborildi_at is null;
-- Foydalanuvchilarga ochiq emas — faqat server o'qiydi
alter table public.topshiriq_xabarlari enable row level security;

create or replace function public._xabar_qosh(
  p_user uuid, p_topshiriq uuid, p_sarlavha text, p_matn text)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.topshiriq_xabarlari (user_id, topshiriq_id, sarlavha, matn)
  select p_user, p_topshiriq, p_sarlavha, left(coalesce(p_matn, ''), 300)
   where p_user is not null
     -- O'zimga o'zim haqimda xabar kerak emas
     and p_user is distinct from auth.uid();
$$;
revoke all on function public._xabar_qosh(uuid, uuid, text, text) from public, anon, authenticated;

-- Holat o'zgarishi -> tarix + xabar
create or replace function public.tg_topshiriq_hodisa()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qabul uuid := public.email_egasi(new.qabul_qiluvchi_email);
  v_hodisa text;
begin
  if tg_op = 'INSERT' then
    insert into public.topshiriq_tarixi (topshiriq_id, kim_id, hodisa)
    values (new.id, coalesce(auth.uid(), new.yuboruvchi_id), 'yuborildi');
    return null;
  end if;

  if new.holat is not distinct from old.holat then
    return null;
  end if;

  v_hodisa := case
    when new.holat = 'qabul' and old.holat = 'tekshiruvda'
         and new.qaytarish_sababi is not null then 'qaytarildi'
    when new.holat = 'qabul' and old.holat in ('tekshiruvda', 'bajarildi') then 'qayta_ochildi'
    when new.holat = 'qabul' and new.avto_qabul then 'avto_qabul'
    when new.holat = 'bajarildi' and old.holat = 'tekshiruvda' then 'tasdiqlandi'
    else new.holat end;

  insert into public.topshiriq_tarixi (topshiriq_id, kim_id, hodisa, izoh)
  values (new.id, auth.uid(), v_hodisa,
          case v_hodisa
            when 'qaytarildi'  then new.qaytarish_sababi
            when 'rad'         then new.rad_sababi
            when 'tekshiruvda' then new.topshirish_izohi
            else null end);

  if v_hodisa = 'avto_qabul' then
    perform public._xabar_qosh(v_qabul, new.id,
      'Yangi topshiriq — ' || public.foydalanuvchi_ismi(new.yuboruvchi_id), new.sarlavha);
  elsif v_hodisa = 'tekshiruvda' then
    perform public._xabar_qosh(new.yuboruvchi_id, new.id,
      'Tekshiruvga keldi — ' || public.foydalanuvchi_ismi(v_qabul), new.sarlavha);
  elsif v_hodisa = 'bajarildi' then
    perform public._xabar_qosh(new.yuboruvchi_id, new.id,
      'Bajarildi — ' || public.foydalanuvchi_ismi(v_qabul), new.sarlavha);
  elsif v_hodisa = 'qaytarildi' then
    perform public._xabar_qosh(v_qabul, new.id,
      'Qayta ishlashga qaytarildi', new.sarlavha || ': ' || coalesce(new.qaytarish_sababi, ''));
  elsif v_hodisa = 'tasdiqlandi' then
    perform public._xabar_qosh(v_qabul, new.id, 'Natija tasdiqlandi', new.sarlavha);
  elsif v_hodisa = 'rad' then
    perform public._xabar_qosh(new.yuboruvchi_id, new.id,
      'Rad etildi — ' || public.foydalanuvchi_ismi(v_qabul), new.sarlavha);
  end if;
  return null;
end;
$$;

-- Nom "0" bilan: Postgres triggerlarni nom bo'yicha tartibda ishga
-- tushiradi — "yuborildi" yozuvi avtomatik qabuldan OLDIN tushsin
drop trigger if exists topshiriq_0_hodisa on public.topshiriqlar;
create trigger topshiriq_0_hodisa
  after insert or update of holat on public.topshiriqlar
  for each row execute function public.tg_topshiriq_hodisa();

-- Yangi izoh -> ikkinchi tomonga xabar
create or replace function public.tg_izoh_xabari()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t public.topshiriqlar;
  v_kimga uuid;
begin
  select * into v_t from public.topshiriqlar where id = new.topshiriq_id;
  if new.muallif_id = v_t.yuboruvchi_id then
    v_kimga := public.email_egasi(v_t.qabul_qiluvchi_email);
  else
    v_kimga := v_t.yuboruvchi_id;
  end if;
  perform public._xabar_qosh(v_kimga, v_t.id,
    'Yangi izoh — ' || public.foydalanuvchi_ismi(new.muallif_id),
    coalesce(nullif(btrim(coalesce(new.matn, '')), ''), new.fayl_nomi, v_t.sarlavha));
  return null;
end;
$$;

drop trigger if exists izoh_xabari on public.topshiriq_izohlari;
create trigger izoh_xabari
  after insert on public.topshiriq_izohlari
  for each row execute function public.tg_izoh_xabari();

-- Muddat eslatmalari: Edge Function har daqiqada chaqiradi.
-- Muddat = sana + soat (soat bo'lmasa 18:00), ijrochining vaqt
-- mintaqasida. 2 soat qolganda ijrochiga; o'tib ketsa ikkalasiga.
create or replace function public.topshiriq_muddat_xabarlari()
returns integer
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  r       record;
  v_soni  integer := 0;
begin
  for r in
    select t.*, q.id as qabul_id,
           ((t.muddat + coalesce(t.muddat_vaqt, time '18:00'))::timestamp
              at time zone coalesce(p.timezone, 'Asia/Tashkent')) as muddat_ts
      from public.topshiriqlar t
      left join auth.users q on lower(q.email) = t.qabul_qiluvchi_email
      left join public.profiles p on p.id = q.id
     where t.muddat is not null
       and t.holat in ('kutilmoqda', 'qabul')
       and t.muddat >= current_date - 3
       and (t.muddat_eslatildi_at is null or t.kechikish_bildirildi_at is null)
  loop
    if r.kechikish_bildirildi_at is null and now() > r.muddat_ts then
      perform public._xabar_qosh(r.qabul_id, r.id, 'Muddat o''tdi', r.sarlavha);
      perform public._xabar_qosh(r.yuboruvchi_id, r.id,
        'Kechikdi — ' || coalesce(public.foydalanuvchi_ismi(r.qabul_id), r.qabul_qiluvchi_email),
        r.sarlavha);
      update public.topshiriqlar
         set kechikish_bildirildi_at = now(),
             muddat_eslatildi_at = coalesce(muddat_eslatildi_at, now())
       where id = r.id;
      v_soni := v_soni + 1;
    elsif r.muddat_eslatildi_at is null
          and now() between r.muddat_ts - interval '2 hours' and r.muddat_ts then
      perform public._xabar_qosh(r.qabul_id, r.id, 'Muddat yaqinlashdi', r.sarlavha);
      update public.topshiriqlar set muddat_eslatildi_at = now() where id = r.id;
      v_soni := v_soni + 1;
    end if;
  end loop;
  return v_soni;
end;
$$;

create or replace function public.kutilayotgan_topshiriq_xabarlari()
returns table (
  xabar_id  bigint,
  sarlavha  text,
  matn      text,
  platform  text,
  endpoint  text,
  p256dh    text,
  auth      text,
  fcm_token text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select x.id, x.sarlavha, x.matn,
         s.platform, s.endpoint, s.p256dh, s.auth, s.fcm_token
    from public.topshiriq_xabarlari x
    join public.push_subscriptions s on s.user_id = x.user_id
   where x.yuborildi_at is null
     and x.created_at > now() - interval '1 day'
   order by x.id
   limit 500;
$$;

create or replace function public.topshiriq_xabarlari_yuborildi(p_idlar bigint[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.topshiriq_xabarlari set yuborildi_at = now()
   where id = any(p_idlar);
  -- Eski navbat bazada to'planib qolmasin
  delete from public.topshiriq_xabarlari where created_at < now() - interval '7 days';
$$;

revoke all on function public.topshiriq_muddat_xabarlari() from public, anon, authenticated;
revoke all on function public.kutilayotgan_topshiriq_xabarlari() from public, anon, authenticated;
revoke all on function public.topshiriq_xabarlari_yuborildi(bigint[]) from public, anon, authenticated;
grant execute on function public.topshiriq_muddat_xabarlari() to service_role;
grant execute on function public.kutilayotgan_topshiriq_xabarlari() to service_role;
grant execute on function public.topshiriq_xabarlari_yuborildi(bigint[]) to service_role;

-- -------------------------------------------------------------
-- 12. Ruxsatlar
-- -------------------------------------------------------------
do $$
declare
  f text;
begin
  foreach f in array array[
    'jamoa_yaratish(text)', 'jamoaga_qoshilish(text)', 'jamoadan_chiqish(uuid)',
    'jamoadan_chiqarish(uuid,uuid)', 'jamoani_ochirish(uuid)',
    'jamoa_kodini_yangilash(uuid)', 'jamoa_azolari_royxati()', 'jamoa_taklifi(text)',
    'taklif_orqali_ulanish(text)', 'takrorni_toxtatish(uuid)',
    'topshiriq_ishtirokchisimi(uuid)', 'topshiriq_yoli_ishtirokchisimi(text)',
    'jamoa_azosimi(uuid)', 'jamoa_rahbarimi(uuid)']
  loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
