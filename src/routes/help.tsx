import { createFileRoute } from "@tanstack/react-router";
import { AppShell, FooterLinks } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/help")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Aide et signalement — Masq" }, { name: "description", content: "Signaler un contenu, bloquer, gérer ta boîte." }, { property: "og:title", content: "Aide — Masq" }, { property: "og:description", content: "Signaler un contenu, bloquer, gérer ta boîte." }] }),
  component: () => {
    const { t } = useI18n();
    return (
      <AppShell>
        <h1 className="mb-4 pt-4 text-3xl font-extrabold">{t.help.title}</h1>
        <div className="space-y-3">
          {[[t.help.q1, t.help.a1], [t.help.q2, t.help.a2], [t.help.q3, t.help.a3]].map(([q, a]) => (
            <details key={q} className="card-surface p-4"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-sm text-muted-foreground">{a}</p></details>
          ))}
          <p role="note" className="rounded-xl bg-destructive/15 p-4 text-sm">{t.help.urgent}</p>
        </div>
        <FooterLinks />
      </AppShell>
    );
  },
});
