import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/AppShell";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/_authenticated/polls")({
  head: () => ({ meta: [{ title: "Sondages — Masq" }, { name: "description", content: "Sondages à votes masqués." }, { property: "og:title", content: "Sondages — Masq" }, { property: "og:description", content: "Sondages à votes masqués." }] }),
  component: () => {
    const { t } = useI18n();
    return <div className="pt-4"><h1 className="mb-4 text-3xl font-extrabold">{t.nav.polls}</h1><EmptyState title={t.common.soon} hint={t.soon.polls} /></div>;
  },
});
