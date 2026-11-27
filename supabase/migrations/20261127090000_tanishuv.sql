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
update public.profiles
  set onboarding = '{"v":1,"eski":true}'::jsonb
  where onboarding = '{}'::jsonb;
