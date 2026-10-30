-- =============================================================
-- Vazifalar — 08. Row Level Security
-- =============================================================
-- Qoida: foydalanuvchi faqat user_id = auth.uid() bo'lgan qatorlarni
-- ko'radi, qo'shadi, o'zgartiradi va o'chiradi. anon rolida hech qanday
-- siyosat yo'q — demak u hech narsani ko'rmaydi.

alter table public.profiles          enable row level security;
alter table public.folders           enable row level security;
alter table public.sections          enable row level security;
alter table public.tasks             enable row level security;
alter table public.labels            enable row level security;
alter table public.task_labels       enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.task_events       enable row level security;

-- -------------------------------------------------------------
-- profiles (kalit ustun — id)
-- -------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated using (id = auth.uid());

-- -------------------------------------------------------------
-- Qolgan jadvallar — user_id bo'yicha
-- -------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'folders', 'sections', 'tasks', 'labels',
    'task_labels', 'pomodoro_sessions', 'task_events'
  ]
  loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (user_id = auth.uid())',
      t || '_select_own', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid())',
      t || '_insert_own', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t || '_update_own', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (user_id = auth.uid())',
      t || '_delete_own', t);
  end loop;
end;
$$;
