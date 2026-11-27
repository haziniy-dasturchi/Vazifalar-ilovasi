-- =============================================================
-- Bajarilgan vazifani bekor qilish — takrorlanuvchilar uchun ham
-- =============================================================
-- Muammo: "Bugun bajarildi" ro'yxatidagi TAKRORLANUVCHI vazifani
-- qayta bosib ochiq ishlar orasiga qaytarib bo'lmasdi. Sabab:
-- bajarilganda server uni DARHOL keyingi sanaga suradi va
-- "planned" ga qaytaradi — ya'ni uning haqiqiy holati "done"
-- emas, `uncomplete_task` esa faqat "done" dan qaytara oladi.
-- Shuning uchun interfeysda doira umuman o'chirib qo'yilgandi.
--
-- Qaytarish uchun BAJARISHDAN OLDINGI sana kerak. Uni `rrule` dan
-- teskari hisoblab bo'lmaydi: vazifa kechikib yoki erta bajarilgan
-- bo'lsa, keyingi sana jadvaldagi navbatdagi nuqtadan farq qiladi.
-- Shuning uchun sana bajarish paytida saqlab qo'yiladi.

-- -------------------------------------------------------------
-- 0. Foiz/holat triggeri — bazadagi haqiqiy holatni fayllarga yozish
-- -------------------------------------------------------------
-- Bu funksiya PRODUCTION'da allaqachon shunday turibdi, lekin unga
-- tegishli migratsiya fayli yozilmay qolgan (bazada qo'lda
-- tuzatilgan). Natijada `tools/migratsiya-sinov.mjs` eski — buzuq —
-- variantni sinardi: unda `done -> planned` o'zgarishida foiz hamon
-- 100 bo'lgani uchun trigger vazifani DARHOL yana "done" ga
-- qaytarardi va `tasks_done_has_completed_at_chk` ni buzardi.
-- Shuning uchun aynan jonli variant shu yerga ko'chirilyapti:
-- production uchun bu hech narsani o'zgartirmaydi, lokal sinov esa
-- endi haqiqatga mos ishlaydi.
create or replace function public.tg_tasks_progress_sync()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.progress = 100 then
      new.status := 'done';
    elsif new.status = 'done' then
      new.progress := 100;
    end if;
    return new;
  end if;

  -- MUHIM: faqat "nima o'zgardi" ga qaraymiz. Aks holda bajarilgan
  -- vazifani qaytarishga urinilganda (status done -> planned, progress
  -- hali ham 100) quyidagi qoida uni darhol yana done ga qaytarib
  -- yuborardi va vazifani ochib bo'lmasdi.

  -- 1) Bajarilgandan qaytarildi -> doira bo'shaydi
  if old.status = 'done' and new.status <> 'done' then
    if new.progress = old.progress then
      new.progress := 0;
    end if;
    return new;
  end if;

  -- 2) Foiz 100 ga yetkazildi -> vazifa bajarildi
  if new.progress = 100 and old.progress <> 100 then
    new.status := 'done';
    return new;
  end if;

  -- 3) Bajarildi deb belgilandi -> foiz to'liq
  if new.status = 'done' and old.status <> 'done' then
    new.progress := 100;
    return new;
  end if;

  -- 4) Bajarilgan vazifada foiz pasaytirildi -> qaytadan ochiladi
  if new.status = 'done' and old.status = 'done'
     and new.progress < 100 and new.progress <> old.progress then
    new.status := 'planned';
    return new;
  end if;

  -- 5) Qolgan hollarda: done bo'lsa foiz doim to'liq
  if new.status = 'done' then
    new.progress := 100;
  end if;

  return new;
end;
$$;

-- -------------------------------------------------------------
-- 1. Surishdan oldingi sana
-- -------------------------------------------------------------
alter table public.tasks
  add column prev_due_date date;

comment on column public.tasks.prev_due_date is
  'Takrorlanuvchi vazifa bajarilganda — surishdan OLDINGI due_date. '
  'Bajarishni bekor qilganda shu sana tiklanadi, so''ng null bo''ladi.';

-- -------------------------------------------------------------
-- 2. complete_task — oldingi sanani eslab qoladi
-- -------------------------------------------------------------
-- Faqat bitta qator qo'shiladi (`prev_due_date = t.due_date`),
-- qolgani 20261121090100 dagi variant bilan bir xil.
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
       set status        = 'planned',
           due_date      = v_next,
           -- Bekor qilinsa shu sanaga qaytariladi
           prev_due_date  = coalesce(v_task.due_date, v_today),
           deadline      = case when t.deadline is null then null else t.deadline + v_shift end,
           started_at    = null,
           completed_at  = null
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

