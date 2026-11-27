-- =============================================================
-- Topshiriqlar, 1-bosqich: tekshiruv, soat, kontaktlar
-- =============================================================
-- Nima o'zgaradi:
--   1. TEKSHIRUV BOSQICHI. Oldin ijrochi vazifani tugatishi bilan
--      topshiriq darhol "bajarildi" bo'lardi — yuboruvchi natijani
--      ko'rmasdan ish yopilardi. Endi oqim:
--        kutilmoqda -> qabul -> tekshiruvda -> bajarildi
--                               \-> (qaytarildi) -> qabul
--      Yuboruvchi har bir topshiriqda tekshiruv kerakmi-yo'qmi
--      o'zi tanlaydi (`tekshirish`). Kerak bo'lmasa — eski oqim.
--   2. IJROCHI TOPSHIRADI izoh bilan ("qildim, natija shu yerda").
--   3. MUDDATDA SOAT. Oldin faqat sana bor edi.
--   4. IZOH VAZIFAGA KO'CHADI. Qabul qilinganda faqat sarlavha,
--      muddat va muhimlik ko'chardi — izoh yo'qolib qolardi.
--   5. KONTAKTLAR: email qayta-qayta yozilmasin, odam ro'yxatdan
--      ismi bilan tanlansin.
--   6. Bildirishnoma navbati: `fcm_push` migratsiyasida
--      `qabul_ochirgan_at` sharti tushib qolgan edi — qaytarildi.

-- -------------------------------------------------------------
-- 1. Ustunlar
-- -------------------------------------------------------------
alter table public.topshiriqlar
  add column if not exists muddat_vaqt      time,
  add column if not exists tekshirish       boolean not null default true,
  add column if not exists topshirish_izohi text,
  add column if not exists topshirilgan_at  timestamptz,
  add column if not exists qaytarish_sababi text,
  add column if not exists tasdiqlangan_at  timestamptz;

-- Mavjud topshiriqlar eski oqim bo'yicha boshlangan — ularga
-- tekshiruv qo'shilsa, yarim yo'lda qoidasi o'zgarib qolardi
update public.topshiriqlar set tekshirish = false
 where created_at < now();

comment on column public.topshiriqlar.muddat_vaqt is
  'Muddatning soati (ixtiyoriy). Faqat muddat sanasi bilan birga ma''noli.';
comment on column public.topshiriqlar.tekshirish is
  'true: ijrochi tugatganda topshiriq "tekshiruvda" ga o''tadi va yuboruvchi tasdiqlaydi.';

alter table public.topshiriqlar
  drop constraint if exists topshiriq_holat_chk;
alter table public.topshiriqlar
  add constraint topshiriq_holat_chk
  check (holat in ('kutilmoqda', 'qabul', 'tekshiruvda', 'rad', 'bajarildi'));

alter table public.topshiriqlar
  drop constraint if exists topshiriq_topshirish_izohi_chk;
alter table public.topshiriqlar
  add constraint topshiriq_topshirish_izohi_chk
  check (topshirish_izohi is null or length(topshirish_izohi) <= 2000);

alter table public.topshiriqlar
  drop constraint if exists topshiriq_qaytarish_chk;
alter table public.topshiriqlar
  add constraint topshiriq_qaytarish_chk
  check (qaytarish_sababi is null or length(qaytarish_sababi) <= 1000);

-- Soat sanasiz ma'nosiz ("har kuni soat 9 da"mi?)
alter table public.topshiriqlar
  drop constraint if exists topshiriq_vaqt_sana_chk;
alter table public.topshiriqlar
  add constraint topshiriq_vaqt_sana_chk
  check (muddat_vaqt is null or muddat is not null);

