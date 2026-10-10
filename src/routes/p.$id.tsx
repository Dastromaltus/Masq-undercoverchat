import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Image as ImageIcon, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, EmptyState, Spinner } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { errorCode, pollQuery } from "@/lib/polls";

export const Route = createFileRoute("/p/$id")({
  staticData: { sitemap: false },
  loader: async ({ params, context }) => {
    try {
      const poll = await context.queryClient.ensureQueryData(pollQuery(params.id));
      return { question: poll?.question ?? null };
    } catch {
      return { question: null };
    }
  },
  head: ({ loaderData }) => {
    const q = loaderData?.question;
    const title = q ? `${q.slice(0, 60)} — Sondage Masq` : "Sondage — Masq";
    const desc = q ? `Vote au sondage « ${q.slice(0, 120)} » sur Masq. Les votes individuels sont masqués.` : "Vote à ce sondage Masq. Les votes individuels sont masqués.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
      ],
    };
  },
  component: PollPage,
});

function PollPage() {
  const { id } = Route.useParams();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const qc = useQueryClient();
  const q = useQuery(pollQuery(id));
  useEffect(() => { qc.invalidateQueries({ queryKey: ["poll", id] }); }, [session, id, qc]);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <AppShell><Spinner /></AppShell>;
  if (q.isError) return <AppShell><EmptyState heading title={t.common.error} /></AppShell>;
  const p = q.data;
  if (!p) return <AppShell><EmptyState heading title={t.polls.notFound} /></AppShell>;

  const toggle = (oid: string) => setSel(p.multiple ? (sel.includes(oid) ? sel.filter((x) => x !== oid) : [...sel, oid]) : [oid]);
  async function vote() {
    setBusy(true);
    const { error } = await supabase.rpc("cast_vote", { _poll_id: id, _option_ids: sel });
    setBusy(false);
    if (error) { const c = errorCode(error.message, t.polls.errors); toast.error(c ? t.polls.errors[c] : t.common.error); return; }
    toast.success(t.polls.voted);
    qc.invalidateQueries({ queryKey: ["poll", id] });
  }
  const total = p.total_ballots ?? 0;
  const canVote = !!session && !p.has_voted && !p.closed;
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <AppShell>
      <div className="space-y-4 pt-4">
        <p className="text-sm text-muted-foreground">{t.polls.by} @{p.owner_username}</p>
        <h1 className="text-2xl font-extrabold">{p.question}</h1>
        <p className="text-xs text-muted-foreground">
          {p.closed ? t.polls.closed : p.closes_at ? `${t.polls.closesOn} ${new Date(p.closes_at).toLocaleString(lang)}` : ""}
          {p.multiple ? ` · ${t.polls.multiple}` : ""}
        </p>
        <ul className="space-y-2">
          {p.options.map((o) => {
            const pct = p.results_visible && total ? Math.round(((o.count ?? 0) / total) * 100) : 0;
            const chosen = sel.includes(o.id);
            return (
              <li key={o.id}>
                <button type="button" disabled={!canVote} onClick={() => toggle(o.id)} aria-pressed={chosen}
                  className={`relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-colors ${chosen ? "border-primary" : "border-border"} ${canVote ? "hover:border-primary" : ""}`}>
                  {p.results_visible && <span className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${pct}%` }} aria-hidden />}
                  <span className="relative flex justify-between gap-2 font-semibold">
                    <span>{o.label}</span>
                    {p.results_visible && <span>{pct}% <span className="text-xs text-muted-foreground">({o.count})</span></span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {p.results_visible ? <p className="text-sm text-muted-foreground">{total} {t.polls.ballots}</p> : <p className="text-sm text-muted-foreground">{t.polls.hidden}</p>}
        {!session && !p.closed && (
          <div className="card-surface space-y-3 p-4">
            <p className="text-sm text-muted-foreground">{t.polls.loginToVote}</p>
            <Button asChild variant="hero" className="w-full"><Link to="/auth" search={{ next: `/p/${id}` }}>{t.common.signIn}</Link></Button>
          </div>
        )}
        {canVote && <Button variant="hero" className="w-full" disabled={busy || !sel.length} onClick={vote}>{t.polls.vote}</Button>}
        {p.has_voted && <p className="text-sm text-success">{t.polls.alreadyVoted}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={async () => { await navigator.clipboard.writeText(url); toast.success(t.common.copied); }}><Copy aria-hidden />{t.common.copy}</Button>
          {p.is_owner && (
            <Button asChild variant="secondary" className="flex-1"><Link to="/studio" search={{ kind: "poll", id }}><ImageIcon aria-hidden />{t.polls.share}</Link></Button>
          )}
        </div>
        <p className="flex gap-2 text-xs text-muted-foreground"><Lock className="size-3.5 shrink-0" aria-hidden />{t.polls.privacy}</p>
      </div>
    </AppShell>
  );
}
