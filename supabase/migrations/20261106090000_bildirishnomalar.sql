-- =============================================================
-- Samara — vaqtli vazifalar uchun push bildirishnomalar
-- =============================================================
-- Vazifaga vaqt belgilansa, o'sha payt kelganda qurilmaga
-- bildirishnoma boradi — ilova yopiq bo'lsa ham.
--
-- Qismlari:
--   push_subscriptions  — qurilma obunalari (brauzer bergan manzil)
--   tasks.notified_at   — bir vazifa uchun bir marta yuborilishi
--   kutilayotgan_eslatmalar() — vaqti kelganlarni qaytaradi

-- -------------------------------------------------------------
-- 1. Qurilma obunalari
-- -------------------------------------------------------------
create table public.push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade,
  -- Brauzer bergan yagona manzil; bir qurilma = bir yozuv
  endpoint   text        not null unique,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is
  'Web Push obunalari. Har bir qurilma/brauzer uchun alohida qator.';

create index push_subscriptions_user_idx
  on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy push_subscriptions_select_own
  on public.push_subscriptions for select
  using (user_id = (select auth.uid()));

create policy push_subscriptions_insert_own
  on public.push_subscriptions for insert
  with check (user_id = (select auth.uid()));

create policy push_subscriptions_delete_own
  on public.push_subscriptions for delete
  using (user_id = (select auth.uid()));

-- -------------------------------------------------------------
-- 2. Takroran yubormaslik uchun belgi
-- -------------------------------------------------------------
alter table public.tasks
  add column notified_at timestamptz;

comment on column public.tasks.notified_at is
  'Eslatma yuborilgan payt. NULL bo''lsa hali yuborilmagan.';

-- Vaqti kelganlarni tez topish uchun — faqat kerakli qatorlar
create index tasks_eslatma_idx
  on public.tasks (due_date, due_time)
  where notified_at is null and due_time is not null and status <> 'done';

-- Vaqt yoki sana o'zgartirilsa, eslatma qaytadan yuborilishi kerak
create or replace function public.tg_tasks_eslatmani_tiklash()
returns trigger
language plpgsql
as $$
begin
  if (new.due_date is distinct from old.due_date)
     or (new.due_time is distinct from old.due_time) then
    new.notified_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_eslatmani_tiklash
  before update on public.tasks
  for each row execute function public.tg_tasks_eslatmani_tiklash();

-- -------------------------------------------------------------
-- 3. Vaqti kelgan eslatmalar
-- -------------------------------------------------------------
-- MUHIM: due_time — mahalliy "devor soati". Uni foydalanuvchining
-- o'z mintaqasida (profiles.timezone) talqin qilamiz, aks holda
-- Toshkentdagi 09:00 UTC bo'yicha 14:00 bo'lib ketardi.
--
-- Bir soatdan eski eslatmalar yuborilmaydi: server bir muddat
-- ishlamay qolsa, foydalanuvchi ertalab o'nlab eski bildirishnoma
-- olib, ilovani o'chirib tashlardi.
create or replace function public.kutilayotgan_eslatmalar()
returns table (
  task_id  uuid,
  user_id  uuid,
  sarlavha text,
  endpoint text,
  p256dh   text,
  auth     text
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select t.id, t.user_id, t.title, s.endpoint, s.p256dh, s.auth
  from public.tasks t
  join public.profiles p on p.id = t.user_id
  join public.push_subscriptions s on s.user_id = t.user_id
  where t.status <> 'done'
    and t.due_date is not null
    and t.due_time is not null
    and t.notified_at is null
    and ((t.due_date + t.due_time) at time zone p.timezone) <= now()
    and ((t.due_date + t.due_time) at time zone p.timezone) > now() - interval '1 hour'
$$;

revoke all on function public.kutilayotgan_eslatmalar() from public, anon, authenticated;

-- -------------------------------------------------------------
-- 4. Yuborilgan deb belgilash
-- -------------------------------------------------------------
create or replace function public.eslatma_yuborildi(vazifalar uuid[])
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update public.tasks set notified_at = now() where id = any(vazifalar);
$$;

revoke all on function public.eslatma_yuborildi(uuid[]) from public, anon, authenticated;
