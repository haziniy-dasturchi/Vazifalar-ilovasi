-- =============================================================
-- Takrorlanish — RFC 5545 RRULE ga o'tish
-- =============================================================
-- Muammo: `recurrence` ustuni beshta tayyor shakldan iborat edi
-- (`daily | weekdays | weekly | monthly | days:N,N`). "Har oyning
-- 15-sanasi", "har 2 haftada", "har oyning 2-seshanbasi",
-- "10 marta takrorlansin" kabi jadvallarni umuman yozib bo'lmasdi,
-- va har yangi talab ro'yxatga yana bitta shakl qo'shishni talab
-- qilardi.
--
-- Yechim: standart format — RRULE. Tayyor variantlar ham, odam
-- o'zi yig'gan qoida ham bitta matnda ifodalanadi:
--     FREQ=DAILY
--     FREQ=WEEKLY;INTERVAL=2;BYDAY=TU,TH
--     FREQ=MONTHLY;BYMONTHDAY=15
--     FREQ=MONTHLY;BYDAY=2TU;COUNT=10
--
-- Nega uchta ustun:
--   * rrule                  — qoidaning o'zi (DTSTART'siz)
--   * rrule_start            — DTSTART. Alohida, chunki vazifa har
--     bajarilganda `due_date` oldinga suriladi; "10 marta" yoki
--     "shu sanagacha" chegarasi esa O'ZGARMAS boshlanishdan
--     sanalishi kerak, aks holda chegara hech qachon kelmaydi.
--   * rrule_from_completion  — "bajarilgan sanadan" rejimi: keyingi
--     sana jadvaldan emas, ish aslida bajarilgan kundan hisoblanadi.
--
-- Eski `recurrence` ustuni O'CHIRILMAYDI. Sababi: ilova PWA, odamning
-- telefonida eski JS keshda qolgan bo'lishi mumkin va u hamon shu
-- ustunni o'qiydi. Yangi mijoz qoida eski shakllardan biriga to'g'ri
-- kelsa, uni ham to'ldirib boradi. Keyingi relizlardan birida
-- ustun butunlay olib tashlanadi.

-- -------------------------------------------------------------
-- 1. Ustunlar
-- -------------------------------------------------------------
alter table public.tasks
  add column if not exists rrule                 text,
  add column if not exists rrule_start           date,
  add column if not exists rrule_from_completion boolean not null default false;

comment on column public.tasks.rrule is
  'RFC 5545 RRULE, DTSTART''siz. Masalan: FREQ=MONTHLY;BYMONTHDAY=15';
comment on column public.tasks.rrule_start is
  'Takrorlanish boshlangan sana (DTSTART). COUNT va UNTIL shundan sanaladi.';
comment on column public.tasks.rrule_from_completion is
  'true — keyingi sana vazifa bajarilgan kundan boshlab hisoblanadi.';

-- Shakl tekshiruvi: to'liq RRULE grammatikasi emas (u mijozda
-- tekshiriladi), lekin tasodifiy matn tushib qolmasligi uchun
-- qoida albatta FREQ bilan boshlanadi.
alter table public.tasks
  drop constraint if exists tasks_rrule_chk;

alter table public.tasks
  add constraint tasks_rrule_chk check (
    rrule is null
    or rrule ~ '^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(;[A-Z]+=[^;]+)*$'
  );

-- Qoida bor bo'lsa boshlanish sanasi ham bo'lishi shart — aks holda
-- COUNT/UNTIL ni hisoblab bo'lmaydi
alter table public.tasks
  drop constraint if exists tasks_rrule_start_chk;

alter table public.tasks
  add constraint tasks_rrule_start_chk check (
    rrule is null or rrule_start is not null
  );

-- -------------------------------------------------------------
-- 2. Mavjud yozuvlarni ko'chirish
-- -------------------------------------------------------------
-- Ma'no o'zgarmaydi: `monthly` ilgari ham oyning o'sha kunida
-- takrorlanardi va qisqa oyda oxirgi kunga tushardi. Yangi
-- modelda ham aynan shunday (mijozdagi "sodda oylik" yo'li).
update public.tasks
   set rrule_start = coalesce(due_date, created_at::date),
       rrule = case
         when recurrence = 'daily'    then 'FREQ=DAILY'
         when recurrence = 'weekdays' then 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'
         when recurrence = 'weekly'   then 'FREQ=WEEKLY'
         when recurrence = 'monthly'  then 'FREQ=MONTHLY'
         when recurrence like 'days:%' then
           'FREQ=WEEKLY;BYDAY=' || (
             select string_agg(
                      case k
                        when '1' then 'MO' when '2' then 'TU' when '3' then 'WE'
                        when '4' then 'TH' when '5' then 'FR' when '6' then 'SA'
                        else 'SU'
                      end, ',' order by k)
             from unnest(string_to_array(substring(recurrence from 6), ',')) as k
           )
         else null
       end
 where recurrence is not null
   and rrule is null;

-- -------------------------------------------------------------
-- 3. RLS
-- -------------------------------------------------------------
-- `tasks` siyosatlari qator darajasida ("faqat o'z qatoringiz"),
-- ustunlar ro'yxatiga bog'lanmagan — shuning uchun yangi ustunlar
-- avtomatik ravishda o'sha himoya ostida. Qo'shimcha siyosat
-- kerak emas; bu ataylab shunday qoldirildi.
