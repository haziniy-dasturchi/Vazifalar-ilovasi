-- Sozlamalar: profil rasmi va yon panel tartibi
--
-- Ikkita narsa qo'shiladi:
--
-- 1. `avatarlar` storage bucket — foydalanuvchi o'z rasmini yuklashi
--    uchun. Google bilan kirganlarda avatar allaqachon bor, lekin u
--    Google hisobiga bog'langan va o'zgartirib bo'lmaydi.
--
-- 2. `profiles.sidebar_order` — yon paneldagi asosiy bo'limlar tartibi.
--    Qurilmaga emas, hisobga bog'lanadi: odam telefonda ham,
--    kompyuterda ham bir xil tartibni ko'rishi kerak.

-- -------------------------------------------------------------
-- 1. Yon panel tartibi
-- -------------------------------------------------------------
-- Bo'sh massiv = "sukut bo'yicha tartib". Nega bo'sh qoldiriladi:
-- kelajakda yangi bo'lim qo'shilsa, u avtomatik ro'yxatga tushadi.
-- Agar bu yerga to'liq ro'yxat yozib qo'yilsa, eski foydalanuvchilar
-- yangi bo'limni umuman ko'rmay qolardi.
alter table public.profiles
  add column if not exists sidebar_order text[] not null default '{}';

comment on column public.profiles.sidebar_order is
  'Yon paneldagi asosiy bo''limlar tartibi (yo''l kalitlari). Bo''sh = sukut tartib.';

-- -------------------------------------------------------------
-- 2. Avatar uchun storage bucket
-- -------------------------------------------------------------
-- public = true: rasm <img src> orqali to'g'ridan-to'g'ri ko'rsatiladi.
-- Maxfiy ma'lumot emas, imzolangan havola esa har safar so'rov talab
-- qilardi va offline'da ishlamasdi.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatarlar',
  'avatarlar',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Fayl yo'li: "<user_id>/<nom>" — birinchi papka egasini belgilaydi.
-- Shu qoida tufayli bitta tekshiruv bilan hamma amal himoyalanadi.
drop policy if exists "avatarlar_hammaga_korinadi" on storage.objects;
create policy "avatarlar_hammaga_korinadi" on storage.objects
  for select
  using (bucket_id = 'avatarlar');

drop policy if exists "avatarlar_ozini_yuklaydi" on storage.objects;
create policy "avatarlar_ozini_yuklaydi" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatarlar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatarlar_ozini_yangilaydi" on storage.objects;
create policy "avatarlar_ozini_yangilaydi" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatarlar'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatarlar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatarlar_ozini_ochiradi" on storage.objects;
create policy "avatarlar_ozini_ochiradi" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatarlar'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
