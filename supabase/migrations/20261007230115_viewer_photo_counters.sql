-- Explicit viewer opens use a single-row, atomic counter update.
create or replace function public.increment_photo_view(photo_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_views integer;
begin
  update public.photos as p
  set views = coalesce(p.views, 0) + 1
  where p.id = increment_photo_view.photo_id
  returning p.views into new_views;
  return new_views;
end;
$$;

-- Keep the existing signature, but reject arbitrary deltas and fix search_path.
create or replace function public.increment_photo_likes(photo_id uuid, delta integer)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_likes integer;
begin
  if delta is null or delta not in (1, -1) then
    raise exception 'delta must be +1 or -1' using errcode = '22023';
  end if;
  update public.photos as p
  set likes = greatest(0, coalesce(p.likes, 0) + delta)
  where p.id = increment_photo_likes.photo_id
  returning p.likes into new_likes;
  return new_likes;
end;
$$;

revoke all on function public.increment_photo_view(uuid) from public, anon, authenticated, service_role;
revoke all on function public.increment_photo_likes(uuid, integer) from public, anon, authenticated, service_role;
grant execute on function public.increment_photo_view(uuid) to anon, authenticated;
grant execute on function public.increment_photo_likes(uuid, integer) to anon, authenticated;
