-- =============================================================
-- Topshiriqlar: soddalashtirish (foydalanuvchi talabi, 24-noyabr)
-- =============================================================
--   1. "Qabul qilish / rad etish" bosqichi YO'Q. Topshiriq yuborilishi
--      bilan ijrochining Kiruvchi papkasiga tushadi. Tekshirish faqat
--      oxirida: yuboruvchi natijani qabul qiladi yoki qaytaradi.
--   2. Boshlanish sanasi: "qachondan" (vazifaning `due_date` i) va
--      "qachongacha" (`deadline`). Oldin boshlanish doim "hozir" edi.
--   3. Tahrirlash: yuboruvchi topshiriqni o'zgartira oladi — ijrochi
--      ro'yxatidagi vazifa ham yangilanadi.
--   4. O'qilmagan xabarlar: chatdagi yangi xabarlar va hali ochilmagan
--      topshiriqlar soni (menyu belgisi va kartadagi raqam uchun).
--
-- Spamga qarshi: endi "javobsiz" topshiriq to'planmaydi, shuning uchun
-- cheklov ochiq topshiriqlar soniga qo'yiladi (begonadan ko'pi bilan
-- 20 ta). Qabul qiluvchi istalgan payt bloklashi mumkin.

-- -------------------------------------------------------------
-- 1. Boshlanish sanasi
-- -------------------------------------------------------------
alter table public.topshiriqlar
  add column if not exists boshlanish date;

alter table public.topshiriqlar drop constraint if exists topshiriq_boshlanish_chk;
alter table public.topshiriqlar add constraint topshiriq_boshlanish_chk
  check (boshlanish is null or muddat is null or boshlanish <= muddat);

