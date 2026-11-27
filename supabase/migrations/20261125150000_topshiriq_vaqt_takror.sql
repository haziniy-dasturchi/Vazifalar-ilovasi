-- =============================================================
-- Topshiriq: boshlanish soati va istalgan takrorlanish
-- =============================================================
--   1. `boshlanish_vaqt` — nechada boshlanadi (tugash soati —
--      `muddat_vaqt`, kechikish shunga qarab). Ijrochi vazifasining
--      `due_time` i shu bo'ladi — eslatma ish boshlanishida keladi.
--   2. Takror: avvalgi uchtasidan tashqari "har N kun/hafta/oy"
--      (`har:3:kun`, `har:2:hafta`, `har:6:oy`).

alter table public.topshiriqlar
  add column if not exists boshlanish_vaqt time;

alter table public.topshiriqlar drop constraint if exists topshiriq_takror_chk;
alter table public.topshiriqlar add constraint topshiriq_takror_chk
  check (takror is null
         or takror in ('kunlik', 'haftalik', 'oylik')
         or takror ~ '^har:[1-9][0-9]{0,2}:(kun|hafta|oy)$');

-- Takror qadami (interval) — bitta joyda
create or replace function public.topshiriq_takror_qadami(p_takror text)
returns interval
language sql
immutable
as $$
  select case
    when p_takror = 'kunlik'   then interval '1 day'
    when p_takror = 'haftalik' then interval '7 days'
    when p_takror = 'oylik'    then interval '1 month'
    when p_takror ~ '^har:[0-9]+:kun$'
      then make_interval(days => split_part(p_takror, ':', 2)::int)
    when p_takror ~ '^har:[0-9]+:hafta$'
      then make_interval(weeks => split_part(p_takror, ':', 2)::int)
    when p_takror ~ '^har:[0-9]+:oy$'
      then make_interval(months => split_part(p_takror, ':', 2)::int)
  end;
$$;

-- Vazifaga sanalar: boshlanish -> due_date, boshlanish soati -> due_time
create or replace function public._topshiriqni_qabul_et(p_id uuid, p_uid uuid, p_avto boolean)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t      public.topshiriqlar;
  v_papka  uuid;
  v_vazifa uuid;
begin
  select * into v_t from public.topshiriqlar where id = p_id;

  select f.id into v_papka
    from public.folders f
   where f.user_id = p_uid and f.is_inbox
   limit 1;
  if v_papka is null then
    if p_avto then
      return v_t;
    end if;
    raise exception 'Kiruvchi papka topilmadi' using errcode = 'P0002';
  end if;

  insert into public.tasks
    (user_id, folder_id, title, description, due_date, due_time, deadline, priority)
  values
    (p_uid, v_papka, v_t.sarlavha, v_t.izoh,
     coalesce(v_t.boshlanish, v_t.muddat),
     coalesce(v_t.boshlanish_vaqt,
              case when v_t.boshlanish is null or v_t.boshlanish = v_t.muddat
                   then v_t.muddat_vaqt end),
     v_t.muddat,
     v_t.muhimlik)
  returning id into v_vazifa;

  update public.topshiriqlar
     set holat      = 'qabul',
         vazifa_id  = v_vazifa,
         javob_at   = now(),
         avto_qabul = p_avto
   where id = p_id
  returning * into v_t;
  return v_t;
end;
$$;
revoke all on function public._topshiriqni_qabul_et(uuid, uuid, boolean) from public, anon, authenticated;

-- Takror: keyingi nusxa — boshlanish ham shuncha suriladi
create or replace function public.tg_topshiriq_takror()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_qadam  interval;
  v_asos   date;
  v_yangi  date;
