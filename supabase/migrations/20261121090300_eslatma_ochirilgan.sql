-- =============================================================
-- Eslatma: o'chirilgan vazifa bildirishnoma yubormasin
-- =============================================================
-- `kutilayotgan_eslatmalar()` yumshoq o'chirishdan OLDIN yozilgan,
-- shuning uchun `deleted_at` ni bilmaydi. Natijada foydalanuvchi
-- o'chirgan vazifa ham, vaqti kelganda, telefoniga bildirishnoma
-- yuborishi mumkin edi — bu esa "o'chirdim, lekin baribir chiqdi"
-- degan eng achchiq xato turi.
--
-- Funksiya imzosi o'zgarmaydi, faqat bitta shart qo'shiladi.

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
    and t.deleted_at is null
    and t.due_date is not null
    and t.due_time is not null
    and t.notified_at is null
    and ((t.due_date + t.due_time) at time zone p.timezone) <= now()
    and ((t.due_date + t.due_time) at time zone p.timezone) > now() - interval '1 hour'
$$;

revoke all on function public.kutilayotgan_eslatmalar() from public, anon, authenticated;
