import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AppShell, FooterLinks } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({ meta: [{ title: "Tarifs — Masq" }, { name: "description", content: "Offres Gratuit, Plus, Creator et Community." }, { property: "og:title", content: "Tarifs — Masq" }, { property: "og:description", content: "Offres Gratuit, Plus, Creator et Community." }] }),
  component: Pricing,
});

function Pricing() {
  const { t } = useI18n();
  const plans = [t.pricing.plans.free, t.pricing.plans.plus, t.pricing.plans.creator, t.pricing.plans.community];
  return (
    <AppShell>
      <h1 className="mb-3 pt-4 text-3xl font-extrabold">{t.pricing.title}</h1>
      <p role="status" className="mb-4 rounded-xl bg-warning/15 p-3 text-sm text-warning">{t.pricing.notConfigured}</p>
      <div className="space-y-3">
        {plans.map((p, i) => (
          <article key={p.name} className={`card-surface p-5 ${i === 1 ? "border-primary" : ""}`}>
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p><span className="font-display text-2xl font-bold">{p.price}</span>{i > 0 && <span className="text-xs text-muted-foreground"> {t.pricing.perMonth}</span>}</p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {p.f.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{f}</li>)}
            </ul>
            {i > 0 && <Button className="mt-4 w-full" variant="secondary" disabled>{t.pricing.unavailable}</Button>}
          </article>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t.pricing.safetyFree}</p>
      <FooterLinks />
    </AppShell>
  );
}
