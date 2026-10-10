import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/polls/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Sondages — Masq" }, { name: "description", content: "Tes sondages à votes masqués." }, { property: "og:title", content: "Sondages — Masq" }, { property: "og:description", content: "Tes sondages à votes masqués." }] }),
  component: Polls,
});

function Polls() {
  const { t, lang } = useI18n();
  const q = useQuery({
    queryKey: ["my-polls"],
    queryFn: async () => {
      const { data, error } = await supabase.from("polls").select("id, question, closes_at, created_at, multiple").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold">{t.polls.title}</h1>
        <Button asChild variant="hero" size="sm"><Link to="/polls/new"><Plus aria-hidden />{t.polls.create}</Link></Button>
      </div>
      <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">{t.polls.privacy}</p>
      {q.isLoading ? <Spinner /> : q.isError ? <EmptyState title={t.common.error} /> : !q.data?.length ? <EmptyState title={t.polls.empty} /> : (
        <ul className="space-y-3">
          {q.data.map((p) => {
            const closed = p.closes_at && new Date(p.closes_at) <= new Date();
            return (
              <li key={p.id}>
                <Link to="/p/$id" params={{ id: p.id }} className="card-surface block p-4 hover:border-primary">
                  <p className="font-semibold">{p.question}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString(lang)}
                    {closed ? ` · ${t.polls.closed}` : p.closes_at ? ` · ${t.polls.closesOn} ${new Date(p.closes_at).toLocaleString(lang)}` : ""}
                    {p.multiple ? ` · ${t.polls.multiple}` : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
