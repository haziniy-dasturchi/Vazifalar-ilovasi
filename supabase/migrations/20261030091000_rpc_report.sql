-- =============================================================
-- Vazifalar — 11. RPC: get_report (hisobot)
-- =============================================================
-- Hamma sana hisobi foydalanuvchining vaqt mintaqasida bajariladi.
--
-- Atamalar:
--   * "bajarilgan"  — task_events dagi 'completed' hodisalari soni.
--     Takrorlanuvchi vazifa har bajarilganda hodisa yoziladi, shuning
--     uchun hisobot haqiqiy mehnatni ko'rsatadi.
--   * "belgilangan kun" — least(due_date, deadline). Ikkisidan qaysi biri
--     oldin kelsa — o'sha chegara. NULL lar e'tiborga olinmaydi.
--   * "kechikkan"   — ochiq vazifa, belgilangan kuni bugundan oldin.

-- -------------------------------------------------------------
-- Papka salomatligi: health + o'zbekcha sabab.
-- Qoidalar ketma-ket tekshiriladi, birinchi mos kelgani qaytadi.
-- -------------------------------------------------------------
create or replace function public.folder_health(
  p_open          integer,
  p_completed     integer,
  p_overdue       integer,
  p_last_activity timestamptz
)
returns jsonb
language plpgsql
stable
as $$
declare
  v_ratio numeric := case when p_open > 0 then p_overdue::numeric / p_open else 0 end;
  v_pct   text    := round(v_ratio * 100)::text;
begin
  -- 1) behind
  if p_open > 0 and p_completed = 0 then
    return jsonb_build_object(
      'health', 'behind',
      'reason', 'Bu davrda 0 ta vazifa bajarilmagan');
  end if;

  if v_ratio > 0.30 then
    return jsonb_build_object(
      'health', 'behind',
      'reason', 'Ochiq vazifalarning ' || v_pct || '% i kechikkan');
  end if;

  -- 2) attention
  if p_last_activity is null or p_last_activity < now() - interval '7 days' then
    return jsonb_build_object(
      'health', 'attention',
      'reason', 'Oxirgi 7 kunda hech qanday harakat bo''lmagan');
  end if;

  if v_ratio >= 0.10 then
    return jsonb_build_object(
      'health', 'attention',
      'reason', 'Ochiq vazifalarning ' || v_pct || '% i kechikkan');
  end if;

  -- 3) good
  if p_open = 0 and p_completed = 0 then
    return jsonb_build_object(
      'health', 'good',
      'reason', 'Papkada ochiq vazifa yo''q');
  end if;

  if p_open = 0 then
    return jsonb_build_object(
      'health', 'good',
      'reason', 'Barcha vazifalar bajarilgan');
  end if;

  return jsonb_build_object(
    'health', 'good',
    'reason', 'Davrda ' || p_completed::text || ' ta vazifa bajarilgan, kechikkan ish yo''q');
end;
$$;

comment on function public.folder_health(integer, integer, integer, timestamptz) is
  'Papka holati: behind / attention / good + o''zbekcha qisqa sabab.';

-- -------------------------------------------------------------
-- get_report
-- -------------------------------------------------------------
create or replace function public.get_report(p_from date, p_to date)
returns jsonb
language plpgsql
security invoker
stable
set search_path = public, pg_temp
as $$
declare
  v_uid       uuid := auth.uid();
  v_tz        text;
  v_today     date;
  v_len       integer;
  v_prev_from date;
  v_prev_to   date;
  v_summary   jsonb;
  v_by_day    jsonb;
  v_by_folder jsonb;
