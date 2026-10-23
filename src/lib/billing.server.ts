import { PLANS, type PlanKey } from "@/lib/plans";

export async function stripeClient() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("STRIPE_NOT_CONFIGURED");
  const { default: Stripe } = await import("stripe");
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

export async function subscriptionForEmail(email: string) {
  const stripe = await stripeClient();
  const customers = await stripe.customers.list({ email, limit: 1 });
  const customer = customers.data[0]?.id;
  if (!customer) return { plan: null as PlanKey | null, periodEnd: null as string | null };
  const subs = await stripe.subscriptions.list({ customer, status: "active", limit: 100 });
  for (const sub of subs.data) {
    for (const item of sub.items.data) {
      const plan = (Object.keys(PLANS) as PlanKey[]).find((k) => PLANS[k].priceId === item.price.id);
      if (plan) return { plan, periodEnd: item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null };
    }
  }
  return { plan: null as PlanKey | null, periodEnd: null as string | null };
}