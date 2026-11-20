-- =============================================================
-- complete_task — keyingi sanani mijoz hisoblaydi
-- =============================================================
-- Nega: takrorlanish endi RRULE (`tasks.rrule`). To'liq RRULE
-- hisobini PL/pgSQL da yozish juda qimmat, eng muhimi esa — ilova
-- internetsiz ishlashi kerak. Internet yo'q paytda bajarilgan
-- takrorlanuvchi vazifa darhol keyingi sanaga surilishi shart,
-- server esa o'sha paytda yetib bo'lmas joyda.
--
-- Shuning uchun sana mijozda (`lib/takrorlanish`) hisoblanadi va
-- shu yerga tayyor holda keladi.
--
-- ORQAGA MOSLIK: ikkala yangi parametr ham `default` bilan.
-- Keshda eski JS qolgan qurilma funksiyani avvalgidek ikkita
-- argument bilan chaqiradi va eski yo'l — `next_occurrence` —
-- ishlayveradi.
--
--   p_client_computed = false  -> eski yo'l (recurrence ustunidan)
--   p_client_computed = true   -> p_next_due ishlatiladi
--   p_client_computed = true va p_next_due = null
--                              -> takrorlanish tugagan, vazifa
--                                 "done" holatida qoladi

-- Eski ikki argumentli variant OLIB TASHLANADI. Nega: ikkalasi
-- yonma-yon tursa, PostgREST ikki argument bilan kelgan chaqiruvda
-- qaysi birini tanlashni bilmay xato qaytaradi ("could not choose
-- the best candidate function"). Yangi funksiyada ikkala qo'shimcha
-- parametr ham `default` bilan, shuning uchun eski mijozning ikki
-- argumentli chaqirig'i avvalgidek ishlayveradi.
drop function if exists public.complete_task(uuid, boolean);

create or replace function public.complete_task(
  task_id           uuid,
  include_subtasks  boolean default false,
  p_next_due        date    default null,
  p_client_computed boolean default false
)
returns public.tasks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id    uuid := task_id;
  v_task  public.tasks;
  v_tz    text;
  v_today date;
  v_next  date;
  v_shift integer;
begin
  select * into v_task from public.tasks t where t.id = v_id for update;
  if not found then
    raise exception 'Vazifa topilmadi' using errcode = 'P0002';
  end if;

  -- Ochiq subtasklar (faqat ota-vazifada ma'noga ega)
  if include_subtasks and v_task.parent_id is null then
    update public.tasks c
       set status = 'done'
     where c.parent_id = v_id
       and c.status <> 'done';
  end if;

  if v_task.status <> 'done' then
    update public.tasks t
       set status = 'done'
     where t.id = v_id
    returning t.* into v_task;
  end if;

  -- ---------------------------------------------------------
  -- Keyingi sana
  -- ---------------------------------------------------------
  v_tz    := public.user_timezone(v_task.user_id);
  v_today := (now() at time zone v_tz)::date;

  if p_client_computed then
    v_next := p_next_due;
  elsif v_task.recurrence is not null then
    -- Eski mijoz: avvalgidek serverda hisoblaymiz
    v_next := public.next_occurrence(v_task.due_date, v_task.recurrence, v_today);
  else
    v_next := null;
  end if;

  if v_next is not null then
    v_shift := v_next - coalesce(v_task.due_date, v_today);

    -- Bu yerdagi 'planned' ga qaytish hodisa emas — jurnalni to'xtatamiz
    perform set_config('vazifalar.skip_events', 'on', true);

    update public.tasks t
       set status       = 'planned',
           due_date     = v_next,
           deadline     = case when t.deadline is null then null else t.deadline + v_shift end,
           started_at   = null,
           completed_at = null
     where t.id = v_id
    returning t.* into v_task;

    -- Yangi takrorlanish uchun subtasklar ham qaytadan ochiladi
    update public.tasks c
       set status       = 'planned',
           started_at   = null,
           completed_at = null
     where c.parent_id = v_id
       and c.status <> 'planned';

    perform set_config('vazifalar.skip_events', 'off', true);
  end if;

  return v_task;
end;
$$;

comment on function public.complete_task(uuid, boolean, date, boolean) is
  'Vazifani bajarilgan deb belgilaydi. Takrorlanuvchi bo''lsa keyingi sanaga suradi (sanani mijoz beradi).';

revoke execute on function public.complete_task(uuid, boolean, date, boolean) from public;
grant  execute on function public.complete_task(uuid, boolean, date, boolean) to authenticated;