begin
  if new.holat = 'bajarildi' and old.holat <> 'bajarildi'
     and new.takror is not null
     and new.yuboruvchi_ochirgan_at is null
     and not exists (select 1 from public.topshiriqlar x where x.oldingi_id = new.id)
  then
    v_qadam := public.topshiriq_takror_qadami(new.takror);
    if v_qadam is null then
      return null;
    end if;
    v_asos := coalesce(new.muddat, current_date);
    while (v_asos + v_qadam)::date < current_date loop
      v_asos := (v_asos + v_qadam)::date;
    end loop;
    v_yangi := (v_asos + v_qadam)::date;

    insert into public.topshiriqlar
      (yuboruvchi_id, qabul_qiluvchi_email, sarlavha, izoh, boshlanish,
       boshlanish_vaqt, muddat, muddat_vaqt, muhimlik, tekshirish, takror,
       guruh_id, oldingi_id)
    values
      (new.yuboruvchi_id, new.qabul_qiluvchi_email, new.sarlavha, new.izoh,
       case when new.boshlanish is not null and new.muddat is not null
            then v_yangi - (new.muddat - new.boshlanish) end,
       new.boshlanish_vaqt,
       v_yangi,
       case when new.muddat is null then null else new.muddat_vaqt end,
       new.muhimlik, new.tekshirish, new.takror, new.guruh_id, new.id);
  end if;
  return null;
end;
$$;

-- Tahrirlash: boshlanish soati va takror ham o'zgaradi
drop function if exists public.topshiriqni_tahrirlash(uuid, text, text, date, date, time, smallint);
create or replace function public.topshiriqni_tahrirlash(
  p_id              uuid,
  p_sarlavha        text,
  p_izoh            text,
  p_boshlanish      date,
  p_boshlanish_vaqt time,
  p_muddat          date,
  p_muddat_vaqt     time,
  p_muhimlik        smallint,
  p_takror          text
)
returns public.topshiriqlar
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_t public.topshiriqlar;
  v_muddat_ozgardi boolean;
begin
  select * into v_t from public.topshiriqlar where id = p_id;
  if not found or v_t.yuboruvchi_id <> auth.uid() then
    raise exception 'Topshiriq topilmadi' using errcode = 'P0002';
  end if;
  if v_t.holat in ('bajarildi', 'rad') then
    raise exception 'Yopilgan topshiriqni o''zgartirib bo''lmaydi' using errcode = 'P0001';
  end if;

  v_muddat_ozgardi := v_t.muddat is distinct from p_muddat
                      or v_t.muddat_vaqt is distinct from p_muddat_vaqt;

  update public.topshiriqlar
     set sarlavha        = btrim(p_sarlavha),
         izoh            = nullif(btrim(coalesce(p_izoh, '')), ''),
         boshlanish      = p_boshlanish,
         boshlanish_vaqt = case when p_boshlanish is null then null else p_boshlanish_vaqt end,
         muddat          = p_muddat,
         muddat_vaqt     = case when p_muddat is null then null else p_muddat_vaqt end,
         muhimlik        = coalesce(p_muhimlik, muhimlik),
         takror          = nullif(btrim(coalesce(p_takror, '')), ''),
         muddat_eslatildi_at     = case when v_muddat_ozgardi then null else muddat_eslatildi_at end,
         kechikish_bildirildi_at = case when v_muddat_ozgardi then null else kechikish_bildirildi_at end
   where id = p_id
  returning * into v_t;

  update public.tasks
     set title       = v_t.sarlavha,
         description = v_t.izoh,
         due_date    = coalesce(v_t.boshlanish, v_t.muddat),
         due_time    = coalesce(v_t.boshlanish_vaqt,
                                case when v_t.boshlanish is null or v_t.boshlanish = v_t.muddat
                                     then v_t.muddat_vaqt end),
         deadline    = v_t.muddat,
         priority    = v_t.muhimlik
   where id = v_t.vazifa_id
     and deleted_at is null;

  insert into public.topshiriq_tarixi (topshiriq_id, kim_id, hodisa)
  values (p_id, auth.uid(), 'tahrirlandi');

  perform public._xabar_qosh(public.email_egasi(v_t.qabul_qiluvchi_email), v_t.id,
    'Topshiriq o''zgartirildi — ' || public.foydalanuvchi_ismi(v_t.yuboruvchi_id),
    v_t.sarlavha);

  return v_t;
end;
$$;
revoke all on function public.topshiriqni_tahrirlash(uuid, text, text, date, time, date, time, smallint, text) from public, anon;
grant execute on function public.topshiriqni_tahrirlash(uuid, text, text, date, time, date, time, smallint, text) to authenticated;
