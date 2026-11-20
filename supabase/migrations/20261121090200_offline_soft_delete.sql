-- =============================================================
-- Offline: yumshoq o'chirish (soft delete)
-- =============================================================
-- Muammo: ilova internetsiz ham ishlaydi, lekin o'chirish qattiq
-- DELETE edi. Ikki qurilmali holatda bu ma'lumot yo'qotadi:
--   * A qurilmada vazifa offline o'chirildi;
--   * B qurilmada o'sha vazifa o'zgartirildi;
--   * A ulangach DELETE ketadi va B dagi o'zgarish ham yo'qoladi,
--     hech qanday iz qolmaydi.
--
-- Yumshoq o'chirishda qator joyida qoladi, faqat `deleted_at`
-- to'ladi. Shunda:
--   * sinxronlash tartibi muhim emas — "o'chirilgan" ham oddiy
--     o'zgarish, `updated_at` bo'yicha last-write-wins qoidasiga
--     bo'ysunadi;
--   * xato bo'lsa tiklash mumkin;
--   * boshqa qurilma "qator yo'q bo'lib qoldi" degan holatga
--     tushmaydi.
--
-- Mijoz barcha so'rovlarda `deleted_at is null` filtri qo'yadi.

alter table public.tasks
  add column if not exists deleted_at timestamptz;

comment on column public.tasks.deleted_at is
  'To''ldirilgan bo''lsa — vazifa o''chirilgan hisoblanadi (yumshoq o''chirish).';

-- Ro'yxatlar doim "o'chirilmaganlar" kesimida so'raladi
create index if not exists tasks_user_tirik_idx
  on public.tasks (user_id)
  where deleted_at is null;

-- Eslatma (kelajak uchun): juda eski o'chirilgan qatorlarni
-- tozalash kerak bo'lsa, pg_cron bilan oyiga bir marta
-- `delete from tasks where deleted_at < now() - interval '90 days'`
-- qo'shish mumkin. Hozircha ataylab qo'shilmadi — ma'lumot hajmi
-- kichik va tiklash imkoniyati muhimroq.

-- -------------------------------------------------------------
-- RLS
-- -------------------------------------------------------------
-- `tasks` siyosatlari qator darajasida ("faqat o'z qatoringiz") va
-- ustunga bog'lanmagan, shuning uchun yangi ustun avtomatik ravishda
-- himoyalangan. Yumshoq o'chirish oddiy UPDATE bo'lgani uchun mavjud
-- update siyosati yetarli — yangisi kerak emas.
