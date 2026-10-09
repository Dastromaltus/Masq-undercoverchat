
-- Default privileges granted broad table rights; replace with explicit minimal grants.
revoke all on public.blocks, public.messages, public.profiles, public.inbox_settings, public.message_replies,
  public.reports, public.user_roles, public.app_config, public.polls, public.poll_options,
  public.moderation_actions, public.audit_logs, public.message_sender_links, public.poll_ballots, public.poll_choices
  from anon, authenticated;

grant select on public.app_config to anon, authenticated;
grant select on public.user_roles to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, avatar_url, bio, instagram_url) on public.profiles to authenticated;
grant select on public.inbox_settings to authenticated;
grant update (welcome_question, accepting, allow_reveal_requests, updated_at) on public.inbox_settings to authenticated;
grant select, delete on public.messages to authenticated;
grant update (archived, read_at) on public.messages to authenticated;
grant select, insert, delete on public.message_replies to authenticated;
grant select (id, blocker_id, source_message_id, created_at), delete on public.blocks to authenticated;
grant select on public.reports to authenticated;
grant select, delete on public.polls to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
