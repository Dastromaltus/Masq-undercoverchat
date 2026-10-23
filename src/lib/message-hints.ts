import type { PlanKey } from "@/lib/plans";

export const HINT_GENDERS = ["man", "woman", "nonbinary"] as const;
export const HINT_REGIONS = ["antilles", "europe", "north_america", "south_america", "africa", "asia", "oceania"] as const;
export type HintGender = typeof HINT_GENDERS[number];
export type HintRegion = typeof HINT_REGIONS[number];
export type MessageHints = { gender: HintGender | null; region: HintRegion | null };
export type HintResult = { state: "none" } | { state: "locked"; count: number } | { state: "available"; hints: MessageHints };

export function hintPayload(consent: boolean, gender: HintGender | "", region: HintRegion | "") {
  return { _hint_consent: consent, _hint_gender: consent && gender ? gender : null, _hint_region: consent && region ? region : null };
}

export function parseMessageHints(value: unknown): MessageHints {
  if (!value || typeof value !== "object") throw new Error("BAD_HINT");
  const { gender, region } = value as Record<string, unknown>;
  if (gender !== null && !HINT_GENDERS.some((g) => g === gender)) throw new Error("BAD_HINT");
  if (region !== null && !HINT_REGIONS.some((r) => r === region)) throw new Error("BAD_HINT");
  return { gender: gender as HintGender | null, region: region as HintRegion | null };
}

// Status verifies recipient ownership before any billing lookup or privileged read.
export async function resolveMessageHints(deps: {
  status: () => Promise<number>;
  plan: () => Promise<PlanKey | null>;
  read: () => Promise<MessageHints>;
}): Promise<HintResult> {
  const count = await deps.status();
  if (!count) return { state: "none" };
  const plan = await deps.plan();
  if (!plan || !["plus", "creator", "community"].includes(plan)) return { state: "locked", count };
  return { state: "available", hints: await deps.read() };
}