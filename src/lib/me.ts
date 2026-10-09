import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const meQuery = queryOptions({
  queryKey: ["me"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw new Error("AUTH_REQUIRED");
    const [p, s, r] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", u.user.id).single(),
      supabase.from("inbox_settings").select("*").eq("user_id", u.user.id).single(),
      supabase.from("user_roles").select("role").eq("user_id", u.user.id),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    const roles = (r.data ?? []).map((x) => x.role);
    return { profile: p.data, settings: s.data, isStaff: roles.includes("admin") || roles.includes("moderator") };
  },
});

export const publicUrl = (username: string) =>
  typeof window !== "undefined" ? `${window.location.origin}/u/${username}` : `/u/${username}`;
