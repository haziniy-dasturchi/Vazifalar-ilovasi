-- =============================================================
-- FCM tokenni saqlash tuzatildi
-- =============================================================
-- Muammo: 20261121100000 da fcm_token uchun QISMAN noyob indeks
-- (`where fcm_token is not null`) yaratilgan edi. PostgREST'ning
-- `upsert(..., { onConflict: 'fcm_token' })` chaqiruvi
-- `on conflict (fcm_token)` ni WHERE shartisiz yuboradi, Postgres esa
-- qisman indeksni shartsiz tanimaydi:
--   42P10: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
-- Natijada appda bildirishnomani yoqish har safar "Bajarib bo'lmadi"
-- bilan tugardi.
--
-- Yechim:
--   1. Qisman indeks o'rniga oddiy UNIQUE cheklov. NULL'lar Postgres'da
--      bir-biriga teng emas, shuning uchun web qatorlar (fcm_token=null)
--      baribir bir-biriga xalaqit bermaydi.
--   2. Tokenni RPC orqali saqlash. Bitta telefonda boshqa hisob bilan
--      kirilsa, token avvalgi foydalanuvchi qatorida qoladi va RLS uni
--      yangilashga (update_own) ruxsat bermaydi. SECURITY DEFINER
--      funksiya tokenni joriy foydalanuvchiga "ko'chiradi" — bu to'g'ri:
--      qurilma endi shu odamniki, eslatmalar ham unga borishi kerak.

drop index if exists public.push_subscriptions_fcm_token_key;

alter table public.push_subscriptions
  add constraint push_subscriptions_fcm_token_key unique (fcm_token);

create or replace function public.fcm_tokenni_saqlash(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Kirish talab qilinadi' using errcode = '42501';
  end if;
  if p_platform not in ('android', 'ios') then
    raise exception 'Noto''g''ri platforma: %', p_platform using errcode = '22023';
  end if;
  if coalesce(length(p_token), 0) = 0 or length(p_token) > 4096 then
    raise exception 'Token noto''g''ri' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, platform, fcm_token)
  values (v_user, p_platform, p_token)
  on conflict (fcm_token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform;
end;
$$;

revoke all on function public.fcm_tokenni_saqlash(text, text) from public, anon;
grant execute on function public.fcm_tokenni_saqlash(text, text) to authenticated;

comment on function public.fcm_tokenni_saqlash(text, text) is
  'Qurilmaning FCM tokenini joriy foydalanuvchiga biriktiradi (bor bo''lsa ko''chiradi).';
