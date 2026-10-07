begin;
select pg_catalog.set_config('romanriv.photo_counter_test', pg_catalog.gen_random_uuid()::text, true);
insert into public.photos (id, category, title, image_path, likes, views)
values (pg_catalog.current_setting('romanriv.photo_counter_test')::uuid, 'food', 'Counter verification', 'food/counter-verification.jpg', 0, 0);
set local role anon;
do $$
declare
  target uuid := pg_catalog.current_setting('romanriv.photo_counter_test')::uuid;
  invalid_delta integer;
  changed integer;
begin
  if public.increment_photo_view(target) <> 1 or public.increment_photo_view(target) <> 2 then
    raise exception 'Photo view increments failed';
  end if;
  if public.increment_photo_likes(target, -1) <> 0 or public.increment_photo_likes(target, 1) <> 1
    or public.increment_photo_likes(target, -1) <> 0 then
    raise exception 'Photo like/unlike floor failed';
  end if;
  foreach invalid_delta in array array[null::integer, 0, 2, -2, 2147483647] loop
    begin
      perform public.increment_photo_likes(target, invalid_delta);
      raise exception 'Invalid delta accepted';
    exception when sqlstate '22023' then null;
    end;
  end loop;
  if public.increment_photo_view(null) is not null or public.increment_photo_likes(null, 1) is not null then
    raise exception 'Missing row must return null';
  end if;
  begin
    update public.photos set title = 'Blocked public metadata update' where id = target;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Anon gained metadata UPDATE access'; end if;
  exception when insufficient_privilege then null;
  end;
  if (select title from public.photos where id = target) <> 'Counter verification' then raise exception 'Metadata changed'; end if;
end;
$$;
set local role authenticated;
do $$
declare target uuid := pg_catalog.current_setting('romanriv.photo_counter_test')::uuid;
begin
  if public.increment_photo_view(target) <> 3 or public.increment_photo_likes(target, 1) <> 1 then
    raise exception 'Authenticated photo counter execution failed';
  end if;
end;
$$;
reset role;
select 'PASS: photo views, likes, zero floor, invalid delta, missing row, strict RLS, anon/authenticated access' as result;
rollback;
