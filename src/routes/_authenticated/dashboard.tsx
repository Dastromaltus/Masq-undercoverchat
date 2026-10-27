import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Spinner, EmptyState, PrivacyNotice } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { meQuery, publicUrl } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/dashboard")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Accueil — Masq" }, { name: "description", content: "Ton tableau de bord Masq." }, { property: "og:title", content: "Accueil — Masq" }, { property: "og:description", content: "Ton tableau de bord Masq." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useI18n();
  const me = useQuery(meQuery);
  const unread = useQuery({
    queryKey: ["unread-count"],
    queryFn: async () => {
      const { count } = await supabase.from("messages").select("id", { count: "exact", head: true })
        .is("read_at", null).eq("archived", false);
      return count ?? 0;
    },
  });
  if (me.isLoading) return <Spinner />;
  if (!me.data) return <EmptyState title={t.common.error} />;
  const { profile, settings } = me.data;
  const url = publicUrl(profile.username);
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ url, title: "Masq" }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t.common.copied);
    }
  }
  return (
    <div className="space-y-4 pt-4">
      <h1 className="text-3xl font-extrabold">{t.dashboard.hello} @{profile.username} 👋</h1>
      <section className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-glow">
        <p className="text-sm font-semibold opacity-80">{t.dashboard.yourLink}</p>
        <p className="mt-1 break-all font-display text-lg font-bold">{url.replace(/^https?:\/\//, "")}</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" size="sm" onClick={async () => { await navigator.clipboard.writeText(url); toast.success(t.common.copied); }}>
            <Copy aria-hidden /> {t.common.copy}
          </Button>
          <Button variant="secondary" size="sm" onClick={share}><Share2 aria-hidden /> {t.studio.share}</Button>
          <Button asChild variant="secondary" size="sm"><Link to="/studio" search={{ kind: "question" }}>{t.inbox.share}</Link></Button>
        </div>
        <p className="mt-3 text-xs opacity-80">{t.dashboard.shareHint}</p>
      </section>
      <section className="card-surface flex items-center justify-between p-5">
        <div>
          <p className="font-display text-3xl font-bold">{unread.data ?? "–"}</p>
          <p className="text-sm text-muted-foreground">{t.dashboard.newMessages}</p>
          <p className={`mt-1 text-xs ${settings.accepting ? "text-success" : "text-warning"}`}>
            ● {settings.accepting ? t.dashboard.active : t.dashboard.paused}
          </p>
        </div>
        <Button asChild variant="hero"><Link to="/inbox">{t.dashboard.openInbox}</Link></Button>
      </section>
      <PrivacyNotice />
    </div>
  );
}
