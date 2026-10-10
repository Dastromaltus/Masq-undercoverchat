import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/channels")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "Canaux — Masq" }, { name: "description", content: "Canaux privés sous pseudonyme." }, { property: "og:title", content: "Canaux — Masq" }, { property: "og:description", content: "Canaux privés sous pseudonyme." }] }),
  component: () => {
    const { t } = useI18n();
    return <div className="pt-4"><h1 className="mb-4 text-3xl font-extrabold">{t.nav.channels}</h1><EmptyState title={t.common.soon} hint={t.soon.channels} /></div>;
  },
});
