-- =============================================================
-- Native push (FCM) uchun push_subscriptions kengaytirildi
-- =============================================================
-- Hozirgacha bu jadval faqat Web Push'ga mo'ljallangan edi
-- (endpoint/p256dh/auth — barchasi NOT NULL). Capacitor ilovasida
-- (Android/iOS) Web Push umuman ishlamaydi — u yerda Firebase
-- Cloud Messaging qurilma tokeni kerak.
--
-- Bitta jadvalda ikkala turni saqlaymiz: `platform` qaysi yo'l
-- ekanini belgilaydi, CHECK esa noto'g'ri kombinatsiyani (masalan,
-- platform='android' lekin fcm_token bo'sh) bazada bloklaydi —
-- aks holda Edge Function xatoni faqat ishlash vaqtida topardi.

-- -------------------------------------------------------------
-- 1. Ustunlar
-- -------------------------------------------------------------
alter table public.push_subscriptions
  alter column endpoint drop not null,
  alter column p256dh drop not null,
  alter column auth drop not null;

alter table public.push_subscriptions
  add column platform text not null default 'web',
  add column fcm_token text;

alter table public.push_subscriptions
  add constraint push_subscriptions_platform_check
  check (platform in ('web', 'android', 'ios'));

comment on column public.push_subscriptions.platform is
  'Qaysi yo''l orqali yuboriladi: web (Web Push) yoki android/ios (FCM).';
comment on column public.push_subscriptions.fcm_token is
  'Firebase qurilma tokeni. Faqat platform android/ios da to''ldiriladi.';

-- platform'ga mos ustunlar to'ldirilganini bazada kafolatlaymiz
alter table public.push_subscriptions
  add constraint push_subscriptions_platform_data_check
  check (
    (platform = 'web'
      and endpoint is not null and p256dh is not null and auth is not null
      and fcm_token is null)
    or
    (platform in ('android', 'ios')
      and fcm_token is not null
      and endpoint is null and p256dh is null and auth is null)
  );

-- Bir qurilma tokeni = bitta yozuv (endpoint kabi). NULL'lar bu yerda
-- cheklovga kirmaydi, shuning uchun web qatorlar (fcm_token=null)
-- bir-biriga xalaqit bermaydi.
create unique index push_subscriptions_fcm_token_key
  on public.push_subscriptions (fcm_token)
  where fcm_token is not null;

-- -------------------------------------------------------------
-- 2. RPC'lar: platform/fcm_token ham qaytarilsin
-- -------------------------------------------------------------
-- Imzo o'zgaradi (yangi ustunlar qo'shiladi) — shuning uchun oldin
-- eskisini o'chirish kerak, Postgres RETURNS TABLE'ni o'zgartirishga
-- CREATE OR REPLACE orqali yo'l qo'ymaydi.
drop function if exists public.kutilayotgan_eslatmalar();

create function public.kutilayotgan_eslatmalar()
returns table (
  task_id   uuid,
  user_id   uuid,
  sarlavha  text,
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
  select t.id, t.user_id, t.title,
         s.platform, s.endpoint, s.p256dh, s.auth, s.fcm_token
  from public.tasks t
  join public.profiles p on p.id = t.user_id
  join public.push_subscriptions s on s.user_id = t.user_id
  where t.status <> 'done'
    and t.deleted_at is null
    and t.due_date is not null
    and t.due_time is not null
    and t.notified_at is null
    and ((t.due_date + t.due_time) at time zone p.timezone) <= now()
    and ((t.due_date + t.due_time) at time zone p.timezone) > now() - interval '1 hour'
$$;

-- DIQQAT: `drop function` + `create function` eski ACL'ni (ya'ni oldingi
-- GRANT/REVOKE holatini) tashlab yuboradi — shuning uchun service_role'ga
-- aniq ruxsat berish kerak, aks holda Edge Function "permission denied"
-- oladi (xuddi shu sabab `kutilayotgan_topshiriqlar()` da ham bor edi).
revoke all on function public.kutilayotgan_eslatmalar() from public, anon, authenticated;
grant execute on function public.kutilayotgan_eslatmalar() to service_role;

drop function if exists public.kutilayotgan_topshiriqlar();

create function public.kutilayotgan_topshiriqlar()
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
     -- Juda eski topshiriq uchun bildirishnoma yuborish ma'nosiz
     and t.created_at > now() - interval '3 days'
$$;

revoke all on function public.kutilayotgan_topshiriqlar() from public, anon, authenticated;
grant execute on function public.kutilayotgan_topshiriqlar() to service_role;
