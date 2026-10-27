import { createFileRoute } from "@tanstack/react-router";
import { AppShell, FooterLinks } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/legal")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Documents légaux (brouillons) — Masq" }, { name: "description", content: "Mentions légales, confidentialité et conditions — brouillons à valider." }, { property: "og:title", content: "Documents légaux — Masq" }, { property: "og:description", content: "Brouillons à faire valider." }] }),
  component: () => {
    const { t } = useI18n();
    return (
      <AppShell>
        <h1 className="mb-3 pt-4 text-3xl font-extrabold">{t.legal.title}</h1>
        <p role="note" className="mb-4 rounded-xl bg-warning/15 p-3 text-sm text-warning">⚠️ {t.common.draft}. {t.legal.warning}</p>
        {[[t.legal.mentions, t.legal.mentionsBody], [t.legal.privacy, t.legal.privacyBody], [t.legal.terms, t.legal.termsBody]].map(([h, b]) => (
          <section key={h} className="card-surface mb-3 p-4"><h2 className="font-bold">{h}</h2><p className="mt-2 text-sm text-muted-foreground">{b}</p></section>
        ))}
        <FooterLinks />
      </AppShell>
    );
  },
});