-- -------------------------------------------------------------
-- 3. undo_complete_task — ikkala turni ham qaytaradi
-- -------------------------------------------------------------
-- `uncomplete_task` O'RNIGA EMAS, UNING YONIDA turadi: foydalanuvchi
-- telefonidagi PWA keshida eski JS qolgan bo'lishi mumkin va u hamon
-- eski funksiyani chaqiradi.
create or replace function public.undo_complete_task(task_id uuid)
returns public.tasks
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_id      uuid := task_id;
  v_task    public.tasks;
  v_tz      text;
  v_hodisa  date;
  v_tiklash date;
  v_shift   integer;
begin
  select * into v_task from public.tasks t where t.id = v_id for update;
  if not found then
    raise exception 'Vazifa topilmadi' using errcode = 'P0002';
  end if;

  /*
    Hodisa jurnaliga 'uncompleted' YOZILMAYDI va 'completed' yozuvi
    o'chiriladi. Nega: bu tugma "adashib bosdim" uchun — bajarilish
    umuman bo'lmagandek qolishi kerak. Aks holda hisobotda o'sha kun
    "1 ta ish bajarilgan" bo'lib ko'rinaverardi.

    Bundan tashqari "Bugun" sahifasi aynan shu 'completed' yozuvi
    bo'yicha takrorlanuvchi vazifani "bajarilgan" deb ko'rsatadi —
    yozuv qolsa, vazifa bir vaqtning o'zida ham ochiq ro'yxatda,
    ham "Bugun bajarildi" da ikki marta chiqardi.
  */
  perform set_config('vazifalar.skip_events', 'on', true);

  if v_task.status = 'done' then
    -- Oddiy vazifa (yoki takrorlanishi tugagani)
    update public.tasks t
       set status        = 'planned',
           prev_due_date = null
     where t.id = v_id
    returning t.* into v_task;
  else
    /*
      Takrorlanuvchi: bajarilgandan keyin allaqachon surilgan.
      Oldingi sana `prev_due_date` da. Agar u bo'sh bo'lsa (bu
      migratsiyadan OLDIN bajarilgan vazifalar), oxirgi 'completed'
      hodisasining kuniga qaytaramiz — odam o'sha kuni bajargan.
    */
    v_tz := public.user_timezone(v_task.user_id);

    select (e.created_at at time zone v_tz)::date
      into v_hodisa
      from public.task_events e
     where e.task_id = v_id
       and e.event = 'completed'
     order by e.created_at desc
     limit 1;

    v_tiklash := coalesce(v_task.prev_due_date, v_hodisa);

    /*
      Qaytaradigan narsa yo'q. ATAYLAB xato emas: offline navbat
      so'rovni qayta yuborishi mumkin (javob yo'qolgan bo'lsa), va
      ikkinchi urinish foydalanuvchiga "bajarib bo'lmadi" degan
      qizil xabar chiqarib, hamma narsa joyida bo'lsa ham qo'rqitardi.
    */
    if v_tiklash is null then
      perform set_config('vazifalar.skip_events', 'off', true);
      return v_task;
    end if;

    v_shift := coalesce(v_task.due_date, v_tiklash) - v_tiklash;

    update public.tasks t
       set status        = 'planned',
           due_date      = v_tiklash,
           prev_due_date = null,
           deadline      = case when t.deadline is null then null else t.deadline - v_shift end,
           started_at    = null,
           completed_at  = null
     where t.id = v_id
    returning t.* into v_task;
  end if;

  -- Shu bajarilishga tegishli yozuvni olib tashlaymiz
  delete from public.task_events e
   where e.id = (
     select e2.id
       from public.task_events e2
      where e2.task_id = v_id
        and e2.event = 'completed'
      order by e2.created_at desc
      limit 1
   );

  perform set_config('vazifalar.skip_events', 'off', true);

  return v_task;
end;
$$;

comment on function public.undo_complete_task(uuid) is
  'Bajarishni bekor qiladi. Takrorlanuvchi vazifa oldingi sanasiga qaytadi, '
  '"completed" hodisasi jurnaldan o''chadi (adashib bosilgan hisoblanadi).';

revoke execute on function public.undo_complete_task(uuid) from public;
grant  execute on function public.undo_complete_task(uuid) to authenticated;
