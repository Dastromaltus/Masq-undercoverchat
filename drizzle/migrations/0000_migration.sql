
-- ===== Roles =====
create type public.app_role as enum ('admin', 'moderator', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- ===== Config (quotas, rules) — editable without code =====
create table public.app_config (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.app_config to authenticated, anon;
grant all on public.app_config to service_role;
alter table public.app_config enable row level security;
create policy "config readable" on public.app_config for select using (true);

insert into public.app_config(key, value) values
 ('message_max_length', '500'),
 ('free_daily_messages_sent', '20'),
 ('sender_per_minute_limit', '3'),
 ('blocked_terms', '["kill yourself","suicide-toi"]'),
 ('retention_days_deleted_messages', '30'),
 ('ai_moderation_provider', 'null');

create or replace function public.cfg_int(_key text, _default int)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((select (value #>> '{}')::int from public.app_config where key = _key), _default)
$$;

-- ===== Profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_url text check (char_length(avatar_url) <= 500),
  bio text check (char_length(bio) <= 280),
  instagram_url text check (instagram_url is null or instagram_url ~ '^https://(www\.)?instagram\.com/[A-Za-z0-9_.]{1,30}/?$'),
  age_declared_at timestamptz not null,
  age_verification_status text not null default 'self_declared', -- future: 'verified' via provider
  suspended boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url, bio, instagram_url) on public.profiles to authenticated;

create table public.inbox_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  welcome_question text not null default 'Pose-moi une question 👀' check (char_length(welcome_question) between 1 and 140),
  accepting boolean not null default true,
  allow_reveal_requests boolean not null default true,
  updated_at timestamptz not null default now()
);
grant select, update on public.inbox_settings to authenticated;
grant all on public.inbox_settings to service_role;
alter table public.inbox_settings enable row level security;
create policy "own inbox settings read" on public.inbox_settings for select to authenticated using (user_id = auth.uid());
create policy "own inbox settings update" on public.inbox_settings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare _u text;
begin
  _u := lower(coalesce(new.raw_user_meta_data->>'username', ''));
  if _u !~ '^[a-z0-9_]{3,20}$' then
    _u := 'user_' || substr(replace(new.id::text,'-',''),1,10);
  end if;
  if exists(select 1 from public.profiles where username = _u) then
    _u := left(_u, 14) || '_' || substr(replace(new.id::text,'-',''),1,5);
  end if;
  insert into public.profiles(id, username, age_declared_at)
    values (new.id, _u, now());
  insert into public.inbox_settings(user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===== Messages (no sender column) =====
create type public.content_status as enum ('published','pending','hidden','deleted');
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status content_status not null default 'published',
  allow_reveal boolean not null default false,
  archived boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.messages(recipient_id, created_at desc);
grant select, delete on public.messages to authenticated;
grant update (archived, read_at) on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;
create policy "recipient reads own" on public.messages for select to authenticated
  using (recipient_id = auth.uid() and status in ('published','pending'));
create policy "recipient updates own" on public.messages for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
create policy "recipient deletes own" on public.messages for delete to authenticated
  using (recipient_id = auth.uid());

-- Sender link: NEVER readable by clients. No grants to anon/authenticated, no policies.
create table public.message_sender_links (
  message_id uuid primary key references public.messages(id) on delete cascade,
  sender_id uuid not null,
  created_at timestamptz not null default now()
);
create index on public.message_sender_links(sender_id, created_at desc);
revoke all on public.message_sender_links from anon, authenticated;
grant all on public.message_sender_links to service_role;
alter table public.message_sender_links enable row level security;

create table public.message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.message_replies to authenticated;
grant all on public.message_replies to service_role;
alter table public.message_replies enable row level security;
create policy "author reads replies" on public.message_replies for select to authenticated using (author_id = auth.uid());
create policy "recipient replies" on public.message_replies for insert to authenticated
  with check (author_id = auth.uid() and exists (select 1 from public.messages m where m.id = message_id and m.recipient_id = auth.uid()));
create policy "author deletes replies" on public.message_replies for delete to authenticated using (author_id = auth.uid());

-- ===== Blocks (blocked id never exposed) =====
create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null,
  source_message_id uuid,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);
grant select (id, blocker_id, source_message_id, created_at), delete on public.blocks to authenticated;
grant all on public.blocks to service_role;
alter table public.blocks enable row level security;
create policy "blocker reads" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "blocker deletes" on public.blocks for delete to authenticated using (blocker_id = auth.uid());

-- ===== Reports & moderation =====
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('message','user','channel_message','channel_member','other')),
  message_id uuid references public.messages(id) on delete set null,
  reason text not null check (reason in ('harassment','hate','sexual','self_harm','spam','personal_info','other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open','actioned','dismissed')),
  created_at timestamptz not null default now()
);
grant select on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reporter reads own" on public.reports for select to authenticated using (reporter_id = auth.uid());

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null,
  report_id uuid references public.reports(id) on delete set null,
  message_id uuid,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);
