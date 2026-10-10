
create or replace function public.set_username(_username text)
returns void language plpgsql security definer set search_path = public as $$
declare _u text := lower(btrim(_username));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if _u !~ '^[a-z0-9_]{3,20}$' then raise exception 'BAD_USERNAME'; end if;
  if exists(select 1 from public.profiles where username = _u and id <> auth.uid()) then raise exception 'USERNAME_TAKEN'; end if;
  update public.profiles set username = _u where id = auth.uid();
end $$;
revoke execute on function public.set_username(text) from anon, public;
grant execute on function public.set_username(text) to authenticated;