-- -------------------------------------------------------------
-- 2. Qabul qilish: izoh va soat ham ko'chadi
-- -------------------------------------------------------------
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

  insert into public.tasks
    (user_id, folder_id, title, description, due_date, due_time, priority)
  values
    (v_uid, v_papka, v_t.sarlavha, v_t.izoh, v_t.muddat, v_t.muddat_vaqt,
     v_t.muhimlik)
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
-- 3. Vazifa holati -> topshiriq holati
-- -------------------------------------------------------------
-- Ijrochi vazifani o'z ro'yxatida tugatadimi yoki topshiriqlar
-- sahifasidagi "Topshirish" tugmasini bosadimi — natija bir xil.
create or replace function public.tg_topshiriq_holatini_kuzat()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.status = 'done' and coalesce(old.status, '') <> 'done' then
    update public.topshiriqlar
       set holat            = case when tekshirish then 'tekshiruvda'
                                   else 'bajarildi' end,
           topshirilgan_at  = now(),
           tasdiqlangan_at  = case when tekshirish then null else now() end,
           qaytarish_sababi = null
     where vazifa_id = new.id and holat = 'qabul';
  elsif new.status <> 'done' and coalesce(old.status, '') = 'done' then
    -- Ijrochi o'zi qaytarsa topshiriq ham ish holatiga qaytadi
    update public.topshiriqlar
       set holat           = 'qabul',
           topshirilgan_at = null,
           tasdiqlangan_at = null
     where vazifa_id = new.id and holat in ('tekshiruvda', 'bajarildi');
  end if;
  return new;
end;
$$;

-- -------------------------------------------------------------
-- 4. Ijrochi: topshirish (izoh bilan)
-- -------------------------------------------------------------
-- Izoh avval yoziladi, keyin vazifa tugatiladi — trigger holatni
-- o'zi o'zgartiradi. Vazifa o'chirilgan bo'lsa ham topshirish
-- mumkin bo'lsin: holat to'g'ridan-to'g'ri yangilanadi.
create or replace function public.topshiriqni_topshirish(
  p_id   uuid,
  p_izoh text
)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t     public.topshiriqlar;
  v_email text := public.joriy_email();
  v_soni  integer;
begin
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.qabul_qiluvchi_email <> v_email then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;

  if v_t.holat <> 'qabul' then
    raise exception 'Topshiriq ish holatida emas' using errcode = 'P0001';
  end if;

  update public.topshiriqlar
     set topshirish_izohi = nullif(btrim(coalesce(p_izoh, '')), '')
   where id = p_id;

  update public.tasks
     set status = 'done', progress = 100
   where id = v_t.vazifa_id
     and deleted_at is null
     and status <> 'done';
  get diagnostics v_soni = row_count;

  if v_soni = 0 then
    update public.topshiriqlar
       set holat            = case when tekshirish then 'tekshiruvda'
                                   else 'bajarildi' end,
           topshirilgan_at  = now(),
           tasdiqlangan_at  = case when tekshirish then null else now() end,
           qaytarish_sababi = null
     where id = p_id and holat = 'qabul';
  end if;

  select * into v_t from public.topshiriqlar where id = p_id;
  return v_t;
end;
$$;

-- -------------------------------------------------------------
-- 5. Yuboruvchi: tasdiqlash
-- -------------------------------------------------------------
create or replace function public.topshiriqni_tasdiqlash(p_id uuid)
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

  update public.topshiriqlar
     set holat           = 'bajarildi',
         tasdiqlangan_at = now()
   where id = p_id
  returning * into v_t;

  return v_t;
end;
$$;

