-- Hisobni o'chirish
--
-- Google Play (2024-yildan) va App Store talab qiladi: hisob yaratish
-- imkoni bor ilova foydalanuvchiga hisobini ILOVA ICHIDA o'chirish
-- imkonini berishi shart. Shusiz ariza rad etiladi.
--
-- Barcha jadvallar auth.users ga `on delete cascade` bilan bog'langan,
-- shuning uchun bitta qator o'chsa, foydalanuvchining hamma ma'lumoti
-- (vazifalar, papkalar, hisobot tarixi, bildirishnoma obunalari)
-- o'zidan-o'zi o'chadi. Qo'lda jadvalma-jadval o'chirish kerak emas —
-- aksincha, u xavfliroq bo'lardi: yangi jadval qo'shilganda uni
-- ro'yxatga kiritish esdan chiqsa, ma'lumot ortda qolib ketardi.

create or replace function public.hisobni_ochirish()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  kim uuid := auth.uid();
begin
  if kim is null then
    raise exception 'Sessiya topilmadi'
      using errcode = '28000';
  end if;

  -- Kaskad qolganini o'zi bajaradi
  delete from auth.users where id = kim;
end;
$$;

-- Faqat kirgan foydalanuvchi va faqat O'ZI uchun chaqira oladi:
-- funksiya hech qanday argument olmaydi, kimni o'chirishni auth.uid()
-- belgilaydi. Ya'ni birovning hisobini o'chirib bo'lmaydi.
revoke all on function public.hisobni_ochirish() from public, anon;
grant execute on function public.hisobni_ochirish() to authenticated;

comment on function public.hisobni_ochirish() is
  'Chaqirgan foydalanuvchining hisobini va barcha ma''lumotlarini butunlay o''chiradi.';
