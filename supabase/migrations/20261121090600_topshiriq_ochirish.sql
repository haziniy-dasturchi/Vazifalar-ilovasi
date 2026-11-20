-- =============================================================
-- Topshiriqni ro'yxatdan o'chirish — HAR TOMON O'ZI UCHUN
-- =============================================================
-- Talab: yuborilgan va kelgan topshiriqlarni o'chirib tashlash
-- mumkin bo'lsin.
--
-- MUHIM QAROR: o'chirish faqat O'CHIRGAN ODAMNING ro'yxatidan
-- olib tashlaydi, ikkinchi tomonda qoladi.
--
-- Nega aynan shunday:
--   * Agar qabul qiluvchi o'chirganda topshiriq yuboruvchida ham
--     yo'qolsa, xodim o'ziga berilgan ishning izini o'chirib
--     tashlashi mumkin bo'lardi — boshliq nima yuborganini
--     eslolmaydi ham, isbotlay olmaydi ham.
--   * Aksincha, yuboruvchi o'chirganda qabul qiluvchida yo'qolsa,
--     odam qabul qilgan ishi qo'lidan ketib qolardi.
-- Shuning uchun har tomonning o'z belgisi bor. Ikkalasi ham
-- o'chirsa — qator butunlay yo'q qilinadi, keraksiz ma'lumot
-- bazada yotib qolmaydi.
--
-- Kutilmoqda holatidagi topshiriqni yuboruvchi BEKOR QILISHI
-- (butunlay o'chirishi) avvalgidek ishlayveradi — u boshqa amal.

alter table public.topshiriqlar
  add column if not exists yuboruvchi_ochirgan_at timestamptz,
  add column if not exists qabul_ochirgan_at      timestamptz;

comment on column public.topshiriqlar.yuboruvchi_ochirgan_at is
  'Yuboruvchi o''z ro''yxatidan olib tashlagan payt.';
comment on column public.topshiriqlar.qabul_ochirgan_at is
  'Qabul qiluvchi o''z ro''yxatidan olib tashlagan payt.';

-- -------------------------------------------------------------
-- Ko'rish siyosati: o'chirganim menga ko'rinmaydi
-- -------------------------------------------------------------
-- Filtr aynan SIYOSATDA: mijoz tomonda filtrlansa, to'g'ridan-
-- to'g'ri API ga murojaat qilib o'chirilganlarni ko'rish mumkin
-- bo'lardi. Bu yerda esa ular umuman qaytmaydi.
drop policy if exists topshiriqlar_select on public.topshiriqlar;
create policy topshiriqlar_select on public.topshiriqlar
  for select to authenticated
  using (
    (yuboruvchi_id = (select auth.uid()) and yuboruvchi_ochirgan_at is null)
    or (
      qabul_qiluvchi_email = (select public.joriy_email())
      and qabul_ochirgan_at is null
    )
  );

-- -------------------------------------------------------------
-- O'chirish amali
-- -------------------------------------------------------------
-- Nega RPC: `topshiriqlar` da UPDATE siyosati ATAYLAB yo'q —
-- holat faqat tekshirilgan funksiyalar orqali o'zgaradi. Shu
-- qoidani buzmaslik uchun o'chirish ham RPC.
--
-- Bitta chaqiruvda bir nechta id: ro'yxatdan bir nechtasini
-- belgilab, bittada o'chirish uchun.
create or replace function public.topshiriqlarni_ochirish(p_idlar uuid[])
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid   uuid := auth.uid();
  v_email text := public.joriy_email();
  v_soni  integer;
begin
  if v_uid is null then
    raise exception 'Avtorizatsiya talab qilinadi' using errcode = '42501';
  end if;

  -- Har kim faqat o'ziga tegishli tomonni belgilaydi. Begona
  -- topshiriq id'si berilsa, `where` uni chetlab o'tadi.
  update public.topshiriqlar t
     set yuboruvchi_ochirgan_at = case
           when t.yuboruvchi_id = v_uid then now()
           else t.yuboruvchi_ochirgan_at
         end,
         qabul_ochirgan_at = case
           when t.qabul_qiluvchi_email = v_email then now()
           else t.qabul_ochirgan_at
         end
   where t.id = any(p_idlar)
     and (t.yuboruvchi_id = v_uid or t.qabul_qiluvchi_email = v_email);

  get diagnostics v_soni = row_count;

  -- Ikkala tomon ham o'chirgan bo'lsa — qator butunlay ketadi
  delete from public.topshiriqlar t
   where t.id = any(p_idlar)
     and t.yuboruvchi_ochirgan_at is not null
     and t.qabul_ochirgan_at is not null;

  return v_soni;
end;
$$;

comment on function public.topshiriqlarni_ochirish(uuid[]) is
  'Topshiriqlarni chaqiruvchining ro''yxatidan olib tashlaydi.';

revoke all on function public.topshiriqlarni_ochirish(uuid[]) from public, anon;
grant execute on function public.topshiriqlarni_ochirish(uuid[]) to authenticated;

-- -------------------------------------------------------------
-- Bildirishnoma o'chirilganlarni yubormasin
-- -------------------------------------------------------------
-- Qabul qiluvchi ro'yxatidan olib tashlagan topshiriq uchun
-- bildirishnoma yuborish — "o'chirdim, lekin baribir chiqdi"
-- degan xatoning aynan o'zi.
create or replace function public.kutilayotgan_topshiriqlar()
returns table (
  topshiriq_id uuid,
  sarlavha     text,
  yuboruvchi   text,
  endpoint     text,
  p256dh       text,
  auth         text
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  select t.id,
         t.sarlavha,
         coalesce(p.full_name, u.email, '') as yuboruvchi,
         s.endpoint,
         s.p256dh,
         s.auth
    from public.topshiriqlar t
    join auth.users qab
      on lower(qab.email) = t.qabul_qiluvchi_email
    join public.push_subscriptions s
      on s.user_id = qab.id
    left join auth.users u on u.id = t.yuboruvchi_id
    left join public.profiles p on p.id = t.yuboruvchi_id
   where t.holat = 'kutilmoqda'
     and t.bildirildi_at is null
     and t.qabul_ochirgan_at is null
     and t.created_at > now() - interval '3 days';
$$;

revoke all on function public.kutilayotgan_topshiriqlar() from public, anon, authenticated;
grant execute on function public.kutilayotgan_topshiriqlar() to service_role;
