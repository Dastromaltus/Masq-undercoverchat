import { describe, expect, it, vi } from "vitest";
import { hintPayload, parseMessageHints, resolveMessageHints } from "@/lib/message-hints";

describe("Consented hints", () => {
  it("shares nothing without consent", () => {
    expect(hintPayload(false, "man", "antilles")).toEqual({ _hint_consent: false, _hint_gender: null, _hint_region: null });
  });
  it("keeps only voluntary declarations", () => {
    expect(hintPayload(true, "man", "antilles")).toEqual({ _hint_consent: true, _hint_gender: "man", _hint_region: "antilles" });
  });
  it("does not fabricate hints when neither is selected", () => {
    expect(hintPayload(true, "", "")).toEqual({ _hint_consent: true, _hint_gender: null, _hint_region: null });
  });
  it("rejects precise or unsupported locations", () => {
    expect(() => parseMessageHints({ gender: "man", region: "Fort-de-France" })).toThrow("BAD_HINT");
  });
  it("does not return identity fields", () => {
    expect(parseMessageHints({ gender: "man", region: "antilles", sender_id: "private" })).toEqual({ gender: "man", region: "antilles" });
  });
  it("checks ownership before billing or hint access", async () => {
    const plan = vi.fn(); const read = vi.fn();
    await expect(resolveMessageHints({ status: async () => { throw new Error("NOT_FOUND"); }, plan, read })).rejects.toThrow("NOT_FOUND");
    expect(plan).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
  });
  it("does not upsell when no hints exist", async () => {
    const plan = vi.fn(); const read = vi.fn();
    expect(await resolveMessageHints({ status: async () => 0, plan, read })).toEqual({ state: "none" });
    expect(plan).not.toHaveBeenCalled(); expect(read).not.toHaveBeenCalled();
  });
  it("never reads hint values for a free account", async () => {
    const read = vi.fn();
    expect(await resolveMessageHints({ status: async () => 2, plan: async () => null, read })).toEqual({ state: "locked", count: 2 });
    expect(read).not.toHaveBeenCalled();
  });
  it.each(["plus", "creator", "community"] as const)("allows %s paid subscribers", async (plan) => {
    expect(await resolveMessageHints({ status: async () => 2, plan: async () => plan, read: async () => ({ gender: "man", region: "antilles" }) })).toEqual({ state: "available", hints: { gender: "man", region: "antilles" } });
  });
  it("fails closed when Stripe cannot verify entitlement", async () => {
    const read = vi.fn();
    await expect(resolveMessageHints({ status: async () => 2, plan: async () => { throw new Error("STRIPE_UNAVAILABLE"); }, read })).rejects.toThrow("STRIPE_UNAVAILABLE");
    expect(read).not.toHaveBeenCalled();
  });
});