grant all on public.moderation_actions to service_role;
alter table public.moderation_actions enable row level security;

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target text,
  justification text,
  created_at timestamptz not null default now()
);
grant all on public.audit_logs to service_role;
alter table public.audit_logs enable row level security;

-- ===== RPCs =====
create or replace function public.username_available(_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select lower(_username) ~ '^[a-z0-9_]{3,20}$' and not exists(select 1 from public.profiles where username = lower(_username))
$$;
grant execute on function public.username_available(text) to anon, authenticated;

-- Public profile: only safe fields; never id/email.
create or replace function public.get_public_profile(_username text)
returns table(username text, display_name text, avatar_url text, bio text, welcome_question text, accepting boolean)
language sql stable security definer set search_path = public as $$
  select p.username, p.display_name, p.avatar_url, p.bio, s.welcome_question, (s.accepting and not p.suspended)
  from public.profiles p join public.inbox_settings s on s.user_id = p.id
  where p.username = lower(_username)
$$;
grant execute on function public.get_public_profile(text) to anon, authenticated;

create or replace function public.send_message(_username text, _body text, _allow_reveal boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  _sender uuid := auth.uid();
  _recipient uuid; _accepting boolean; _suspended boolean;
  _body_clean text := btrim(_body);
  _status content_status := 'published';
  _id uuid; _term text;
begin
  if _sender is null then raise exception 'AUTH_REQUIRED'; end if;
  if exists(select 1 from public.profiles where id = _sender and suspended) then raise exception 'SENDER_SUSPENDED'; end if;
  select p.id, s.accepting, p.suspended into _recipient, _accepting, _suspended
    from public.profiles p join public.inbox_settings s on s.user_id = p.id where p.username = lower(_username);
  if _recipient is null then raise exception 'NOT_FOUND'; end if;
  if _recipient = _sender then raise exception 'SELF_SEND'; end if;
  if not _accepting or _suspended then raise exception 'INBOX_CLOSED'; end if;
  if _body_clean is null or char_length(_body_clean) = 0 then raise exception 'EMPTY'; end if;
  if char_length(_body_clean) > public.cfg_int('message_max_length', 500) then raise exception 'TOO_LONG'; end if;
  if exists(select 1 from public.blocks where blocker_id = _recipient and blocked_id = _sender) then
    raise exception 'INBOX_CLOSED'; -- do not reveal block
  end if;
  if (select count(*) from public.message_sender_links where sender_id = _sender and created_at > now() - interval '1 minute')
     >= public.cfg_int('sender_per_minute_limit', 3) then raise exception 'RATE_LIMIT'; end if;
  if (select count(*) from public.message_sender_links where sender_id = _sender and created_at > now() - interval '1 day')
     >= public.cfg_int('free_daily_messages_sent', 20) then raise exception 'DAILY_QUOTA'; end if;
  for _term in select jsonb_array_elements_text(coalesce((select value from public.app_config where key='blocked_terms'),'[]'::jsonb)) loop
    if position(lower(_term) in lower(_body_clean)) > 0 then _status := 'pending'; end if;
  end loop;
  insert into public.messages(recipient_id, body, status, allow_reveal)
    values (_recipient, _body_clean, _status, coalesce(_allow_reveal,false)) returning id into _id;
  insert into public.message_sender_links(message_id, sender_id) values (_id, _sender);
  return _id;
end $$;
revoke execute on function public.send_message(text,text,boolean) from anon, public;
grant execute on function public.send_message(text,text,boolean) to authenticated;

create or replace function public.block_message_sender(_message_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare _sender uuid;
begin
  if not exists(select 1 from public.messages where id = _message_id and recipient_id = auth.uid()) then raise exception 'NOT_FOUND'; end if;
  select sender_id into _sender from public.message_sender_links where message_id = _message_id;
  if _sender is null then raise exception 'NOT_FOUND'; end if;
  insert into public.blocks(blocker_id, blocked_id, source_message_id) values (auth.uid(), _sender, _message_id)
    on conflict (blocker_id, blocked_id) do nothing;
end $$;
revoke execute on function public.block_message_sender(uuid) from anon, public;
grant execute on function public.block_message_sender(uuid) to authenticated;

create or replace function public.report_message(_message_id uuid, _reason text, _details text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.messages where id = _message_id and recipient_id = auth.uid()) then raise exception 'NOT_FOUND'; end if;
  if (select count(*) from public.reports where reporter_id = auth.uid() and created_at > now() - interval '1 hour') >= 20 then raise exception 'RATE_LIMIT'; end if;
  insert into public.reports(reporter_id, target_type, message_id, reason, details)
    values (auth.uid(), 'message', _message_id, _reason, nullif(btrim(_details),''));
end $$;
revoke execute on function public.report_message(uuid,text,text) from anon, public;
grant execute on function public.report_message(uuid,text,text) to authenticated;

-- Export: never includes sender links
create or replace function public.export_my_data()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) - 'id' from public.profiles p where id = auth.uid()),
    'inbox_settings', (select to_jsonb(s) - 'user_id' from public.inbox_settings s where user_id = auth.uid()),
    'messages_received', coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'body',m.body,'status',m.status,'archived',m.archived,'created_at',m.created_at)) from public.messages m where m.recipient_id = auth.uid()),'[]'),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('message_id',r.message_id,'body',r.body,'created_at',r.created_at)) from public.message_replies r where r.author_id = auth.uid()),'[]'),
    'messages_sent_count', (select count(*) from public.message_sender_links where sender_id = auth.uid()),
    'reports_filed', coalesce((select jsonb_agg(jsonb_build_object('reason',reason,'status',status,'created_at',created_at)) from public.reports where reporter_id = auth.uid()),'[]'),
    'exported_at', now()
  )
