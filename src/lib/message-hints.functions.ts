import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseMessageHints, resolveMessageHints } from "@/lib/message-hints";

export const getMessageHints = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { messageId: string }) => {
    if (!input || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.messageId)) throw new Error("BAD_ID");
    return { messageId: input.messageId };
  })
  .handler(async ({ data, context }) => {
    setResponseHeader("Cache-Control", "no-store");
    return resolveMessageHints({
      status: async () => {
        const { data: count, error } = await context.supabase.rpc("get_message_hint_status", { _message_id: data.messageId });
        if (error) throw new Error("NOT_FOUND");
        return count;
      },
      plan: async () => {
        const { data: user, error } = await context.supabase.auth.getUser();
        if (error || !user.user?.email) throw new Error("AUTH_REQUIRED");
        const { subscriptionForEmail } = await import("@/lib/billing.server");
        return (await subscriptionForEmail(user.user.email)).plan;
      },
      read: async () => {
        // This privileged RPC is unreachable until ownership and paid entitlement pass.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: hints, error } = await supabaseAdmin.rpc("read_paid_message_hints", { _message_id: data.messageId, _recipient_id: context.userId });
        if (error) throw new Error("HINT_READ_FAILED");
        return parseMessageHints(hints);
      },
    });
  });