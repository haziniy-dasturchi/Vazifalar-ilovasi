-- =============================================================
-- pgTAP ning minimal shim versiyasi (faqat lokal tekshiruv uchun)
-- =============================================================
-- Haqiqiy pgTAP Docker'li Supabase muhitida ishlatiladi. Bu shim
-- supabase/tests/*.sql fayllarining MANTIQINI Dockersiz tekshirish
-- imkonini beradi: har bir tasdiq buzilganda exception ko'tariladi,
-- shuning uchun "fayl xatosiz o'tdi" = "barcha tasdiqlar bajarildi".

create or replace function public.plan(integer)
returns text language sql as $$ select '1..' || $1::text $$;

create or replace function public.finish()
returns setof text language sql as $$ select 'tap shim: finish'::text $$;

create or replace function public.ok(boolean, text)
returns text language plpgsql as $$
begin
  if $1 is not true then
    raise exception 'TAP FAIL: %', $2 using errcode = 'P0001';
  end if;
  return 'ok - ' || $2;
end $$;

create or replace function public.is(anyelement, anyelement, text)
returns text language plpgsql as $$
begin
  if $1 is distinct from $2 then
    raise exception 'TAP FAIL: % | kutilgan: % | olingan: %', $3, $2, $1
      using errcode = 'P0001';
  end if;
  return 'ok - ' || $3;
end $$;

create or replace function public.isnt(anyelement, anyelement, text)
returns text language plpgsql as $$
begin
  if $1 is not distinct from $2 then
    raise exception 'TAP FAIL: % | qiymat % bo''lmasligi kerak', $3, $2
      using errcode = 'P0001';
  end if;
  return 'ok - ' || $3;
end $$;

create or replace function public.throws_ok(text, text, text, text)
returns text language plpgsql as $$
declare
  v_state text;
  v_msg   text;
begin
  begin
    execute $1;
  exception when others then
    v_state := sqlstate;
    v_msg   := sqlerrm;
  end;

  if v_state is null then
    raise exception 'TAP FAIL: % | xato kutilgan edi, lekin so''rov bajarildi', $4
      using errcode = 'P0001';
  end if;

  if $2 is not null and v_state <> $2 then
    raise exception 'TAP FAIL: % | sqlstate kutilgan %, olingan % (%)', $4, $2, v_state, v_msg
      using errcode = 'P0001';
  end if;

  if $3 is not null and position($3 in v_msg) = 0 then
    raise exception 'TAP FAIL: % | xato matni mos kelmadi: %', $4, v_msg
      using errcode = 'P0001';
  end if;

  return 'ok - ' || $4;
end $$;

create or replace function public.lives_ok(text, text)
returns text language plpgsql as $$
begin
  begin
    execute $1;
  exception when others then
    raise exception 'TAP FAIL: % | kutilmagan xato: %', $2, sqlerrm
      using errcode = 'P0001';
  end;
  return 'ok - ' || $2;
end $$;
