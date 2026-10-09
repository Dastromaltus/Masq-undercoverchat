<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Sender identity lives only in `message_sender_links` (no client grants); all sender-dependent actions go through SECURITY DEFINER RPCs — why: the recipient's browser must never receive the sender link.
- Quotas, length limits and blocked terms live in `app_config` rows — why: configurable without code changes.
- Privileged roles live in `user_roles`, checked via `has_role()`; never assigned from the client — why: prevents privilege escalation.
- All UI strings live in `src/i18n/{fr,en}.ts` (en typed against fr) — why: complete FR/EN parity.
- Age is self-declared (`profiles.age_verification_status`) — why: a future verification provider can update this field without schema redesign.
