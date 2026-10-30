-- =============================================================
-- Vazifalar — 10. RPC: vazifa holatini boshqarish
-- =============================================================
-- Barcha funksiyalar SECURITY INVOKER: RLS kuchda qoladi, demak
-- foydalanuvchi faqat o'z vazifasini o'zgartira oladi.

-- -------------------------------------------------------------
-- Takrorlanuvchi vazifaning keyingi sanasi.
-- Qoida: eski due_date dan qadam tashlanadi va natija bugundan
-- keyinga o'tguncha davom etadi (tashlab ketilgan vazifa o'tmishda
-- qolib ketmaydi).
-- -------------------------------------------------------------
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
begin
  if p_recurrence is null then
    return null;
  end if;

  v_next       := v_base;
  v_anchor_day := extract(day from v_base)::integer;

  loop
    v_guard := v_guard + 1;
    if v_guard > 1000 then
      raise exception 'next_occurrence: keyingi sana topilmadi (% / %)', v_base, p_recurrence
        using errcode = 'P0001';
    end if;

    case p_recurrence
      when 'daily' then
        v_next := v_next + 1;

      when 'weekdays' then
        -- Dushanba..Juma (ISO 1..5)
        v_next := v_next + 1;
        while extract(isodow from v_next) > 5 loop
          v_next := v_next + 1;
        end loop;

      when 'weekly' then
        v_next := v_next + 7;

      when 'monthly' then
        -- Oyning kuni saqlanadi; qisqa oyda oxirgi kunga tushadi
        v_month := date_trunc('month', v_next + interval '1 month')::date;
        v_next  := v_month + (
          least(
            v_anchor_day,
            extract(day from (v_month + interval '1 month - 1 day'))::integer
          ) - 1
        );

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

-- -------------------------------------------------------------
-- start_task: planned -> in_progress
-- -------------------------------------------------------------
create or replace function public.start_task(task_id uuid)
returns public.tasks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id   uuid := task_id;
  v_task public.tasks;
begin
  select * into v_task from public.tasks t where t.id = v_id for update;
  if not found then
    raise exception 'Vazifa topilmadi' using errcode = 'P0002';
  end if;

  if v_task.status <> 'planned' then
    raise exception 'Faqat "planned" holatdagi vazifani boshlash mumkin (hozir: %)', v_task.status
      using errcode = 'P0001';
  end if;

  update public.tasks t
     set status = 'in_progress'
   where t.id = v_id
  returning t.* into v_task;

  return v_task;
end;
$$;

-- -------------------------------------------------------------
-- move_back: in_progress -> planned
-- -------------------------------------------------------------
create or replace function public.move_back(task_id uuid)
returns public.tasks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id   uuid := task_id;
  v_task public.tasks;
begin
  select * into v_task from public.tasks t where t.id = v_id for update;
  if not found then
    raise exception 'Vazifa topilmadi' using errcode = 'P0002';
  end if;

  if v_task.status <> 'in_progress' then
    raise exception 'Faqat "in_progress" holatdagi vazifani qaytarish mumkin (hozir: %)', v_task.status
      using errcode = 'P0001';
  end if;

  update public.tasks t
     set status = 'planned'
   where t.id = v_id
  returning t.* into v_task;

  return v_task;
end;
$$;

-- -------------------------------------------------------------
-- complete_task: -> done
--   * include_subtasks = true bo'lsa ochiq subtasklar ham done
--   * takrorlanuvchi vazifa: 'completed' hodisasi yoziladi, so'ng
--     vazifa keyingi sanaga suriladi va 'planned' ga qaytadi
-- -------------------------------------------------------------
create or replace function public.complete_task(
  task_id          uuid,
  include_subtasks boolean default false
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

  -- Takrorlanuvchi vazifani keyingi sanaga surish
  if v_task.recurrence is not null then
    v_tz    := public.user_timezone(v_task.user_id);
    v_today := (now() at time zone v_tz)::date;
    v_next  := public.next_occurrence(v_task.due_date, v_task.recurrence, v_today);
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

-- -------------------------------------------------------------
-- uncomplete_task: done -> planned
-- -------------------------------------------------------------
create or replace function public.uncomplete_task(task_id uuid)
returns public.tasks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id   uuid := task_id;
  v_task public.tasks;
begin
  select * into v_task from public.tasks t where t.id = v_id for update;
  if not found then
    raise exception 'Vazifa topilmadi' using errcode = 'P0002';
  end if;

  if v_task.status <> 'done' then
    raise exception 'Vazifa "done" holatida emas (hozir: %)', v_task.status
      using errcode = 'P0001';
  end if;

  update public.tasks t
     set status = 'planned'
   where t.id = v_id
  returning t.* into v_task;

  return v_task;
end;
$$;

-- -------------------------------------------------------------
-- Huquqlar
-- -------------------------------------------------------------
revoke execute on function public.start_task(uuid)                from public;
revoke execute on function public.move_back(uuid)                 from public;
revoke execute on function public.complete_task(uuid, boolean)    from public;
revoke execute on function public.uncomplete_task(uuid)           from public;

grant execute on function public.start_task(uuid)                 to authenticated;
grant execute on function public.move_back(uuid)                  to authenticated;
grant execute on function public.complete_task(uuid, boolean)     to authenticated;
grant execute on function public.uncomplete_task(uuid)            to authenticated;
grant execute on function public.next_occurrence(date, text, date) to authenticated;
