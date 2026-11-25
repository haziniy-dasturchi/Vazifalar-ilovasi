-- =============================================================
-- Topshiriq izohlariga reaksiyalar (Telegram kabi)
--
-- To'rt xil: zo'r 👍, qarsak 👏, xafa 😢, kelishuv 🤝.
-- Har odam bitta xabarga bitta reaksiya qo'yadi (Telegram'ning oddiy
-- rejimidagidek): boshqasini tanlasa — almashtiriladi, o'shasini
-- qayta bossa — olib tashlanadi. Shuning uchun kalit (izoh, odam).
-- Ko'rish va qo'yish — faqat topshiriq ishtirokchilariga.
-- =============================================================

create table if not exists public.topshiriq_reaksiyalari (
  izoh_id          uuid        not null references public.topshiriq_izohlari (id) on delete cascade,
  foydalanuvchi_id uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  reaksiya         text        not null,
  created_at       timestamptz not null default now(),
  primary key (izoh_id, foydalanuvchi_id),
  constraint reaksiya_turi_chk check (reaksiya in ('zor', 'qarsak', 'xafa', 'kelishuv'))
);

alter table public.topshiriq_reaksiyalari enable row level security;

/*
  Izoh qaysi topshiriqqa tegishli va men uning ishtirokchisimanmi?
  SECURITY DEFINER: izohlar jadvalining o'z RLS'iga bog'lanib qolmasin
  va natija aniq bo'lsin (ishtirokchi emas — false).
*/
create or replace function public.izoh_ishtirokchisimi(p_izoh uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.topshiriq_izohlari i
     where i.id = p_izoh
       and public.topshiriq_ishtirokchisimi(i.topshiriq_id));
$$;
revoke all on function public.izoh_ishtirokchisimi(uuid) from public, anon;
grant execute on function public.izoh_ishtirokchisimi(uuid) to authenticated;

drop policy if exists reaksiya_select on public.topshiriq_reaksiyalari;
create policy reaksiya_select on public.topshiriq_reaksiyalari
  for select to authenticated
  using (public.izoh_ishtirokchisimi(izoh_id));

drop policy if exists reaksiya_insert on public.topshiriq_reaksiyalari;
create policy reaksiya_insert on public.topshiriq_reaksiyalari
  for insert to authenticated
  with check (
    foydalanuvchi_id = (select auth.uid())
    and public.izoh_ishtirokchisimi(izoh_id));

drop policy if exists reaksiya_update on public.topshiriq_reaksiyalari;
create policy reaksiya_update on public.topshiriq_reaksiyalari
  for update to authenticated
  using (foydalanuvchi_id = (select auth.uid()))
  with check (
    foydalanuvchi_id = (select auth.uid())
    and public.izoh_ishtirokchisimi(izoh_id));

drop policy if exists reaksiya_delete on public.topshiriq_reaksiyalari;
create policy reaksiya_delete on public.topshiriq_reaksiyalari
  for delete to authenticated
  using (foydalanuvchi_id = (select auth.uid()));

grant select, insert, update, delete on public.topshiriq_reaksiyalari to authenticated;
