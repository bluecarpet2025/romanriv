-- Run with a privileged database connection. All fixture changes are rolled back.
begin;
select pg_catalog.set_config('romanriv.counter_test_id', pg_catalog.gen_random_uuid()::text, true);
insert into public.anime (id, title, sort_order)
values (pg_catalog.current_setting('romanriv.counter_test_id')::uuid, 'Counter RPC verification', 2147483647);

set local role anon;
do $$
declare
  target uuid := pg_catalog.current_setting('romanriv.counter_test_id')::uuid;
  invalid_delta integer;
  changed integer;
begin
  if public.increment_anime_views(target) <> 1 or public.increment_anime_views(target) <> 2 then
    raise exception 'Anon view increments failed';
  end if;
  if public.increment_anime_likes(target, -1) <> 0
    or public.increment_anime_likes(target, 1) <> 1
    or public.increment_anime_likes(target, -1) <> 0 then
    raise exception 'Anon like/unlike or zero floor failed';
  end if;
  foreach invalid_delta in array array[null::integer, 0, 2, -2, 2147483647] loop
    begin
      perform public.increment_anime_likes(target, invalid_delta);
      raise exception 'Invalid delta accepted: %', invalid_delta;
    exception when sqlstate '22023' then
      null;
    end;
  end loop;
  if public.increment_anime_views(null) is not null
    or public.increment_anime_likes(null, 1) is not null then
    raise exception 'Missing row must return null';
  end if;
  begin
    update public.anime set title = 'Public update must be blocked' where id = target;
    get diagnostics changed = row_count;
    if changed <> 0 then
      raise exception 'Anon gained general anime UPDATE access';
    end if;
  exception when insufficient_privilege then
    null;
  end;
  if (select title from public.anime where id = target) <> 'Counter RPC verification' then
    raise exception 'Metadata changed through anonymous access';
  end if;
end;
$$;

set local role authenticated;
do $$
declare
  target uuid := pg_catalog.current_setting('romanriv.counter_test_id')::uuid;
begin
  if public.increment_anime_views(target) <> 3 or public.increment_anime_likes(target, 1) <> 1 then
    raise exception 'Authenticated counter execution failed';
  end if;
end;
$$;
reset role;
select 'PASS: anon/authenticated counters, zero floor, delta validation, missing row, unchanged RLS' as result;
rollback;
