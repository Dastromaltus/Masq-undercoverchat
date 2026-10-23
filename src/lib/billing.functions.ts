import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type PlanKey } from "@/lib/plans";

async function stripeClient() {
  const { stripeClient: client } = await import("@/lib/billing.server");
  return client();
}

function origin() {
  const req = getRequest();
  return req.headers.get("origin") ?? new URL(req.url).origin;
}

async function userEmail(supabase: { auth: { getUser: () => Promise<{ data: { user: { email?: string } | null } }> } }) {
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) throw new Error("NO_EMAIL");
  return email;
}

export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { plan: PlanKey }) => {
    if (!(input?.plan in PLANS)) throw new Error("BAD_PLAN");
    return input;
  })
  .handler(async ({ data, context }) => {
    const stripe = await stripeClient();
    const email = await userEmail(context.supabase as never);
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0]?.id;
    const o = origin();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      ...(customer ? { customer } : { customer_email: email }),
      client_reference_id: context.userId,
      line_items: [{ price: PLANS[data.plan].priceId, quantity: 1 }],
      success_url: `${o}/pricing?checkout=success`,
      cancel_url: `${o}/pricing`,
    });
    if (!session.url) throw new Error("CHECKOUT_FAILED");
    return { url: session.url };
  });

export const getSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = await userEmail(context.supabase as never);
    const { subscriptionForEmail } = await import("@/lib/billing.server");
    return subscriptionForEmail(email);
  });

export const createPortal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const stripe = await stripeClient();
    const email = await userEmail(context.supabase as never);
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customer = customers.data[0]?.id;
    if (!customer) throw new Error("NO_CUSTOMER");
    const portal = await stripe.billingPortal.sessions.create({ customer, return_url: `${origin()}/pricing` });
    return { url: portal.url };
  });
