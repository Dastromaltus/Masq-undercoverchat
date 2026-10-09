import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PollView = {
  id: string;
  question: string;
  multiple: boolean;
  closes_at: string | null;
  results_visibility: "always" | "after_vote" | "after_close";
  closed: boolean;
  has_voted: boolean;
  is_owner: boolean;
  results_visible: boolean;
  owner_username: string;
  total_ballots: number | null;
  options: { id: string; label: string; count: number | null }[];
};

export const pollQuery = (id: string) =>
  queryOptions({
    queryKey: ["poll", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_poll", { _poll_id: id });
      if (error) throw error;
      return (data as unknown as PollView | null) ?? null;
    },
  });

export function errorCode<T extends Record<string, string>>(msg: string, dict: T): keyof T | undefined {
  return (Object.keys(dict) as (keyof T)[]).find((k) => msg.includes(String(k)));
}
