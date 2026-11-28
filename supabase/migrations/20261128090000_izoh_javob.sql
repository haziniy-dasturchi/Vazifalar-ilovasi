-- =============================================================
-- Izohga javob (Telegram'dagi "Reply")
--
-- Har izoh boshqa izohga javob bo'lishi mumkin: `javob_izoh_id`.
-- Asl xabar o'chirilsa — javob qoladi, faqat bog'lanish uziladi
-- (on delete set null; ekranda "xabar o'chirilgan" deb ko'rinadi).
-- Faqat SHU topshiriqdagi xabarga javob berish mumkin — boshqa
-- topshiriqning xabarini iqtibos qilib "ko'rib olish" bo'lmasin.
-- =============================================================

alter table public.topshiriq_izohlari
  add column if not exists javob_izoh_id uuid
    references public.topshiriq_izohlari (id) on delete set null;

create or replace function public.izoh_javob_tekshir()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.javob_izoh_id is not null and not exists (
    select 1 from public.topshiriq_izohlari i
     where i.id = new.javob_izoh_id
       and i.topshiriq_id = new.topshiriq_id) then
    raise exception 'javob boshqa topshiriqdagi xabarga bo''lishi mumkin emas';
  end if;
  return new;
end;
$$;

drop trigger if exists izoh_javob_tekshir on public.topshiriq_izohlari;
create trigger izoh_javob_tekshir
  before insert on public.topshiriq_izohlari
  for each row execute function public.izoh_javob_tekshir();