begin
  if v_uid is null then
    raise exception 'Avtorizatsiya talab qilinadi' using errcode = '42501';
  end if;

  if p_from is null or p_to is null then
    raise exception 'p_from va p_to to''ldirilishi shart' using errcode = '22023';
  end if;

  if p_to < p_from then
    raise exception 'Noto''g''ri davr: % .. %', p_from, p_to using errcode = '22023';
  end if;

  v_tz        := public.user_timezone(v_uid);
  v_today     := (now() at time zone v_tz)::date;
  v_len       := (p_to - p_from) + 1;
  v_prev_from := p_from - v_len;
  v_prev_to   := p_from - 1;

  -- ---------------------------------------------------------
  -- summary
  -- ---------------------------------------------------------
  with completed_events as (
    select e.folder_id,
           (e.created_at at time zone v_tz)::date as d
    from public.task_events e
    where e.user_id = v_uid
      and e.event = 'completed'
      and (e.created_at at time zone v_tz)::date between v_prev_from and p_to
  ),
  focus as (
    select extract(epoch from (s.ended_at - s.started_at)) / 60.0 as minutes
    from public.pomodoro_sessions s
    where s.user_id = v_uid
      and s.kind = 'focus'
      and s.completed
      and s.ended_at is not null
      and (s.started_at at time zone v_tz)::date between p_from and p_to
  ),
  done_tasks as (
    select least(t.due_date, t.deadline) as target,
           (t.completed_at at time zone v_tz)::date as d
    from public.tasks t
    where t.user_id = v_uid
      and t.status = 'done'
      and t.completed_at is not null
      and (t.completed_at at time zone v_tz)::date between p_from and p_to
  ),
  open_tasks as (
    select least(t.due_date, t.deadline) as target
    from public.tasks t
    where t.user_id = v_uid
      and t.status in ('planned', 'in_progress')
  )
  select jsonb_build_object(
    'completed',      (select count(*) from completed_events where d between p_from and p_to),
    'completed_prev', (select count(*) from completed_events where d between v_prev_from and v_prev_to),
    'focus_minutes',  (select coalesce(round(sum(minutes)), 0)::integer from focus),
    'on_time_rate',   (
      select case
               when count(*) = 0 then null
               else round(
                 100.0 * count(*) filter (where target is null or d <= target) / count(*),
                 1)
             end
      from done_tasks
    ),
    'overdue_open',   (select count(*) from open_tasks where target < v_today)
  )
  into v_summary;

  -- ---------------------------------------------------------
  -- by_day
  -- ---------------------------------------------------------
  with days as (
    select g::date as d
    from generate_series(p_from::timestamp, p_to::timestamp, interval '1 day') g
  ),
  per_day as (
    select (e.created_at at time zone v_tz)::date as d,
           count(*) as n
    from public.task_events e
    where e.user_id = v_uid
      and e.event = 'completed'
      and (e.created_at at time zone v_tz)::date between p_from and p_to
    group by 1
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object('date', days.d, 'completed', coalesce(per_day.n, 0))
      order by days.d
    ),
    '[]'::jsonb)
  into v_by_day
  from days
  left join per_day on per_day.d = days.d;

  -- ---------------------------------------------------------
  -- by_folder
  -- ---------------------------------------------------------
  with f as (
    select id, name, color, sort_order, created_at
    from public.folders
    where user_id = v_uid
      and not is_archived
  ),
  f_completed as (
    select e.folder_id, count(*) as n
    from public.task_events e
    where e.user_id = v_uid
      and e.event = 'completed'
      and e.folder_id is not null
      and (e.created_at at time zone v_tz)::date between p_from and p_to
    group by 1
  ),
  f_open as (
    select t.folder_id,
           count(*) as n,
           count(*) filter (where least(t.due_date, t.deadline) < v_today) as overdue
    from public.tasks t
    where t.user_id = v_uid
      and t.status in ('planned', 'in_progress')
    group by 1
  ),
  f_focus as (
    select t.folder_id,
           sum(extract(epoch from (s.ended_at - s.started_at)) / 60.0) as minutes
    from public.pomodoro_sessions s
    join public.tasks t on t.id = s.task_id
    where s.user_id = v_uid
      and s.kind = 'focus'
      and s.completed
      and s.ended_at is not null
      and (s.started_at at time zone v_tz)::date between p_from and p_to
    group by 1
  ),
  f_last as (
    select e.folder_id, max(e.created_at) as last_activity_at
    from public.task_events e
    where e.user_id = v_uid
      and e.folder_id is not null
    group by 1
  ),
  folder_rows as (
    select f.id,
           f.name,
           f.color,
           f.sort_order,
           coalesce(f_completed.n, 0)::integer       as completed,
           coalesce(f_open.n, 0)::integer            as open,
           coalesce(f_open.overdue, 0)::integer      as overdue,
           coalesce(round(f_focus.minutes), 0)::integer as focus_minutes,
           f_last.last_activity_at,
           -- Yangi papka darhol "attention" bo'lib qolmasligi uchun
           -- papka yaratilgan vaqt ham harakat deb hisoblanadi.
           public.folder_health(
             coalesce(f_open.n, 0)::integer,
             coalesce(f_completed.n, 0)::integer,
             coalesce(f_open.overdue, 0)::integer,
             greatest(f_last.last_activity_at, f.created_at)
           ) as h
    from f
    left join f_completed on f_completed.folder_id = f.id
    left join f_open      on f_open.folder_id      = f.id
    left join f_focus     on f_focus.folder_id     = f.id
    left join f_last      on f_last.folder_id      = f.id
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'folder_id',        id,
        'name',             name,
        'color',            color,
        'completed',        completed,
        'open',             "open",
        'overdue',          overdue,
        'focus_minutes',    focus_minutes,
        'last_activity_at', last_activity_at,
        'health',           h ->> 'health',
        'reason',           h ->> 'reason'
      )
      order by sort_order, name
    ),
    '[]'::jsonb)
  into v_by_folder
  from folder_rows;

  return jsonb_build_object(
    'summary',   v_summary,
    'by_day',    v_by_day,
    'by_folder', v_by_folder
  );
end;
$$;

comment on function public.get_report(date, date) is
  'Davr bo''yicha hisobot: summary, by_day, by_folder (health + sabab bilan).';

revoke execute on function public.get_report(date, date) from public;
grant  execute on function public.get_report(date, date) to authenticated;
grant  execute on function public.folder_health(integer, integer, integer, timestamptz) to authenticated;
