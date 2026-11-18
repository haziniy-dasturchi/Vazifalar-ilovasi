-- Tanlangan hafta kunlarida takrorlanish
--
-- Muammo: foydalanuvchilar "har seshanba, chorshanba va payshanba
-- soat 20:00 da" kabi jadvalni kirita olmasdi. Mavjud to'rtta variant
-- (daily / weekdays / weekly / monthly) bunga yetmaydi, shuning uchun
-- odam har safar vazifani qo'lda qayta yaratishga majbur bo'lardi.
--
-- Yechim: `recurrence` ustuniga yangi SHAKL qo'shiladi — `days:2,3,4`,
-- bu yerda raqamlar ISO hafta kunlari (1 = dushanba ... 7 = yakshanba).
--
-- Nega alohida ustun emas: takrorlanish mantiqi butunlay shu bitta
-- ustunga tayanadi (`next_occurrence`, `complete_task`, mijoz kodi).
-- Ikkinchi ustun qo'shilsa, ikkalasi bir-biriga zid bo'lib qolishi
-- mumkin edi — masalan `recurrence = 'monthly'`, lekin kunlar ham
-- to'ldirilgan. Bitta ustunda bunday holat umuman yuzaga kelmaydi.
--
-- Vaqt (`due_time`) bu yerda qatnashmaydi: u takrorlanishda o'zgarmay
-- saqlanadi, ya'ni "20:00" bir marta qo'yilsa, keyingi barcha
-- takrorlanishlarda ham o'sha bo'ladi.

-- -------------------------------------------------------------
-- 1. Yangi shaklga ruxsat
-- -------------------------------------------------------------
alter table public.tasks
  drop constraint if exists tasks_recurrence_chk;

alter table public.tasks
  add constraint tasks_recurrence_chk check (
    recurrence is null
    or recurrence in ('daily', 'weekdays', 'weekly', 'monthly')
    -- Kamida bitta kun, takrorsiz bo'lishi shart emas (mijoz
    -- tomonda tartiblab yuboriladi), 1..7 oralig'ida
    or recurrence ~ '^days:[1-7](,[1-7])*$'
  );

comment on column public.tasks.recurrence is
  'daily | weekdays (du-ju) | weekly | monthly | days:N,N (ISO hafta kunlari) | null.';

-- -------------------------------------------------------------
-- 2. Keyingi sana hisoblashga yangi shaklni qo'shish
-- -------------------------------------------------------------
-- Oldingi versiyada oddiy `case p_recurrence when 'daily' ...` bor edi.
-- Yangi shakl prefiks bilan tekshirilishi kerak, shuning uchun
-- qidiruvli CASE ga o'tkazildi. Qolgan tarmoqlar o'zgarmadi.
create or replace function public.next_occurrence(
  p_base       date,
  p_recurrence text,
  p_today      date
)
returns date
language plpgsql
immutable
as $$
declare
  v_base       date := coalesce(p_base, p_today);
  v_next       date;
  v_anchor_day integer;
  v_month      date;
  v_guard      integer := 0;
  v_days       integer[];
begin
  if p_recurrence is null then
    return null;
  end if;

  v_next       := v_base;
  v_anchor_day := extract(day from v_base)::integer;

  if p_recurrence like 'days:%' then
    v_days := string_to_array(substring(p_recurrence from 6), ',')::integer[];
    if v_days is null or array_length(v_days, 1) is null then
      raise exception 'next_occurrence: hafta kunlari bo''sh (%)', p_recurrence
        using errcode = '22023';
    end if;
  end if;

  loop
    v_guard := v_guard + 1;
    if v_guard > 1000 then
      raise exception 'next_occurrence: keyingi sana topilmadi (% / %)', v_base, p_recurrence
        using errcode = 'P0001';
    end if;

    case
      when p_recurrence = 'daily' then
        v_next := v_next + 1;

      when p_recurrence = 'weekdays' then
        -- Dushanba..Juma (ISO 1..5)
        v_next := v_next + 1;
        while extract(isodow from v_next) > 5 loop
          v_next := v_next + 1;
        end loop;

      when p_recurrence = 'weekly' then
        v_next := v_next + 7;

      when p_recurrence = 'monthly' then
        -- Oyning kuni saqlanadi; qisqa oyda oxirgi kunga tushadi
        v_month := date_trunc('month', v_next + interval '1 month')::date;
        v_next  := v_month + (
          least(
            v_anchor_day,
            extract(day from (v_month + interval '1 month - 1 day'))::integer
          ) - 1
        );

      when p_recurrence like 'days:%' then
        -- Tanlangan kunlardan keyingisiga o'tamiz. Eng ko'pi bilan
        -- 7 qadam: hafta ichida albatta bittasi uchraydi.
        v_next := v_next + 1;
        while not (extract(isodow from v_next)::integer = any(v_days)) loop
          v_next := v_next + 1;
        end loop;

      else
        raise exception 'Noma''lum takrorlanish turi: %', p_recurrence
          using errcode = '22023';
    end case;

    exit when v_next > p_today;
  end loop;

  return v_next;
end;
$$;

comment on function public.next_occurrence(date, text, date) is
  'Takrorlanuvchi vazifaning p_today dan keyingi birinchi sanasini qaytaradi.';