-- -------------------------------------------------------------
-- 6. Yuboruvchi: qayta ishlashga qaytarish (sabab bilan)
-- -------------------------------------------------------------
-- Holat AVVAL 'qabul' ga o'tkaziladi, keyin vazifa ochiladi.
-- Tartib muhim: aks holda vazifa triggeri 'tekshiruvda' qatorini
-- topib, sababni o'chirib yuborardi.
create or replace function public.topshiriqni_qaytarish(
  p_id    uuid,
  p_sabab text
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

  if v_t.holat <> 'tekshiruvda' then
    raise exception 'Topshiriq tekshiruvda emas' using errcode = 'P0001';
  end if;

  update public.topshiriqlar
     set holat            = 'qabul',
         qaytarish_sababi = nullif(btrim(coalesce(p_sabab, '')), ''),
         topshirilgan_at  = null
   where id = p_id;

  -- Ijrochining ro'yxatida vazifa yana ochiq ishlar qatoriga
  -- qaytadi — qayta ishlashni eslatib turadi
  update public.tasks
     set status = 'in_progress', progress = 0
   where id = v_t.vazifa_id
     and deleted_at is null
     and status = 'done';

  select * into v_t from public.topshiriqlar where id = p_id;
  return v_t;
end;
$$;

revoke all on function public.topshiriqni_topshirish(uuid, text) from public, anon;
revoke all on function public.topshiriqni_tasdiqlash(uuid)       from public, anon;
revoke all on function public.topshiriqni_qaytarish(uuid, text)  from public, anon;
grant execute on function public.topshiriqni_topshirish(uuid, text) to authenticated;
grant execute on function public.topshiriqni_tasdiqlash(uuid)       to authenticated;
grant execute on function public.topshiriqni_qaytarish(uuid, text)  to authenticated;

-- -------------------------------------------------------------
-- 7. Tafsilotlar: 'tekshiruvda' ham qabul qilingan hisoblanadi
-- -------------------------------------------------------------
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
    case when k.yuboruvchi_id = men.id then v.status else null end,
    case when k.yuboruvchi_id = men.id then v.progress else null end,
    case
      when k.yuboruvchi_id = men.id
           and k.holat in ('qabul', 'tekshiruvda', 'bajarildi')
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

-- -------------------------------------------------------------
-- 8. Kontaktlar
-- -------------------------------------------------------------
-- Alohida jadval kerak emas: kim bilan topshiriq almashgan bo'lsam,
-- o'sha kontakt. Ism ko'rsatish qoidasi `topshiriq_tafsilotlari`
-- bilan bir xil (maxfiylik):
--   * menga yozgan odamning ismi — doim;
--   * men yozgan odamning ismi — faqat u kamida bitta topshiriqni
--     qabul qilgan bo'lsa. Aks holda tasodifiy emaillarga yozib,
--     ismlarni yig'ib olish mumkin bo'lardi.
-- O'chirilgan topshiriqlar ham hisobga olinadi: ro'yxatni tozalash
-- odamni kontaktlardan o'chirish degani emas.
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
    -- Men yozganlar
    select t.qabul_qiluvchi_email as email,
           bool_or(t.holat in ('qabul', 'tekshiruvda', 'bajarildi')) as ism_ochiq,
           max(t.created_at) as oxirgi
      from public.topshiriqlar t, men
     where t.yuboruvchi_id = men.id
     group by t.qabul_qiluvchi_email
    union all
    -- Menga yozganlar
    select lower(u.email), true, max(t.created_at)
      from public.topshiriqlar t
      join men on t.qabul_qiluvchi_email = men.email
      join auth.users u on u.id = t.yuboruvchi_id
     group by lower(u.email)
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
   limit 50;
$$;

comment on function public.topshiriq_kontaktlari() is
  'Topshiriq almashilgan odamlar: email, (ruxsat bo''lsa) ism, oxirgi aloqa.';

revoke all on function public.topshiriq_kontaktlari() from public, anon;
grant execute on function public.topshiriq_kontaktlari() to authenticated;

-- -------------------------------------------------------------
-- 9. Bildirishnoma navbati: o'chirilganlarga yuborilmasin
-- -------------------------------------------------------------
-- Imzo `fcm_push` dagi bilan bir xil — `create or replace` ACL'ni
-- saqlaydi, service_role ruxsati joyida qoladi.
create or replace function public.kutilayotgan_topshiriqlar()
returns table (
  topshiriq_id uuid,
  sarlavha     text,
  yuboruvchi   text,
  platform     text,
  endpoint     text,
  p256dh       text,
  auth         text,
  fcm_token    text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select t.id,
         t.sarlavha,
         coalesce(p.full_name, u.email, '') as yuboruvchi,
         s.platform, s.endpoint, s.p256dh, s.auth, s.fcm_token
    from public.topshiriqlar t
    join auth.users qab
      on lower(qab.email) = t.qabul_qiluvchi_email
    join public.push_subscriptions s
      on s.user_id = qab.id
    left join auth.users u on u.id = t.yuboruvchi_id
    left join public.profiles p on p.id = t.yuboruvchi_id
   where t.holat = 'kutilmoqda'
     and t.bildirildi_at is null
     and t.qabul_ochirgan_at is null
     and t.created_at > now() - interval '3 days'
$$;
