import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/channels")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Canaux — Masq" }, { name: "description", content: "Canaux privés sous pseudonyme." }, { property: "og:title", content: "Canaux — Masq" }, { property: "og:description", content: "Canaux privés sous pseudonyme." }] }),
  component: () => {
    const { t } = useI18n();
    return <div className="pt-4"><h1 className="mb-4 text-3xl font-extrabold">{t.nav.channels}</h1><EmptyState title={t.common.soon} hint={t.soon.channels} /></div>;
  },
});
