-- =============================================================
-- Reaksiyalarga yana ikkitasi: jilmayish 😁 va qah-qah 😂
--
-- Faqat ruxsat etilgan turlar ro'yxati kengayadi — mavjud
-- reaksiyalar o'zgarmaydi.
-- =============================================================

alter table public.topshiriq_reaksiyalari
  drop constraint if exists reaksiya_turi_chk;

alter table public.topshiriq_reaksiyalari
  add constraint reaksiya_turi_chk
  check (reaksiya in ('zor', 'qarsak', 'jilmayish', 'qahqah', 'xafa', 'kelishuv'));
