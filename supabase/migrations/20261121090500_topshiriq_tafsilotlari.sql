-- =============================================================
-- Topshiriq kartasi uchun: kim kimga va ish qay darajada
-- =============================================================
-- Kartada ikki narsa yetishmasdi:
--   1. Kim bilan ish ko'rayotganing (email emas, ism-familiya);
--   2. Boshliq yuborgan ishi qay darajada bajarilganini ko'rmasdi.
--
-- Ikkalasi ham BOSHQA odamning ma'lumoti, shuning uchun to'g'ridan-
-- to'g'ri jadvaldan o'qitib bo'lmaydi — RLS buni haqli ravishda
-- to'sadi. Shu sababli bitta tor funksiya: faqat kerakli ikki-uch
-- maydonni, faqat aloqador topshiriqlar uchun qaytaradi.
--
-- ISM KO'RSATISH QOIDASI (maxfiylik):
--   * Menga kelgan topshiriqda yuboruvchi ismi DOIM ko'rinadi —
--     mendan ish so'ralmoqda, kimligini bilishim shart.
--   * Men yuborgan topshiriqda qabul qiluvchi ismi faqat U QABUL
--     QILGANDAN KEYIN ko'rinadi. Aks holda tasodifiy emaillarga
--     topshiriq yuborib, kimning ismi nimaligini yig'ib olish
--     mumkin bo'lardi (account enumeration).
--
-- JARAYON KO'RSATISH QOIDASI:
--   * Faqat yuboruvchiga va faqat qabul qilingandan keyin;
--   * Faqat holat va foiz. Vazifa matni, izohi, papkasi va boshqa
--     tafsilotlari KO'RINMAYDI — xodimning shaxsiy ro'yxati
--     boshliqqa ochilib qolmasligi kerak.

create or replace function public.topshiriq_tafsilotlari()
returns table (
  topshiriq_id  uuid,
  -- Qarshi tomonning ismi (yuqoridagi qoida bo'yicha) yoki null
  qarshi_ism    text,
  -- Vazifa holati: planned | in_progress | done | null
  vazifa_holati text,
  foiz          smallint,
  -- Qabul qilingan, lekin vazifa o'chirilgan bo'lsa — true
  ochirilganmi  boolean
)
language sql
security definer
set search_path = public, auth, pg_temp
as $$
  with men as (
    select auth.uid() as id, public.joriy_email() as email
  ),
  meniki as (
    select t.*
      from public.topshiriqlar t, men
     where t.yuboruvchi_id = men.id
        or t.qabul_qiluvchi_email = men.email
  )
  select
    k.id,
    case
      -- Menga kelgan: yuboruvchi kimligi doim ko'rinadi
      when k.qabul_qiluvchi_email = men.email
        then nullif(btrim(coalesce(p_yub.full_name, u_yub.email, '')), '')
      -- Men yuborgan: faqat javob bergandan keyin
      when k.yuboruvchi_id = men.id and k.holat in ('qabul', 'bajarildi')
        then nullif(btrim(coalesce(p_qab.full_name, u_qab.email, '')), '')
      else null
    end as qarshi_ism,
    case when k.yuboruvchi_id = men.id then v.status else null end,
    case when k.yuboruvchi_id = men.id then v.progress else null end,
    case
      when k.yuboruvchi_id = men.id
           and k.holat in ('qabul', 'bajarildi')
        then (v.id is null or v.deleted_at is not null)
      else false
    end as ochirilganmi
  from meniki k
  cross join men
  left join auth.users     u_yub on u_yub.id = k.yuboruvchi_id
  left join public.profiles p_yub on p_yub.id = k.yuboruvchi_id
  left join auth.users     u_qab on lower(u_qab.email) = k.qabul_qiluvchi_email
  left join public.profiles p_qab on p_qab.id = u_qab.id
  left join public.tasks    v     on v.id = k.vazifa_id;
$$;

comment on function public.topshiriq_tafsilotlari() is
  'Topshiriq kartasi uchun: qarshi tomon ismi va (yuboruvchiga) ish jarayoni.';

revoke all on function public.topshiriq_tafsilotlari() from public, anon;
grant execute on function public.topshiriq_tafsilotlari() to authenticated;
