-- Public callers may change only these counters; anime RLS policies stay intact.
create or replace function public.increment_anime_views(anime_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_views integer;
begin
  update public.anime as a
  set views = coalesce(a.views, 0) + 1
  where a.id = increment_anime_views.anime_id
  returning a.views into new_views;
  return new_views;
end;
$$;

create or replace function public.increment_anime_likes(anime_id uuid, delta integer)
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
  update public.anime as a
  set likes = greatest(0, coalesce(a.likes, 0) + delta)
  where a.id = increment_anime_likes.anime_id
  returning a.likes into new_likes;
  return new_likes;
end;
$$;

-- Remove implicit/default grants, then allow only public application callers.
revoke all on function public.increment_anime_views(uuid) from public, anon, authenticated, service_role;
revoke all on function public.increment_anime_likes(uuid, integer) from public, anon, authenticated, service_role;
grant execute on function public.increment_anime_views(uuid) to anon, authenticated;
grant execute on function public.increment_anime_likes(uuid, integer) to anon, authenticated;