-- -------------------------------------------------------------
-- 2. Qabul — vazifaga to'g'ri sanalar bilan
-- -------------------------------------------------------------
-- boshlanish -> due_date (qaysi kuni ishlanadi, "Bugun"da shu kuni
-- chiqadi), muddat -> deadline (kechiktirib bo'lmas chegara).
-- Boshlanish berilmasa, avvalgidek muddat kuni rejalashtiriladi.
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
      return v_t;
    end if;
    raise exception 'Kiruvchi papka topilmadi' using errcode = 'P0002';
  end if;

  insert into public.tasks
    (user_id, folder_id, title, description, due_date, due_time, deadline, priority)
  values
    (p_uid, v_papka, v_t.sarlavha, v_t.izoh,
     coalesce(v_t.boshlanish, v_t.muddat),
     case when v_t.boshlanish is null or v_t.boshlanish = v_t.muddat
          then v_t.muddat_vaqt end,
     v_t.muddat,
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

-- Har qanday topshiriq yuborilishi bilan qabul qilinadi (jamoa shart emas)
create or replace function public.tg_topshiriq_avto_qabul()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qabul uuid := public.email_egasi(new.qabul_qiluvchi_email);
begin
  if new.holat = 'kutilmoqda' and v_qabul is not null then
    perform public._topshiriqni_qabul_et(new.id, v_qabul, true);
  end if;
  return null;
end;
$$;

-- Hali ro'yxatdan o'tmagan odamga yuborilgan topshiriqlar: u kirib,
-- Kiruvchi papkasi yaratilishi bilan hammasi qabul qilinadi
create or replace function public.tg_kutayotgan_topshiriqlarni_qabul()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_email text;
  r       record;
begin
  if not new.is_inbox then
    return null;
  end if;
  select lower(u.email) into v_email from auth.users u where u.id = new.user_id;
  for r in
    select id from public.topshiriqlar
     where qabul_qiluvchi_email = v_email and holat = 'kutilmoqda'
  loop
    perform public._topshiriqni_qabul_et(r.id, new.user_id, true);
  end loop;
  return null;
end;
$$;

drop trigger if exists kutayotgan_topshiriqlarni_qabul on public.folders;
create trigger kutayotgan_topshiriqlarni_qabul
  after insert on public.folders
  for each row execute function public.tg_kutayotgan_topshiriqlarni_qabul();

-- Hozir javob kutib turganlari ham shu zahoti qabul qilinadi
do $$
declare
  r record;
begin
  for r in
    select t.id, u.id as uid
      from public.topshiriqlar t
      join auth.users u on lower(u.email) = t.qabul_qiluvchi_email
     where t.holat = 'kutilmoqda'
       and exists (select 1 from public.folders f where f.user_id = u.id and f.is_inbox)
  loop
    perform public._topshiriqni_qabul_et(r.id, r.uid, true);
  end loop;
end $$;

-- -------------------------------------------------------------
-- 3. Kim yoza oladi: blok + begonadan ochiq topshiriqlar chegarasi
-- -------------------------------------------------------------
create or replace function public.topshiriq_ochiq_chegarasi()
returns integer language sql immutable as $$ select 20 $$;

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
  v_ochiq    integer;
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

  select count(*) into v_ochiq
    from public.topshiriqlar t
   where t.yuboruvchi_id = p_yuboruvchi_id
     and t.qabul_qiluvchi_email = v_email
     and t.holat in ('kutilmoqda', 'qabul', 'tekshiruvda');
  return v_ochiq < public.topshiriq_ochiq_chegarasi();
end;
$$;

-- -------------------------------------------------------------
-- 4. Tahrirlash
-- -------------------------------------------------------------
create or replace function public.topshiriqni_tahrirlash(
  p_id          uuid,
  p_sarlavha    text,
  p_izoh        text,
  p_boshlanish  date,
  p_muddat      date,
  p_muddat_vaqt time,
  p_muhimlik    smallint
)
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
  if v_t.holat in ('bajarildi', 'rad') then
    raise exception 'Yopilgan topshiriqni o''zgartirib bo''lmaydi' using errcode = 'P0001';
  end if;

  update public.topshiriqlar
     set sarlavha    = btrim(p_sarlavha),
         izoh        = nullif(btrim(coalesce(p_izoh, '')), ''),
         boshlanish  = p_boshlanish,
         muddat      = p_muddat,
         muddat_vaqt = case when p_muddat is null then null else p_muddat_vaqt end,
         muhimlik    = coalesce(p_muhimlik, muhimlik),
         -- Muddat o'zgardi — eslatmalar qaytadan ishlasin
         muddat_eslatildi_at     = case when muddat is distinct from p_muddat
                                         or muddat_vaqt is distinct from p_muddat_vaqt
                                        then null else muddat_eslatildi_at end,
         kechikish_bildirildi_at = case when muddat is distinct from p_muddat
                                         or muddat_vaqt is distinct from p_muddat_vaqt
                                        then null else kechikish_bildirildi_at end
   where id = p_id
  returning * into v_t;

  -- Ijrochining ro'yxatidagi vazifa ham yangilanadi
  update public.tasks
     set title       = v_t.sarlavha,
         description = v_t.izoh,
         due_date    = coalesce(v_t.boshlanish, v_t.muddat),
         due_time    = case when v_t.boshlanish is null or v_t.boshlanish = v_t.muddat
                            then v_t.muddat_vaqt end,
         deadline    = v_t.muddat,
         priority    = v_t.muhimlik
   where id = v_t.vazifa_id
     and deleted_at is null;

  insert into public.topshiriq_tarixi (topshiriq_id, kim_id, hodisa)
  values (p_id, auth.uid(), 'tahrirlandi');

  perform public._xabar_qosh(public.email_egasi(v_t.qabul_qiluvchi_email), v_t.id,
    'Topshiriq o''zgartirildi — ' || public.foydalanuvchi_ismi(v_t.yuboruvchi_id),
    v_t.sarlavha);

  return v_t;
end;
$$;
revoke all on function public.topshiriqni_tahrirlash(uuid, text, text, date, date, time, smallint) from public, anon;
grant execute on function public.topshiriqni_tahrirlash(uuid, text, text, date, date, time, smallint) to authenticated;

-- -------------------------------------------------------------
-- 5. Ko'rilganlik: o'qilmagan xabarlar va yangi topshiriqlar
-- -------------------------------------------------------------
create table if not exists public.topshiriq_korilgan (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  topshiriq_id uuid        not null references public.topshiriqlar (id) on delete cascade,
  korilgan_at  timestamptz not null default now(),
  primary key (user_id, topshiriq_id)
);
alter table public.topshiriq_korilgan enable row level security;
-- To'g'ridan-to'g'ri kirish yo'q — faqat quyidagi funksiyalar

-- Hozirgi hamma narsa "o'qilgan" deb boshlanadi: aks holda eski
-- xabarlar birdan "yangi" bo'lib, raqamlar ma'nosiz katta chiqardi
insert into public.topshiriq_korilgan (user_id, topshiriq_id)
select t.yuboruvchi_id, t.id from public.topshiriqlar t
union
select u.id, t.id
  from public.topshiriqlar t
  join auth.users u on lower(u.email) = t.qabul_qiluvchi_email
on conflict do nothing;

create or replace function public.topshiriq_korildi(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.topshiriq_ishtirokchisimi(p_id) then
    return;
  end if;
  insert into public.topshiriq_korilgan (user_id, topshiriq_id, korilgan_at)
  values (auth.uid(), p_id, now())
  on conflict (user_id, topshiriq_id) do update set korilgan_at = now();
end;
$$;

-- Har bir topshiriq bo'yicha: boshqalar yozgan o'qilmagan xabarlar
-- soni va (ijrochi uchun) topshiriq hali umuman ochilmaganmi
create or replace function public.topshiriq_yangiliklari()
returns table (
  topshiriq_id   uuid,
  yangi_xabarlar integer,
  ochilmagan     boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with men as (
    select auth.uid() as id, public.joriy_email() as email
  ),
  meniki as (
    select t.id, t.qabul_qiluvchi_email, t.yuboruvchi_id
      from public.topshiriqlar t, men
     where (t.yuboruvchi_id = men.id and t.yuboruvchi_ochirgan_at is null)
        or (t.qabul_qiluvchi_email = men.email and t.qabul_ochirgan_at is null)
  )
  select m.id,
         (select count(*)::int
            from public.topshiriq_izohlari i
           where i.topshiriq_id = m.id
             and i.muallif_id <> men.id
             and i.created_at > coalesce(k.korilgan_at, '-infinity'::timestamptz)),
         (m.qabul_qiluvchi_email = men.email and k.korilgan_at is null)
    from meniki m
    cross join men
    left join public.topshiriq_korilgan k
      on k.topshiriq_id = m.id and k.user_id = men.id;
$$;

revoke all on function public.topshiriq_korildi(uuid) from public, anon;
revoke all on function public.topshiriq_yangiliklari() from public, anon;
grant execute on function public.topshiriq_korildi(uuid) to authenticated;
grant execute on function public.topshiriq_yangiliklari() to authenticated;

-- Yozgan odam o'z xabarini "o'qigan" — yozish payti ko'rilgan bo'ladi
create or replace function public.tg_izoh_korildi()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.topshiriq_korilgan (user_id, topshiriq_id, korilgan_at)
  values (new.muallif_id, new.topshiriq_id, now())
  on conflict (user_id, topshiriq_id) do update set korilgan_at = now();
  return null;
end;
$$;
drop trigger if exists izoh_korildi on public.topshiriq_izohlari;
create trigger izoh_korildi
  after insert on public.topshiriq_izohlari
  for each row execute function public.tg_izoh_korildi();

-- Yuboruvchi o'z topshirig'ini yaratganda ko'rgan bo'ladi
create or replace function public.tg_topshiriq_yuboruvchi_kordi()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.topshiriq_korilgan (user_id, topshiriq_id)
  values (new.yuboruvchi_id, new.id)
  on conflict do nothing;
  return null;
end;
$$;
drop trigger if exists topshiriq_yuboruvchi_kordi on public.topshiriqlar;
create trigger topshiriq_yuboruvchi_kordi
  after insert on public.topshiriqlar
  for each row execute function public.tg_topshiriq_yuboruvchi_kordi();

-- -------------------------------------------------------------
-- 6. Bildirishnoma bosilganda — aynan o'sha topshiriq ochilsin
-- -------------------------------------------------------------
drop function if exists public.kutilayotgan_topshiriq_xabarlari();
create function public.kutilayotgan_topshiriq_xabarlari()
returns table (
  xabar_id     bigint,
  topshiriq_id uuid,
  sarlavha     text,
  matn         text,
  platform     text,
  endpoint     text,
  p256dh       text,
  auth         text,
  fcm_token    text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select x.id, x.topshiriq_id, x.sarlavha, x.matn,
         s.platform, s.endpoint, s.p256dh, s.auth, s.fcm_token
    from public.topshiriq_xabarlari x
    join public.push_subscriptions s on s.user_id = x.user_id
   where x.yuborildi_at is null
     and x.created_at > now() - interval '1 day'
   order by x.id
   limit 500;
$$;
revoke all on function public.kutilayotgan_topshiriq_xabarlari() from public, anon, authenticated;
grant execute on function public.kutilayotgan_topshiriq_xabarlari() to service_role;

-- Avtomatik qabul endi hammaga: xabar matni jamoaga bog'liq emas
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

  -- Avtomatik qabul — alohida tarix yozuvi kerak emas ("yuborildi"
  -- yetarli), faqat ijrochiga xabar
  if v_hodisa <> 'avto_qabul' then
    insert into public.topshiriq_tarixi (topshiriq_id, kim_id, hodisa, izoh)
    values (new.id, auth.uid(), v_hodisa,
            case v_hodisa
              when 'qaytarildi'  then new.qaytarish_sababi
              when 'rad'         then new.rad_sababi
              when 'tekshiruvda' then new.topshirish_izohi
              else null end);
  end if;

  if v_hodisa = 'avto_qabul' then
    perform public._xabar_qosh(v_qabul, new.id,
      'Yangi topshiriq — ' || public.foydalanuvchi_ismi(new.yuboruvchi_id), new.sarlavha);
  elsif v_hodisa = 'tekshiruvda' then
    perform public._xabar_qosh(new.yuboruvchi_id, new.id,
      'Bajarildi, tekshiring — ' || public.foydalanuvchi_ismi(v_qabul), new.sarlavha);
  elsif v_hodisa = 'bajarildi' then
    perform public._xabar_qosh(new.yuboruvchi_id, new.id,
      'Bajarildi — ' || public.foydalanuvchi_ismi(v_qabul), new.sarlavha);
  elsif v_hodisa = 'qaytarildi' then
    perform public._xabar_qosh(v_qabul, new.id,
      'Qayta ishlashga qaytarildi', new.sarlavha || ': ' || coalesce(new.qaytarish_sababi, ''));
  elsif v_hodisa = 'tasdiqlandi' then
    perform public._xabar_qosh(v_qabul, new.id, 'Natija qabul qilindi', new.sarlavha);
  end if;
  return null;
end;
$$;

-- -------------------------------------------------------------
-- 7. Tafsilotlar: ijrochi ham o'z vazifasining holatini ko'radi
-- -------------------------------------------------------------
-- Karta holati ("Yangi" / "Jarayonda") vazifaning haqiqiy holatiga
-- qarab chiqadi. Ijrochi uchun bu O'Z vazifasi — maxfiylik muammosi
-- yo'q. Yuboruvchiga avvalgidek faqat holat va foiz ko'rinadi.
create or replace function public.topshiriq_tafsilotlari()
returns table (
  topshiriq_id  uuid,
  qarshi_ism    text,
  qarshi_email  text,
  vazifa_holati text,
  foiz          smallint,
  ochirilganmi  boolean
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  with men as (
    select auth.uid() as id, public.joriy_email() as email
  ),
  meniki as (
    select t.*
      from public.topshiriqlar t, men
     where t.yuboruvchi_id = men.id
        or t.qabul_qiluvchi_email = men.email
  )
  select
    k.id,
    case
      when k.qabul_qiluvchi_email = men.email
        then nullif(btrim(coalesce(p_yub.full_name, u_yub.email, '')), '')
      when k.yuboruvchi_id = men.id
           and k.holat in ('qabul', 'tekshiruvda', 'bajarildi')
        then nullif(btrim(coalesce(p_qab.full_name, u_qab.email, '')), '')
      else null
    end as qarshi_ism,
    case
      when k.qabul_qiluvchi_email = men.email then lower(u_yub.email)
      else k.qabul_qiluvchi_email
    end as qarshi_email,
    case when v.deleted_at is null then v.status end,
    case when v.deleted_at is null then v.progress end,
    case
      when k.holat in ('qabul', 'tekshiruvda', 'bajarildi')
        then (v.id is null or v.deleted_at is not null)
      else false
    end as ochirilganmi
  from meniki k
  cross join men
  left join auth.users     u_yub on u_yub.id = k.yuboruvchi_id
  left join public.profiles p_yub on p_yub.id = k.yuboruvchi_id
  left join auth.users     u_qab on lower(u_qab.email) = k.qabul_qiluvchi_email
  left join public.profiles p_qab on p_qab.id = u_qab.id
  left join public.tasks    v     on v.id = k.vazifa_id;
$$;
