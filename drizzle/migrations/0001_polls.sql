
create type public.results_visibility as enum ('always','after_vote','after_close');

insert into public.app_config(key, value) values
 ('free_polls_per_day', '5'),
 ('poll_question_max_length', '200')
on conflict (key) do nothing;

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  question text not null check (char_length(question) between 3 and 200),
  multiple boolean not null default false,
  closes_at timestamptz,
  results_visibility results_visibility not null default 'after_vote',
  status content_status not null default 'published',
  created_at timestamptz not null default now()
);
grant select, delete on public.polls to authenticated;
grant all on public.polls to service_role;
alter table public.polls enable row level security;
create policy "owner reads polls" on public.polls for select to authenticated using (owner_id = auth.uid());
create policy "owner deletes polls" on public.polls for delete to authenticated using (owner_id = auth.uid());

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  position int not null
);
grant all on public.poll_options to service_role;
alter table public.poll_options enable row level security;

-- Ballots: one per account per poll. No client access at all (owner included).
create table public.poll_ballots (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_id)
);
revoke all on public.poll_ballots from anon, authenticated;
grant all on public.poll_ballots to service_role;
alter table public.poll_ballots enable row level security;

create table public.poll_choices (
  ballot_id uuid not null references public.poll_ballots(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  primary key (ballot_id, option_id)
);
revoke all on public.poll_choices from anon, authenticated;
grant all on public.poll_choices to service_role;
alter table public.poll_choices enable row level security;

create or replace function public.create_poll(_question text, _options text[], _multiple boolean, _closes_at timestamptz, _visibility results_visibility)
returns uuid language plpgsql security definer set search_path = public as $$
declare _id uuid; _q text := btrim(_question); _o text; _i int := 0; _clean text[] := '{}';
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.profiles where id = auth.uid() and suspended) then raise exception 'SENDER_SUSPENDED'; end if;
  if char_length(_q) < 3 or char_length(_q) > public.cfg_int('poll_question_max_length', 200) then raise exception 'BAD_QUESTION'; end if;
  foreach _o in array coalesce(_options, '{}') loop
    if char_length(btrim(_o)) between 1 and 80 then _clean := _clean || btrim(_o); end if;
  end loop;
  if array_length(_clean,1) is null or array_length(_clean,1) < 2 or array_length(_clean,1) > 6 then raise exception 'BAD_OPTIONS'; end if;
  if _closes_at is not null and _closes_at <= now() then raise exception 'BAD_CLOSE'; end if;
  if (select count(*) from public.polls where owner_id = auth.uid() and created_at > now() - interval '1 day')
     >= public.cfg_int('free_polls_per_day', 5) then raise exception 'DAILY_QUOTA'; end if;
  insert into public.polls(owner_id, question, multiple, closes_at, results_visibility)
    values (auth.uid(), _q, coalesce(_multiple,false), _closes_at, coalesce(_visibility,'after_vote')) returning id into _id;
  foreach _o in array _clean loop
    insert into public.poll_options(poll_id, label, position) values (_id, _o, _i); _i := _i + 1;
  end loop;
  return _id;
end $$;
revoke execute on function public.create_poll(text,text[],boolean,timestamptz,results_visibility) from anon, public;
grant execute on function public.create_poll(text,text[],boolean,timestamptz,results_visibility) to authenticated;

-- Public poll view: aggregated counts only, gated by visibility rule. Never voter ids.
create or replace function public.get_poll(_poll_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare _p public.polls; _voted boolean := false; _closed boolean; _show boolean; _is_owner boolean;
begin
  select * into _p from public.polls where id = _poll_id and status = 'published';
  if _p.id is null then return null; end if;
  _closed := _p.closes_at is not null and _p.closes_at <= now();
  _is_owner := auth.uid() is not null and auth.uid() = _p.owner_id;
  if auth.uid() is not null then
    _voted := exists(select 1 from public.poll_ballots where poll_id = _p.id and voter_id = auth.uid());
  end if;
  _show := _p.results_visibility = 'always'
        or (_p.results_visibility = 'after_vote' and (_voted or _closed or _is_owner))
        or (_p.results_visibility = 'after_close' and _closed);
  return jsonb_build_object(
    'id', _p.id, 'question', _p.question, 'multiple', _p.multiple, 'closes_at', _p.closes_at,
    'results_visibility', _p.results_visibility, 'closed', _closed, 'has_voted', _voted, 'is_owner', _is_owner,
    'results_visible', _show,
    'owner_username', (select username from public.profiles where id = _p.owner_id),
    'total_ballots', case when _show then (select count(*) from public.poll_ballots where poll_id = _p.id) else null end,
    'options', (select jsonb_agg(jsonb_build_object('id', o.id, 'label', o.label,
        'count', case when _show then (select count(*) from public.poll_choices c where c.option_id = o.id) else null end) order by o.position)
      from public.poll_options o where o.poll_id = _p.id)
  );
end $$;
grant execute on function public.get_poll(uuid) to anon, authenticated;

create or replace function public.cast_vote(_poll_id uuid, _option_ids uuid[])
returns void language plpgsql security definer set search_path = public as $$
declare _p public.polls; _ballot uuid; _n int; _valid int;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.profiles where id = auth.uid() and suspended) then raise exception 'SENDER_SUSPENDED'; end if;
  select * into _p from public.polls where id = _poll_id and status = 'published';
  if _p.id is null then raise exception 'NOT_FOUND'; end if;
  if _p.closes_at is not null and _p.closes_at <= now() then raise exception 'POLL_CLOSED'; end if;
  _n := coalesce(array_length(_option_ids, 1), 0);
  if _n = 0 or (not _p.multiple and _n > 1) then raise exception 'BAD_CHOICE'; end if;
  select count(distinct id) into _valid from public.poll_options where poll_id = _poll_id and id = any(_option_ids);
  if _valid <> _n then raise exception 'BAD_CHOICE'; end if;
  insert into public.poll_ballots(poll_id, voter_id) values (_poll_id, auth.uid())
    on conflict (poll_id, voter_id) do nothing returning id into _ballot;
  if _ballot is null then raise exception 'ALREADY_VOTED'; end if;
  insert into public.poll_choices(ballot_id, option_id) select _ballot, unnest(_option_ids);
end $$;
revoke execute on function public.cast_vote(uuid, uuid[]) from anon, public;
grant execute on function public.cast_vote(uuid, uuid[]) to authenticated;