$$;
revoke execute on function public.export_my_data() from anon, public;
grant execute on function public.export_my_data() to authenticated;

-- Admin RPCs (no sender identity returned)
create or replace function public.admin_list_reports(_status text default 'open')
returns table(id uuid, reason text, details text, status text, created_at timestamptz, message_id uuid, message_body text, message_status content_status)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator')) then raise exception 'FORBIDDEN'; end if;
  return query select r.id, r.reason, r.details, r.status, r.created_at, m.id, m.body, m.status
    from public.reports r left join public.messages m on m.id = r.message_id
    where r.status = _status order by r.created_at desc limit 200;
end $$;
revoke execute on function public.admin_list_reports(text) from anon, public;
grant execute on function public.admin_list_reports(text) to authenticated;

create or replace function public.admin_resolve_report(_report_id uuid, _action text, _note text)
returns void language plpgsql security definer set search_path = public as $$
declare _mid uuid;
begin
  if not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator')) then raise exception 'FORBIDDEN'; end if;
  if _action not in ('hide','restore','dismiss') then raise exception 'BAD_ACTION'; end if;
  select message_id into _mid from public.reports where id = _report_id;
  if _action = 'hide' and _mid is not null then update public.messages set status = 'hidden' where id = _mid; end if;
  if _action = 'restore' and _mid is not null then update public.messages set status = 'published' where id = _mid; end if;
  update public.reports set status = case when _action = 'dismiss' then 'dismissed' else 'actioned' end where id = _report_id;
  insert into public.moderation_actions(moderator_id, report_id, message_id, action, note) values (auth.uid(), _report_id, _mid, _action, _note);
  insert into public.audit_logs(actor_id, action, target) values (auth.uid(), 'report.'||_action, _report_id::text);
end $$;
revoke execute on function public.admin_resolve_report(uuid,text,text) from anon, public;
grant execute on function public.admin_resolve_report(uuid,text,text) to authenticated;

create or replace function public.admin_list_actions()
returns table(id uuid, action text, note text, created_at timestamptz, report_id uuid)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator')) then raise exception 'FORBIDDEN'; end if;
  return query select a.id, a.action, a.note, a.created_at, a.report_id from public.moderation_actions a order by a.created_at desc limit 100;
end $$;
revoke execute on function public.admin_list_actions() from anon, public;
grant execute on function public.admin_list_actions() to authenticated;

-- Pending-moderation messages for admins: body only
create or replace function public.admin_list_pending()
returns table(id uuid, body text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator')) then raise exception 'FORBIDDEN'; end if;
  return query select m.id, m.body, m.created_at from public.messages m where m.status='pending' order by m.created_at desc limit 200;
end $$;
revoke execute on function public.admin_list_pending() from anon, public;
grant execute on function public.admin_list_pending() to authenticated;

create or replace function public.admin_set_message_status(_message_id uuid, _status content_status, _note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'moderator')) then raise exception 'FORBIDDEN'; end if;
  update public.messages set status = _status where id = _message_id;
  insert into public.moderation_actions(moderator_id, message_id, action, note) values (auth.uid(), _message_id, 'status.'||_status, _note);
  insert into public.audit_logs(actor_id, action, target) values (auth.uid(), 'message.status.'||_status, _message_id::text);
end $$;
revoke execute on function public.admin_set_message_status(uuid,content_status,text) from anon, public;
grant execute on function public.admin_set_message_status(uuid,content_status,text) to authenticated;

-- Account data purge (called before auth user deletion)
create or replace function public.purge_my_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  delete from public.message_sender_links where sender_id = auth.uid();
  delete from public.blocks where blocked_id = auth.uid();
  insert into public.audit_logs(actor_id, action) values (null, 'account.deleted');
end $$;
revoke execute on function public.purge_my_data() from anon, public;
grant execute on function public.purge_my_data() to authenticated;
