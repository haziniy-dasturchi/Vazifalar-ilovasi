-- =============================================================
-- Xayriyalar — "Loyihani qo'llab-quvvatlash" to'lovlari
--
-- Oqim:
--   1. Ilova `xayriya_yarat(summa, tizim)` ni chaqiradi — "kutilmoqda"
--      holatidagi yozuv paydo bo'ladi va uning ID'si qaytadi.
--   2. Odam shu ID bilan Payme yoki Click to'lov sahifasiga o'tadi.
--   3. Payme/Click to'lovni bizning Edge funksiyamizga (`payme`,
--      `click`) tasdiqlatadi — holat "tolandi" yoki "bekor" bo'ladi.
--
-- Yozuvni faqat 1-qadam (RPC) va Edge funksiyalar (service role)
-- o'zgartiradi. Mijoz to'g'ridan-to'g'ri INSERT/UPDATE qila olmaydi —
-- aks holda o'zini "to'lagan" qilib belgilab qo'yishi mumkin edi.
-- =============================================================

create table if not exists public.xayriyalar (
  id               uuid        primary key default gen_random_uuid(),
  -- Click `merchant_prepare_id` sifatida butun son talab qiladi
  raqam            bigint      generated always as identity unique,
  foydalanuvchi_id uuid        references auth.users (id) on delete set null,
  summa_tiyin      bigint      not null,
  tizim            text        not null,
  holat            text        not null default 'kutilmoqda',
  created_at       timestamptz not null default now(),
  tolandi_at       timestamptz,

  -- Payme: bitta xayriya — bitta Payme tranzaksiyasi
  payme_tx_id       text unique,
  payme_time        bigint,      -- Payme tomonidagi yaratilish vaqti (ms)
  payme_create_time bigint,      -- bizda yaratilgan vaqt (ms)
  payme_perform_time bigint not null default 0,
  payme_cancel_time  bigint not null default 0,
  payme_state       smallint,
  payme_reason      smallint,

  -- Click
  click_trans_id   bigint unique,
  click_paydoc_id  bigint,

  constraint xayriya_summa_chk check (summa_tiyin between 100000 and 1000000000),
  constraint xayriya_tizim_chk check (tizim in ('payme', 'click')),
  constraint xayriya_holat_chk check (holat in ('kutilmoqda', 'tolandi', 'bekor'))
);

create index if not exists xayriyalar_payme_time_idx
  on public.xayriyalar (payme_time) where payme_tx_id is not null;

alter table public.xayriyalar enable row level security;

-- Odam faqat o'z xayriyalarini ko'radi ("rahmat" xabari uchun)
drop policy if exists xayriya_select on public.xayriyalar;
create policy xayriya_select on public.xayriyalar
  for select to authenticated
  using (foydalanuvchi_id = (select auth.uid()));

/*
  Yangi xayriya. Summa so'mda keladi (1 000 — 10 000 000).
  SECURITY DEFINER: jadvalga mijozga INSERT ruxsati berilmagan.
*/
create or replace function public.xayriya_yarat(p_summa_som integer, p_tizim text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_summa_som is null or p_summa_som < 1000 or p_summa_som > 10000000 then
    raise exception 'Summa 1 000 dan 10 000 000 so''mgacha bo''lishi kerak'
      using errcode = '22023';
  end if;
  if p_tizim not in ('payme', 'click') then
    raise exception 'Noma''lum to''lov tizimi: %', p_tizim using errcode = '22023';
  end if;

  insert into public.xayriyalar (foydalanuvchi_id, summa_tiyin, tizim)
  values (auth.uid(), p_summa_som::bigint * 100, p_tizim)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.xayriya_yarat(integer, text) from public, anon;
grant execute on function public.xayriya_yarat(integer, text) to authenticated;
