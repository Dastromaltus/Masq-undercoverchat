import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/inbox/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Messages — Masq" }, { name: "description", content: "Ta boîte de réception privée." }, { property: "og:title", content: "Messages — Masq" }, { property: "og:description", content: "Ta boîte de réception privée." }] }),
  component: Inbox,
});

type Filter = "new" | "archived" | "pending";

function Inbox() {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<Filter>("new");
  const q = useQuery({
    queryKey: ["inbox", filter],
    queryFn: async () => {
      let query = supabase.from("messages").select("id, body, status, allow_reveal, archived, read_at, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (filter === "pending") query = query.eq("status", "pending");
      else query = query.eq("status", "published").eq("archived", filter === "archived");
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
  return (
    <div className="pt-4">
      <h1 className="mb-4 text-3xl font-extrabold">{t.inbox.title}</h1>
      <div className="mb-4 flex gap-2" role="tablist">
        {(Object.keys(t.inbox.filters) as Filter[]).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
            {t.inbox.filters[f]}
          </button>
        ))}
      </div>
      {q.isLoading ? <Spinner /> : q.isError ? <EmptyState title={t.common.error} /> : !q.data?.length ? (
        <EmptyState title={t.inbox.empty} hint={t.inbox.emptyHint} />
      ) : (
        <ul className="space-y-3">
          {q.data.map((m) => (
            <li key={m.id}>
              <Link to="/inbox/$id" params={{ id: m.id }} className="card-surface block p-4 transition-colors hover:border-primary">
                <div className="mb-2 flex items-center gap-2 text-xs">
                  {!m.read_at && <span className="size-2 rounded-full bg-primary" aria-label="new" />}
                  <span className="text-muted-foreground">{new Date(m.created_at).toLocaleString(lang)}</span>
                  {m.status === "pending" && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-warning">{t.inbox.pendingBadge}</span>}
                  {m.allow_reveal && <span className="rounded-full bg-accent px-2 py-0.5 text-accent-foreground">{t.inbox.revealable}</span>}
                </div>
                <p className="line-clamp-3 whitespace-pre-wrap break-words">{m.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
