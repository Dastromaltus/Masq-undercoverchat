import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { AppShell, FooterLinks } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/use-auth";
import { createCheckout, createPortal, getSubscription } from "@/lib/billing.functions";
import type { PlanKey } from "@/lib/plans";

export const Route = createFileRoute("/pricing")({
  staticData: { sitemap: true },
  validateSearch: (s: Record<string, unknown>): { checkout?: string } => (typeof s['checkout'] === "string" ? { checkout: s['checkout'] } : {}),
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },{ title: "Tarifs — Masq" }, { name: "description", content: "Offres Gratuit, Plus, Creator et Community." }, { property: "og:title", content: "Tarifs — Masq" }, { property: "og:description", content: "Offres Gratuit, Plus, Creator et Community." }] }),
  component: Pricing,
});

const KEYS: (PlanKey | null)[] = [null, "plus", "creator", "community"];

function Pricing() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const { checkout } = Route.useSearch();
  const checkoutFn = useServerFn(createCheckout);
  const portalFn = useServerFn(createPortal);
  const subFn = useServerFn(getSubscription);
  const [busy, setBusy] = useState<string | null>(null);
  const sub = useQuery({ queryKey: ["subscription", session?.user.id], queryFn: () => subFn(), enabled: !!session, refetchInterval: 60_000 });

  useEffect(() => { if (checkout === "success") { toast.success(t.pricing.success); sub.refetch(); } }, [checkout]); // eslint-disable-line react-hooks/exhaustive-deps

  async function go(kind: string, fn: () => Promise<{ url: string }>) {
    setBusy(kind);
    try { const { url } = await fn(); window.location.href = url; }
    catch { toast.error(t.common.error); setBusy(null); }
  }

  const plans = [t.pricing.plans.free, t.pricing.plans.plus, t.pricing.plans.creator, t.pricing.plans.community];
  const current = sub.data?.plan ?? null;
  return (
    <AppShell>
      <h1 className="mb-3 pt-4 text-3xl font-extrabold">{t.pricing.title}</h1>
      <p className="mb-4 rounded-xl bg-accent p-3 text-sm">{t.pricing.notConfigured}</p>
      {current && (
        <div className="card-surface mb-4 space-y-2 p-4">
          <p className="text-sm">{t.pricing.current} : <strong>{t.pricing.plans[current].name}</strong>
            {sub.data?.periodEnd && <span className="text-muted-foreground"> · {t.pricing.renews} {new Date(sub.data.periodEnd).toLocaleDateString(lang)}</span>}</p>
          <Button variant="secondary" className="w-full" disabled={busy === "portal"} onClick={() => go("portal", () => portalFn())}>{t.pricing.manage}</Button>
        </div>
      )}
      <div className="space-y-3">
        {plans.map((p, i) => {
          const key = KEYS[i];
          const isCurrent = key ? current === key : !current && !!session;
          return (
            <article key={p.name} className={`card-surface p-5 ${isCurrent ? "border-primary" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h2 className="text-xl font-bold">{p.name}</h2>
                <p><span className="font-display text-2xl font-bold">{p.price}</span>{i > 0 && <span className="text-xs text-muted-foreground"> {t.pricing.perMonth}</span>}</p>
              </div>
              {isCurrent && <p className="mt-1 text-xs font-semibold text-primary">{t.pricing.current}</p>}
              <ul className="mt-3 space-y-1.5 text-sm">
                {p.f.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{f}</li>)}
              </ul>
              {key && !isCurrent && (
                session ? (
                  <Button className="mt-4 w-full" variant={i === 1 ? "hero" : "secondary"} disabled={!!busy || !!current}
                    onClick={() => go(key, () => checkoutFn({ data: { plan: key } }))}>{t.pricing.subscribe}</Button>
                ) : (
                  <Button asChild className="mt-4 w-full" variant="secondary"><Link to="/auth" search={{ next: "/pricing" }}>{t.pricing.signInToSubscribe}</Link></Button>
                )
              )}
            </article>
          );
        })}
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">{t.pricing.safetyFree}</p>
      <FooterLinks />
    </AppShell>
  );
}
