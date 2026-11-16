-- Interfeys tili
--
-- Mavzu kabi, til ham hisobga bog'lanadi: odam telefonda tanlagan til
-- kompyuterda ham amal qilishi kerak.
--
-- Qiymat tekshirilmaydi (CHECK yo'q) ataylab: yangi til qo'shilganda
-- baza migratsiyasi ham talab qilinsa, oddiy ish og'irlashadi. Noma'lum
-- qiymat kelsa, ilova o'zbekchaga qaytadi.

alter table public.profiles
  add column if not exists lang text not null default 'uz';

comment on column public.profiles.lang is
  'Interfeys tili: uz | en | ru. Noma''lum qiymatda ilova uz ga qaytadi.';
