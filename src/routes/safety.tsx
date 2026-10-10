import { createFileRoute } from "@tanstack/react-router";
import { AppShell, FooterLinks, PrivacyNotice } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/safety")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "Sécurité et confidentialité — Masq" }, { name: "description", content: "Comment Masq protège ton identité, et ses limites." }, { property: "og:title", content: "Sécurité et confidentialité — Masq" }, { property: "og:description", content: "Comment Masq protège ton identité, et ses limites." }] }),
  component: () => {
    const { t } = useI18n();
    return (
      <AppShell>
        <h1 className="mb-4 pt-4 text-3xl font-extrabold">{t.safety.title}</h1>
        <div className="space-y-3">
          {[t.safety.p1, t.safety.p2, t.safety.p3, t.safety.p4, t.safety.p5].map((p) => <p key={p} className="card-surface p-4 text-sm leading-relaxed">{p}</p>)}
          <PrivacyNotice />
        </div>
        <FooterLinks />
      </AppShell>
    );
  },
});
