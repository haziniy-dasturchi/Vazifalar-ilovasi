-- =============================================================
-- Vazifalar — 07. Indekslar (ko'p so'raladigan ustunlar)
-- =============================================================

-- folders: yon panel ro'yxati
create index folders_user_sort_idx
  on public.folders (user_id, sort_order, created_at);
create index folders_user_active_idx
  on public.folders (user_id)
  where not is_archived;

-- sections: papka ichidagi bo'limlar
create index sections_user_folder_idx
  on public.sections (user_id, folder_id, sort_order);

-- tasks: asosiy so'rovlar
create index tasks_user_status_idx
  on public.tasks (user_id, status);
create index tasks_user_due_date_idx
  on public.tasks (user_id, due_date);
create index tasks_user_folder_idx
  on public.tasks (user_id, folder_id, sort_order);
create index tasks_user_completed_at_idx
  on public.tasks (user_id, completed_at desc);
create index tasks_section_idx
  on public.tasks (section_id)
  where section_id is not null;
create index tasks_parent_idx
  on public.tasks (parent_id)
  where parent_id is not null;
-- "Bugun" / "Kechikkan" ko'rinishlari: faqat ochiq vazifalar
create index tasks_user_open_due_idx
  on public.tasks (user_id, due_date)
  where status <> 'done';

-- labels
create index task_labels_label_idx
  on public.task_labels (label_id);
create index task_labels_user_idx
  on public.task_labels (user_id);

-- pomodoro: hisobotlar
create index pomodoro_user_started_idx
  on public.pomodoro_sessions (user_id, started_at desc);
create index pomodoro_focus_idx
  on public.pomodoro_sessions (user_id, started_at)
  where kind = 'focus' and completed;
create index pomodoro_task_idx
  on public.pomodoro_sessions (task_id)
  where task_id is not null;

-- task_events: hisobotlar
create index task_events_user_created_idx
  on public.task_events (user_id, created_at desc);
create index task_events_user_folder_created_idx
  on public.task_events (user_id, folder_id, created_at desc);
create index task_events_completed_idx
  on public.task_events (user_id, created_at)
  where event = 'completed';
create index task_events_task_idx
  on public.task_events (task_id)
  where task_id is not null;
