-- Tanishuv (onboarding) holati
--
-- Yangi foydalanuvchi birinchi kirganda kutib olish ekranlari va
-- "Tanishuv" mashq papkasi ko'rsatiladi. Qayerga yetgani hisobga
-- bog'lanadi: telefonda boshlagan odam kompyuterda yana boshidan
-- ko'rmasligi kerak.
--
-- jsonb ataylab: darslar ro'yxati vaqt o'tib o'zgaradi, har bir
-- yangi dars uchun migratsiya yozish ortiqcha bo'lardi.
alter table public.profiles
  add column if not exists onboarding jsonb not null default '{}'::jsonb;

comment on column public.profiles.onboarding is
  'Tanishuv holati: kutib olish, maqsad, mashq papkasi, bajarilgan darslar, ko''rilgan maslahatlar.';

-- Ilovani allaqachon ishlatayotganlarga kutib olish chiqmasin —
-- ular uni Yo'riqnoma sahifasidan istalgan payt qayta boshlay oladi.
--
-- "Ishlatayotgan" = tanishuv chiqishidan OLDIN kamida bitta vazifa
-- yozgan. Hamma profilni belgilash xato bo'lardi: ro'yxatdan o'tib,
-- hali hech narsa yozmagan odam aynan tanishuvga muhtoj, sinov
-- akkauntlari esa kutib olishni umuman ko'rmay qolardi.
update public.profiles p
  set onboarding = '{"v":1,"eski":true}'::jsonb
  where p.onboarding = '{}'::jsonb
    and exists (
      select 1
        from public.tasks t
       where t.user_id = p.id
         and t.created_at < timestamptz '2026-11-27 00:00:00+05'
    );
